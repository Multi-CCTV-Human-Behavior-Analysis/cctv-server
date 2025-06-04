import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
print("[flask_ai_server] sys.path 설정 완료")

from flask import Flask, jsonify, Response, request, send_from_directory
import cv2
import numpy as np
import mediapipe as mp
from PIL import Image
import torch
import torch.nn.functional as F
import traceback
from net.st_gcn import Model
import time
import requests
import threading
from flask_cors import CORS
import datetime
import json

RTSP_URL1 = "rtsp://admin:123456@172.30.1.1:554/stream1"
RTSP_URL = "rtsp://admin:123456@172.30.1.1:554/stream2"

app = Flask(__name__)
CORS(app)
mp_pose = mp.solutions.pose

def send_event_to_java(event_data):
    url = "http://localhost:8081/api/history/event"  # 자바 서버 주소 (엔드포인트 수정)
    try:
        response = requests.post(url, json=event_data)
        if response.status_code == 200:
            print(f"[flask_ai_server] 이벤트 전송 성공: {event_data}")
        else:
            print(f"[flask_ai_server] 이벤트 전송 실패: status={response.status_code}, body={response.text}")
    except Exception as e:
        print("[flask_ai_server] 이벤트 전송 예외:", e)

# 모델 로드 (서버 시작 시 1회)
print("[flask_ai_server] 모델 로드 시작")
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = Model(in_channels=3, num_class=2, edge_importance_weighting=True,
              graph_args={'layout': 'openpose', 'strategy': 'uniform'})
model.load_state_dict(torch.load('./epoch200_model.pt', map_location=device))
model.eval().to(device)
class_names = ['normal', 'FALL']
print("[flask_ai_server] 모델 로드 완료")

def update_recordings_json(new_filename):
    json_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../frontend/public/recordings/recordings.json'))
    try:
        if os.path.exists(json_path):
            with open(json_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            if new_filename not in data:
                data.append(new_filename)
        else:
            data = [new_filename]
        # 최신순 정렬(옵션)
        data = sorted(data, reverse=True)
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print("[flask_ai_server] recordings.json 업데이트 실패:", e)

def sync_recordings_json():
    recordings_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../frontend/public/recordings'))
    json_path = os.path.join(recordings_dir, 'recordings.json')
    try:
        files = [f for f in os.listdir(recordings_dir) if f.endswith('.mp4')]
        files = sorted(files, reverse=True)
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(files, f, ensure_ascii=False, indent=2)
        print(f"[flask_ai_server] recordings.json 동기화 완료: {len(files)}개 파일")
    except Exception as e:
        print("[flask_ai_server] recordings.json 동기화 실패:", e)

def camera_loop():
    cap = cv2.VideoCapture(RTSP_URL)
    if not cap.isOpened():
        print("[flask_ai_server] RTSP 스트림 열기 실패")
        return
    print("[flask_ai_server] RTSP 스트림 열기 성공")
    skeleton_buffer = []
    SEQ_LEN = 30  # 시퀀스 길이
    V_MODEL = 18  # openpose 18관절
    OPENPOSE_18_IDX = [
        0, 11, 13, 15, 12, 14, 16, 23, 25, 27, 24, 26, 28, 5, 2, 6, 3, 1
    ]
    last_event_time = 0  # 마지막 이벤트 전송 시각

    # === 영상 저장 관련 변수 ===
    save_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../frontend/public/recordings'))
    os.makedirs(save_dir, exist_ok=True)
    fourcc = cv2.VideoWriter_fourcc(*'avc1')
    fps = 30  # 카메라 fps에 맞게 조정
    out = None
    last_minute = None

    with mp_pose.Pose(static_image_mode=False) as pose:
        while True:
            ret, frame = cap.read()
            if not ret:
                print("[flask_ai_server] 프레임 읽기 실패")
                break

            # === 1분 단위로 파일 저장 ===
            now = datetime.datetime.now()
            current_minute = now.strftime('%Y%m%d_%H%M')
            if last_minute != current_minute:
                if out is not None:
                    out.release()
                filename = f"stream_{current_minute}.mp4"
                filepath = os.path.join(save_dir, filename)
                h, w = frame.shape[:2]
                out = cv2.VideoWriter(filepath, fourcc, fps, (w, h))
                last_minute = current_minute
                # recordings.json에 파일명 추가
                update_recordings_json(filename)
            if out is not None:
                out.write(frame)

            img_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = pose.process(img_rgb)
            if not results.pose_landmarks:
                continue
            # mediapipe 33개 관절 중 openpose 18관절만 추출
            skeleton = []
            for idx in OPENPOSE_18_IDX:
                lm = results.pose_landmarks.landmark[idx]
                skeleton.append([lm.x, lm.y, lm.z])
            skeleton = np.array(skeleton).T  # (3, 18)
            skeleton_buffer.append(skeleton)
            if len(skeleton_buffer) > SEQ_LEN:
                skeleton_buffer.pop(0)
            if len(skeleton_buffer) == SEQ_LEN:
                seq = np.stack(skeleton_buffer, axis=1)  # (3, 30, 18)
                seq = seq[np.newaxis, ...]  # (1, 3, 30, 18)
                seq = np.expand_dims(seq, -1)  # (1, 3, 30, 18, 1)
                seq = torch.tensor(seq, dtype=torch.float32, device=device)
                with torch.no_grad():
                    out_pred = model(seq)
                    prob = F.softmax(out_pred, dim=1)
                    pred = prob.argmax(dim=1).item()
                    print(f"[flask_ai_server] 모델 추론 결과: class={class_names[pred]}, prob={prob[0, pred].item():.4f}")
                    if class_names[pred] == 'FALL' and prob[0, pred].item() > 0.8:
                        now_event = time.time()
                        if now_event - last_event_time > 1.0:  # 1초에 한 번만 전송
                            event = {"type": "FALL", "prob": float(prob[0, pred].item()), "timestamp": now_event}
                            send_event_to_java(event)
                            last_event_time = now_event
                        cv2.putText(frame, "FALL DETECTED!", (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0,0,255), 3)
            mp.solutions.drawing_utils.draw_landmarks(
                frame, results.pose_landmarks, mp_pose.POSE_CONNECTIONS)
        cap.release()
    if out is not None:
        out.release()

def gen_skeleton_frames(rtsp_url):
    cap = cv2.VideoCapture(rtsp_url)
    mp_pose = mp.solutions.pose
    with mp_pose.Pose(static_image_mode=False) as pose:
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            img_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = pose.process(img_rgb)
            if results.pose_landmarks:
                mp.solutions.drawing_utils.draw_landmarks(
                    frame, results.pose_landmarks, mp_pose.POSE_CONNECTIONS)
            ret2, buffer = cv2.imencode('.jpg', frame)
            if not ret2:
                continue
            frame_bytes = buffer.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
    cap.release()

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})

@app.route('/video_feed')
def video_feed():
    # 항상 상수 RTSP_URL만 사용
    return Response(gen_skeleton_frames(RTSP_URL1),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    print("[flask_ai_server] 서버 실행 시작")
    sync_recordings_json()  # recordings.json 동기화
    t = threading.Thread(target=camera_loop, daemon=True)
    t.start()
    app.run(host='0.0.0.0', port=5000, debug=True) 