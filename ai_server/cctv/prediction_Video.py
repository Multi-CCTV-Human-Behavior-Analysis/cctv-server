import sys
sys.path.append('/root/install_stgcn/st-gcn')
from net.st_gcn import Model
import cv2
import torch
import numpy as np
import torch.nn.functional as F
from torch.utils.data import DataLoader, Dataset

class PoseDataset(Dataset):
    def __init__(self, data):
        self.data = data

    def __len__(self):
        return len(self.data)

    def __getitem__(self, idx):
        sample = torch.tensor(self.data[idx]).float()
        return sample

def process_video_with_text(input_video_path, output_video_path, dataloader, model, device):
    cap = cv2.VideoCapture(input_video_path)

    if not cap.isOpened():
        print(f"Error: Failed to open video file {input_video_path}")
        return

    input_fps = int(cap.get(cv2.CAP_PROP_FPS))	
    print(f"Input video FPS: {input_fps}")

    fourcc = cv2.VideoWriter_fourcc(*'mp4v')  # 'mp4v' 코덱 사용
    frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    out = cv2.VideoWriter(output_video_path, fourcc, input_fps, (frame_width, frame_height))  # 출력 비디오 FPS는 입력 비디오의 FPS로 설정
    frame_count = 0
    read_count = 0

    for samples in dataloader:
        samples = samples.to(device)

        with torch.no_grad():
            outputs = model(samples)  # 배치에 대해 예측
            probs = F.softmax(outputs, dim=1).cpu().numpy()  # 확률 계산
            preds = np.argmax(probs, axis=1)  # 예측 결과 (falling: 1, normal: 0)

        for batch_idx in range(samples.size(0)):  # 배치 내의 각 예측을 순차적으로 처리
            print(f"{batch_idx} in {range(samples.size(0))}")
            label = 'falling' if preds[batch_idx] == 1 else 'normal'
            print(preds)

            for i in range(input_fps):
                ret, frame = cap.read()
                read_count += 1

                if not ret:
                    print("Error: Failed to read frame.")
                    break

                cv2.putText(frame, f'Prediction: {label}', (20, 150), cv2.FONT_HERSHEY_SIMPLEX, 1, (0,0,0), 3)
                out.write(frame)

    print(f"총{read_count} 저장")
    cap.release()
    out.release()

data = np.load('falling_origin.npy')
print(data.shape)

dataset = PoseDataset(data)
dataloader = DataLoader(dataset, batch_size=32, shuffle=False)

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = Model(in_channels=3, num_class=2, edge_importance_weighting=True,
              graph_args={'layout': 'openpose', 'strategy': 'uniform'})
model.load_state_dict(torch.load('/root/install_stgcn/st-gcn/work_dir/shuffle_combined_model_f_3s/epoch200_model.pt', map_location=device))
model.eval().to(device)

input_video_path = '/root/install_stgcn/st-gcn/pkl/falling_original.avi'
output_video_path = '/root/install_stgcn/st-gcn/pkl/predict_video_dloader.mp4'

process_video_with_text(input_video_path, output_video_path, dataloader, model, device)
