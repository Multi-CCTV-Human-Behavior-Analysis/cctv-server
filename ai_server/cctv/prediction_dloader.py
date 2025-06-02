import sys
sys.path.append('/root/install_stgcn/st-gcn')

from net.st_gcn import Model
import numpy as np
import torch
import torch.nn.functional as F
import pickle
from torch.utils.data import DataLoader, Dataset

class PoseDataset(Dataset):
    def __init__(self, data, labels, sample_names):
        self.data = data
        self.labels = labels
        self.sample_names = sample_names

    def __len__(self):
        return len(self.data)

    def __getitem__(self, idx):
        sample = torch.tensor(self.data[idx]).float() #3,30,18,1
        label = self.labels[idx]
        sample_name = self.sample_names[idx]
        return sample, label, sample_name

data = np.load('shuffled_combined_data_f_3s.npy')  
with open('shuffled_combined_label_f_3s.pkl', 'rb') as f:
    sample_names, class_labels = pickle.load(f)

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = Model(in_channels=3, num_class=2, edge_importance_weighting=True,
              graph_args={'layout': 'openpose', 'strategy': 'uniform'})
model.load_state_dict(torch.load('/root/install_stgcn/st-gcn/work_dir/shuffle_combined_model_f_3s/epoch200_model.pt', map_location=device))
model.eval().to(device)

class_names = ['normal', 'fall']

batch_size = 32
dataset = PoseDataset(data, class_labels, sample_names)
dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=True)


correct = 0
total_idx = 0  # 전체 데이터 인덱스를 추적할 변수

print(f"{'Idx':<4} {'Sample Name':<25} {'Truth':<7} {'Pred':<7} {'✓?'}   Probabilities")
print("-" * 70)

for i, (samples, labels, names) in enumerate(dataloader):
    print('H')
    samples = samples.to(device)
    labels = labels.to(device)

    with torch.no_grad():
        outputs = model(samples)
        probs = F.softmax(outputs, dim=1).cpu().numpy()
        preds = np.argmax(probs, axis=1)

    # 배치 크기만큼 출력하지만, 모든 데이터에 대해 출력하도록 loop
    for j in range(len(preds)):
        gt = labels[j].item()
        pred = preds[j]
        match = '✓' if pred == gt else '✗'
        
        # 전체 데이터 인덱스를 출력
        print(f"{total_idx:<4} {names[j]:<25} {class_names[gt]:<7} {class_names[pred]:<7} {match}   {probs[j]}")

        if pred == gt:
            correct += 1

        total_idx += 1  # 전체 데이터 인덱스를 업데이트

print(f"\nAccuracy: {correct}/{len(data)} = {correct / len(data) * 100:.2f}%")

