import os
import numpy as np

# Get the current directory
directory = "/root/install_stgcn/st-gcn/pkl"

# List all files in the directory
npy_files = [f for f in os.listdir(directory) if f.endswith('.npy')]

# Print the shape of each npy file
for file in npy_files:
    file_path = os.path.join(directory, file)
    data = np.load(file_path)
    print(f"File: {file}, Shape: {data.shape}")
