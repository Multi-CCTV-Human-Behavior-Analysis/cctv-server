import numpy as np

# combined_data.npy 파일을 불러오기
combined_data = np.load('shuffled_combined_data_10s.npy')

# 배열의 형태와 데이터를 출력
print("combined_data shape:", combined_data.shape)


import pickle

# combined_label.pkl 파일을 불러오기
with open('shuffled_combined_label_10s.pkl', 'rb') as f:
    combined_label = pickle.load(f)

# 데이터 출력
print("combined_label content:", combined_label)

