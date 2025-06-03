import sys
import json
import torch
import torch.nn.functional as F
import numpy as np
from net.st_gcn import Model
import traceback

print("[PYTHON DEBUG] prediction.py 시작", file=sys.stderr)
# 모델 로드
print("[PYTHON DEBUG] 모델 로드 시작", file=sys.stderr)
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = Model(in_channels=3, num_class=2, edge_importance_weighting=True,
              graph_args={'layout': 'openpose', 'strategy': 'uniform'})
model.load_state_dict(torch.load('./epoch200_model.pt', map_location=device))
model.eval().to(device)
class_names = ['normal', 'thief']
print("[PYTHON DEBUG] 모델 로드 완료", file=sys.stderr)

try:
    # 표준 입력으로 JSON 받기
    print("[PYTHON DEBUG] 입력 대기", file=sys.stderr)
    input_json = sys.stdin.read()
    print("[PYTHON DEBUG] stdin:", input_json, file=sys.stderr)
    input_data = json.loads(input_json)
    print("[PYTHON DEBUG] parsed:", input_data, file=sys.stderr)
    skeleton = np.array(input_data['skeleton'])
    print("[PYTHON DEBUG] skeleton.shape:", skeleton.shape, file=sys.stderr)

    print("[PYTHON DEBUG] 추론 시작", file=sys.stderr)
    sample = torch.tensor(skeleton).unsqueeze(0).float().to(device)
    with torch.no_grad():
        output = model(sample)
        probs = F.softmax(output, dim=1).cpu().numpy()[0]
        pred = int(np.argmax(probs))
        result = {
            'class': class_names[pred],
            'prob': float(probs[pred])
        }
    print("[PYTHON DEBUG] 추론 완료", file=sys.stderr)
    print("[PYTHON DEBUG] 결과 출력 직전", file=sys.stderr)
    print(json.dumps(result))
except Exception as e:
    print("[PYTHON ERROR]", e, file=sys.stderr)
    traceback.print_exc(file=sys.stderr)
    sys.exit(1)

