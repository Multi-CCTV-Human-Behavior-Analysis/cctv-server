import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
print("[flask_ai_server] sys.path 설정 완료")

from flask import Flask, jsonify, Response, request
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

RTSP_URL = "rtsp://admin:123456@172.30.1.1:554/stream2"

app = Flask(__name__)
CORS(app)
mp_pose = mp.solutions.pose

def send_event_to_java(event_data):
    url = "http://localhost:8081/event"  # 자바 서버 주소
    try:
        requests.post(url, json=event_data)
        print(f"[flask_ai_server] 이벤트 전송: {event_data}")
    except Exception as e:
        print("[flask_ai_server] 이벤트 전송 실패:", e)

# 모델 로드 (서버 시작 시 1회)
print("[flask_ai_server] 모델 로드 시작")
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = Model(in_channels=3, num_class=2, edge_importance_weighting=True,
              graph_args={'layout': 'openpose', 'strategy': 'uniform'})
model.load_state_dict(torch.load('./epoch200_model.pt', map_location=device))
model.eval().to(device)
class_names = ['normal', 'thief']
print("[flask_ai_server] 모델 로드 완료")

def camera_loop():
    cap = cv2.VideoCapture(RTSP_URL)
    if not cap.isOpened():
        print("[flask_ai_server] RTSP 스트림 열기 실패")
        return
    print("[flask_ai_server] RTSP 스트림 열기 성공")
    skeleton_buffer = []
    SEQ_LEN = 30  # 시퀀스 길이
    V_MODEL = 18  # openpose 18관절
    # mediapipe 33개 관절 중 openpose 18관절에 해당하는 인덱스 (예시)
    OPENPOSE_18_IDX = [
        0, 11, 13, 15, 12, 14, 16, 23, 25, 27, 24, 26, 28, 5, 2, 6, 3, 1
    ]
    with mp_pose.Pose(static_image_mode=False) as pose:
        while True:
            ret, frame = cap.read()
            if not ret:
                print("[flask_ai_server] 프레임 읽기 실패")
                break
            img_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = pose.process(img_rgb)
            if not results.pose_landmarks:
                cv2.imshow('RTSP Stream', frame)
                if cv2.waitKey(1) & 0xFF == ord('q'):
                    break
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
                    out = model(seq)
                    prob = F.softmax(out, dim=1)
                    pred = prob.argmax(dim=1).item()
                    print(f"[flask_ai_server] 모델 추론 결과: class={class_names[pred]}, prob={prob[0, pred].item():.4f}")
                    if class_names[pred] == 'thief' and prob[0, pred].item() > 0.8:
                        event = {"type": "thief", "prob": float(prob[0, pred].item()), "timestamp": time.time()}
                        send_event_to_java(event)
                        cv2.putText(frame, "THIEF DETECTED!", (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0,0,255), 3)
            mp.solutions.drawing_utils.draw_landmarks(
                frame, results.pose_landmarks, mp_pose.POSE_CONNECTIONS)
            cv2.imshow('RTSP Stream', frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
    cap.release()
    cv2.destroyAllWindows()

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
    rtsp_url = request.args.get('rtsp', RTSP_URL)
    return Response(gen_skeleton_frames(rtsp_url),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    print("[flask_ai_server] 서버 실행 시작")
    t = threading.Thread(target=camera_loop, daemon=True)
    t.start()
    app.run(host='0.0.0.0', port=5000, debug=True) 