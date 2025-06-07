import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../st-gcn')))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../st-gcn/net')))

from flask import Flask, Response, jsonify
import cv2
import mediapipe as mp
import numpy as np
import torch
import torch.nn.functional as F
from net.st_gcn import Model
import time
import requests
import threading
from flask_cors import CORS
import datetime
import json
import traceback

app = Flask(__name__)
CORS(app)

# RTSP URL 설정
RTSP_URL1 = "rtsp://admin:123456@172.30.1.1:554/stream1"
RTSP_URL2 = "rtsp://admin:123456@172.30.1.1:554/stream2"

mp_pose = mp.solutions.pose
pose = mp_pose.Pose(static_image_mode=False, model_complexity=1)
mp_drawing = mp.solutions.drawing_utils

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

model = Model(in_channels=3, num_class=2, edge_importance_weighting=True,
              graph_args={'layout': 'openpose', 'strategy': 'uniform'})
model.load_state_dict(torch.load('/Users/lee/Documents/cctv-server/new_ai_server/st-gcn/model/epoch200_model.pt', map_location=device))
model.eval().to(device)

class_names = ['Normal', 'Fall']

COCO_ORDERED_LANDMARKS = [
    0, None, 11, 13, 15, 12, 14, 16,
    23, 25, 27, 24, 26, 28,
    5, 2, 6, 3
]

frame_buffer = []
FRAME_LEN = 30
NUM_JOINTS = 18
CHANNELS = 3
MAX_PERSON = 1

def extract_keypoints(results, img_h, img_w):
    """
    MediaPipe 포즈 랜드마크를 OpenPose 형식의 키포인트로 변환
    """
    keypoints = np.zeros((CHANNELS, NUM_JOINTS, MAX_PERSON))
    if results.pose_landmarks:
        lm = results.pose_landmarks.landmark
        for k, idx in enumerate(COCO_ORDERED_LANDMARKS):
            if idx is None:  # 목 관절은 어깨의 중간점으로 계산
                l = lm[11]
                r = lm[12]
                x = (l.x + r.x) / 2
                y = (l.y + r.y) / 2
                conf = (l.visibility + r.visibility) / 2
            else:
                point = lm[idx]
                x, y, conf = point.x, point.y, point.visibility
            keypoints[0, k, 0] = x * img_w  # x 좌표
            keypoints[1, k, 0] = y * img_h  # y 좌표
            keypoints[2, k, 0] = conf       # 신뢰도
    return keypoints

def predict_if_ready():
    """
    30프레임이 모이면 모델로 예측 수행
    """
    if len(frame_buffer) == FRAME_LEN:
        np_data = np.stack(frame_buffer, axis=1)
        input_tensor = torch.tensor(np_data, dtype=torch.float32).unsqueeze(0).to(device)
        with torch.no_grad():
            output = model(input_tensor)
            probs = F.softmax(output, dim=1).cpu().numpy()[0]
            pred = np.argmax(probs)
        frame_buffer.pop(0)  # 가장 오래된 프레임 제거
        return class_names[pred], probs
    return "Loading...", [0.0, 0.0]

def send_event_to_java(event_data):
    """
    낙상 감지 시 자바 백엔드로 이벤트 전송
    """
    url = "http://localhost:8081/api/history/event"
    try:
        response = requests.post(url, json=event_data)
        if response.status_code == 200:
            print(f"[cam_server] 이벤트 전송 성공: {event_data}")
        else:
            print(f"[cam_server] 이벤트 전송 실패: status={response.status_code}, body={response.text}")
    except Exception as e:
        print("[cam_server] 이벤트 전송 예외:", e)

