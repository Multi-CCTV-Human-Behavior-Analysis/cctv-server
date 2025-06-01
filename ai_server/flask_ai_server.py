import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
print("[flask_ai_server] sys.path 설정 완료")

from flask import Flask, request, jsonify
import cv2
import numpy as np
import mediapipe as mp
from PIL import Image
import torch
import torch.nn.functional as F
import traceback
from net.st_gcn import Model

app = Flask(__name__)
mp_pose = mp.solutions.pose

# 모델 로드 (서버 시작 시 1회)
print("[flask_ai_server] 모델 로드 시작")
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = Model(in_channels=3, num_class=2, edge_importance_weighting=True,
              graph_args={'layout': 'openpose', 'strategy': 'uniform'})
model.load_state_dict(torch.load('./epoch200_model.pt', map_location=device))
model.eval().to(device)
class_names = ['normal', 'thief']
print("[flask_ai_server] 모델 로드 완료")

@app.route('/analyze', methods=['POST'])
def analyze():
    print("[flask_ai_server] /analyze 진입")
    try:
        file = request.files['frame']
        print("[flask_ai_server] 파일 수신 완료")
        img = Image.open(file.stream).convert('RGB')
        img_np = np.array(img)
        print("[flask_ai_server] 이미지 변환 완료")
        # mediapipe로 skeleton 추출
        with mp_pose.Pose(static_image_mode=True) as pose:
            results = pose.process(img_np)
            print("[flask_ai_server] mediapipe 추론 완료")
            if not results.pose_landmarks:
                print("[flask_ai_server] 관절점 없음")
                return jsonify({'error': 'No skeleton detected'}), 400
            # 관절점 좌표 추출
            skeleton = []
            for lm in results.pose_landmarks.landmark:
                skeleton.append([lm.x, lm.y, lm.z])
            skeleton = np.array(skeleton).T  # (3, N)
            skeleton = skeleton[np.newaxis, ...]  # (1, 3, N)
            skeleton = torch.tensor(skeleton, dtype=torch.float32, device=device)
            print("[flask_ai_server] skeleton tensor 변환 완료")
            # 모델 추론
            with torch.no_grad():
                out = model(skeleton)
                prob = F.softmax(out, dim=1)
                pred = prob.argmax(dim=1).item()
                print(f"[flask_ai_server] 모델 추론 결과: class={class_names[pred]}, prob={prob[0, pred].item():.4f}")
            return jsonify({
                'class': class_names[pred],
                'prob': float(prob[0, pred].item())
            })
    except Exception as e:
        print("[flask_ai_server] 예외 발생:", e)
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("[flask_ai_server] 서버 실행 시작")
    app.run(host='0.0.0.0', port=5000, debug=True) 