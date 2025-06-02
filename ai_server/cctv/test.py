import sys
import os
import cv2
import torch
import numpy as np
import torch.nn.functional as F
from torch.utils.data import DataLoader, Dataset

# ST-GCN 경로 등록
sys.path.append('/root/install_stgcn/st-gcn')
from net.st_gcn import Model

# === 경로 설정 ===
FRAME_FOLDER = '/root/install_stgcn/st-gcn/pkl/2246674/with_keypoints'
SAVE_FOLDER = '/root/install_stgcn/st-gcn/pkl/fall_detected_frames'
DATA_PATH = '/root/install_stgcn/st-gcn/pkl/fallingorigin.npy'
MODEL_PATH = '/root/install_stgcn/st-gcn/work_dir/shuffle_combined_model_f_3s/epoch200_model.pt'

os.makedirs(SAVE_FOLDER, exist_ok=True)

# === 실제 프레임 번호 추출 (frame_4265.jpg 등에서 숫자만) ===
image_files = sorted([f for f in os.listdir(FRAME_FOLDER) if f.endswith('.jpg')])
frame_numbers = [int(f.split('_')[1].split('.')[0]) for f in image_files]
frame_numbers.sort()

# === 데이터셋 클래스 ===
class PoseDataset(Dataset):
    def __init__(self, data):
        self.data = data

    def __len__(self):
        return len(self.data)

    def __getitem__(self, idx):
        sample = torch.tensor(self.data[idx]).float()
        return sample

# === 데이터 및 모델 불러오기 ===
data = np.load(DATA_PATH)
print(f"📦 Data shape: {data.shape}")

dataset = PoseDataset(data)
dataloader = DataLoader(dataset, batch_size=1, shuffle=False)

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = Model(in_channels=3, num_class=2, edge_importance_weighting=True,
              graph_args={'layout': 'openpose', 'strategy': 'uniform'})
model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
model.eval().to(device)

# === 추론 및 낙상 프레임 저장 (시퀀스 마지막 프레임 기준) ===
window_size = 30
sample_index = 0
fall_count = 0

for batch in dataloader:
    batch = batch.to(device)
    with torch.no_grad():
        output = model(batch)
        probs = F.softmax(output, dim=1).cpu().numpy()[0]
        pred = np.argmax(probs)

    if pred == 1:
        # 시퀀스 마지막 프레임 기준
        frame_pos = sample_index * window_size + (window_size - 1)

        if frame_pos < len(frame_numbers):
            real_frame_num = frame_numbers[frame_pos]
            frame_name = f'frame_{real_frame_num}.jpg'
            frame_path = os.path.join(FRAME_FOLDER, frame_name)

            if os.path.exists(frame_path):
                save_path = os.path.join(SAVE_FOLDER, f'fall_{real_frame_num}.jpg')
                img = cv2.imread(frame_path)
                cv2.imwrite(save_path, img)
                print(f"💥 Fall detected at frame {real_frame_num}, saved to {save_path}")
                fall_count += 1
            else:
                print(f"⚠️ Frame not found: {frame_path}")
        else:
            print(f"⚠️ Frame index {frame_pos} out of range.")

    sample_index += 1

print(f"\n✅ Finished. {fall_count} fall frame(s) saved to: {SAVE_FOLDER}")

