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

    fourcc = cv2.VideoWriter_fourcc(*'XVID')
    frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    out = cv2.VideoWriter(output_video_path, fourcc, 30.0, (frame_width, frame_height))
    
    frame_counter = 0
    prediction_duration = original_video_fps = 3
    pred_idx = 0
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    print(f"Total frames in video: {total_frames}")

    for samples in dataloader:
        samples = samples.to(device)

        with torch.no_grad():
            outputs = model(samples)
            probs = F.softmax(outputs, dim=1).cpu().numpy()
            preds = np.argmax(probs, axis=1)

        print(f"Processed {len(samples)} samples in current batch.")
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                print("Error: Failed to read frame.")
                break

            if frame_counter % prediction_duration == 0 and pred_idx < len(preds):
                pred = preds[pred_idx]
                label = 'Normal' if pred == 0 else 'Fall Detection'

            cv2.putText(frame, f'Prediction: {label}', (0, 50), cv2.FONT_HERSHEY_SIMPLEX, 3, (0, 255, 0), 5)
            out.write(frame)

            frame_counter += 1

            if frame_counter % prediction_duration == 0:
                pred_idx += 1
                print(f"Prediction {pred_idx} out of {len(preds)}")

                if pred_idx >= len(preds):
                    print("Predictions finished for this batch.")
                    break
            
            # Print progress every 100 frames
            if frame_counter % 100 == 0:
                print(f"Processed {frame_counter}/{total_frames} frames")

    cap.release()
    out.release()
    print("Video processing complete.")

data = np.load('fallingorigin.npy')
print(f"Data shape: {data.shape}")

dataset = PoseDataset(data)
dataloader = DataLoader(dataset, batch_size=32, shuffle=False)

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = Model(in_channels=3, num_class=2, edge_importance_weighting=True,
              graph_args={'layout': 'openpose', 'strategy': 'uniform'})
model_path = '/root/install_stgcn/st-gcn/work_dir/shuffle_combined_model_f_3s/epoch200_model.pt'


model.load_state_dict(torch.load(model_path))
model.eval().to(device)

input_video_path = '/root/install_stgcn/st-gcn/pkl/falling_original.avi'
output_video_path = '/root/install_stgcn/st-gcn/pkl/predict_video.avi'

process_video_with_text(input_video_path, output_video_path, dataloader, model, device)