def update_recordings_json(new_filename):
    """
    새로운 녹화 파일명을 recordings.json에 추가
    """
    json_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../frontend/public/recordings/recordings.json'))
    try:
        if os.path.exists(json_path):
            with open(json_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            if new_filename not in data:
                data.append(new_filename)
        else:
            data = [new_filename]
        data = sorted(data, reverse=True)  # 최신순 정렬
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print("[cam_server] recordings.json 업데이트 실패:", e)

def sync_recordings_json():
    """
    recordings 디렉토리의 모든 MP4 파일을 recordings.json에 동기화
    """
    recordings_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../frontend/public/recordings'))
    json_path = os.path.join(recordings_dir, 'recordings.json')
    try:
        files = [f for f in os.listdir(recordings_dir) if f.endswith('.mp4')]
        files = sorted(files, reverse=True)
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(files, f, ensure_ascii=False, indent=2)
        print(f"[cam_server] recordings.json 동기화 완료: {len(files)}개 파일")
    except Exception as e:
        print("[cam_server] recordings.json 동기화 실패:", e)

def camera_loop():
    """
    백그라운드에서 실행되는 메인 루프
    - 영상 녹화
    - 낙상 감지
    - 이벤트 전송
    """
    cap = cv2.VideoCapture(RTSP_URL2)  # stream2 사용
    if not cap.isOpened():
        print("[cam_server] RTSP 스트림 열기 실패")
        return
    
    print("[cam_server] RTSP 스트림 열기 성공")
    
    # 영상 저장 관련 변수
    save_dir = "/Users/lee/Documents/cctv-server/frontend/public/recordings"
    os.makedirs(save_dir, exist_ok=True)
    print(f"[cam_server] 저장 디렉토리: {save_dir}")
    
    fourcc = cv2.VideoWriter_fourcc(*'avc1')
    fps = 30
    out = None
    last_minute = None
    last_event_time = 0
    
    while True:
        try:
            success, frame = cap.read()
            if not success:
                print("[cam_server] 프레임 읽기 실패")
                time.sleep(1)  # 잠시 대기 후 재시도
                continue
                
            # 1분 단위로 파일 저장
            now = datetime.datetime.now()
            current_minute = now.strftime('%Y%m%d_%H%M')
            
            # 새로운 분이 시작되면 새 파일 생성
            if last_minute != current_minute:
                if out is not None:
                    out.release()
                    print(f"[cam_server] 이전 파일 저장 완료: {last_minute}")
                
                filename = f"stream_{current_minute}.mp4"
                filepath = os.path.join(save_dir, filename)
                h, w = frame.shape[:2]
                out = cv2.VideoWriter(filepath, fourcc, fps, (w, h))
                
                if not out.isOpened():
                    print(f"[cam_server] 새 파일 생성 실패: {filepath}")
                else:
                    print(f"[cam_server] 새 파일 생성: {filepath}")
                    last_minute = current_minute
                    update_recordings_json(filename)
            
            # 프레임 저장
            if out is not None and out.isOpened():
                out.write(frame)
                
            # 포즈 추출 및 낙상 감지
            h, w, _ = frame.shape
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = pose.process(rgb)
            keypoints = extract_keypoints(results, h, w)
            frame_buffer.append(keypoints)
            label, probs = predict_if_ready()
            
            # 낙상 감지 시 이벤트 전송 (1초에 한 번만)
            if label == 'Fall' and probs[1] > 0.8:
                now_event = time.time()
                if now_event - last_event_time > 1.0:
                    event = {"type": "FALL", "prob": float(probs[1]), "timestamp": now_event}
                    send_event_to_java(event)
                    last_event_time = now_event
                    
        except Exception as e:
            print(f"[cam_server] 예외 발생: {str(e)}")
            print(traceback.format_exc())
            time.sleep(1)  # 예외 발생 시 잠시 대기
            continue
    
    # 종료 시 정리
    if out is not None:
        out.release()
        print("[cam_server] 마지막 파일 저장 완료")
    cap.release()
    print("[cam_server] 카메라 루프 종료")

def gen_frames(rtsp_url):
    """
    웹 스트리밍을 위한 프레임 생성 함수
    - 포즈 추출
    - 낙상 감지
    - 시각화
    """
    cap = cv2.VideoCapture(rtsp_url)
    if not cap.isOpened():
        print("[cam_server] RTSP 스트림 열기 실패")
        return
    
    print("[cam_server] RTSP 스트림 열기 성공")
    
    while True:
        success, frame = cap.read()
        if not success:
            print("[cam_server] 프레임 읽기 실패")
            break
            
        # 포즈 추출 및 낙상 감지
        h, w, _ = frame.shape
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = pose.process(rgb)
        keypoints = extract_keypoints(results, h, w)
        frame_buffer.append(keypoints)
        label, probs = predict_if_ready()
        
        # 결과 시각화
        color = (0, 255, 0) if label == 'Normal' else (0, 0, 255)
        if results.pose_landmarks:
            mp_drawing.draw_landmarks(frame, results.pose_landmarks, mp_pose.POSE_CONNECTIONS)
        cv2.putText(frame, f'Prediction: {label}', (20, 50),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, color, 2)
        _, buffer = cv2.imencode('.jpg', frame)
        frame = buffer.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
    
    cap.release()

@app.route('/health', methods=['GET'])
def health():
    """서버 상태 확인용 엔드포인트"""
    return jsonify({'status': 'ok'})

@app.route('/video_feed')
def video_feed():
    """일반 스트림 제공 엔드포인트 (stream1)"""
    return Response(gen_frames(RTSP_URL1), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/video')
def video():
    """낙상 감지 스트림 제공 엔드포인트 (stream2)"""
    return Response(gen_frames(RTSP_URL2), mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    print("[cam_server] 서버 실행 시작")
    sync_recordings_json()  # recordings.json 동기화
    t = threading.Thread(target=camera_loop, daemon=True)  # 백그라운드 스레드로 녹화 및 감지 실행
    t.start()
    app.run(host='0.0.0.0', port=5050)
