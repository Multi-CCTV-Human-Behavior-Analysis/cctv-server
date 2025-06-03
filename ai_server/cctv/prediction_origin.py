import sys
sys.path.append('/root/install_stgcn/st-gcn')

from net.st_gcn import Model
import numpy as np
import torch
import torch.nn.functional as F
import pickle

# 데이터 및 라벨 로드

data = np.load('falling_origin.npy')  


print(f"{data.shape}")

# 모델 로드
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = Model(in_channels=3, num_class=2, edge_importance_weighting=True,
              graph_args={'layout': 'openpose', 'strategy': 'uniform'})
model.load_state_dict(torch.load('/root/install_stgcn/st-gcn/work_dir/shuffle_combined_model_f_3s/epoch200_model.pt', map_location=device))
model.eval().to(device)

# 클래스 이름 정의
class_names = ['normal', 'fall']

# 예측 확인 루프
print("-" * 70)

time =1
for i in range(len(data)):
    sample = torch.tensor(data[i]).unsqueeze(0).float().to(device)  # (1, 3, 30, 18, 1)
    print(sample.shape)
    with torch.no_grad():
        output = model(sample)
        probs = F.softmax(output, dim=1).cpu().numpy()[0]
        pred = np.argmax(probs)

    match = 'normal' if pred == 0 else 'fall'
    print(f"{time}초: {match}")
    if(time%30) == 0:
        print('\n')
    time = time+1

# 전체 정확도 출력








