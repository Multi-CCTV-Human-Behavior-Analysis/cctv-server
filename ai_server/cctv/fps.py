import cv2

video_path = 'falling_original_30fps_output.avi'

cap = cv2.VideoCapture(video_path)

fps = cap.get(cv2.CAP_PROP_FPS)

print(f"FPS: {fps}")

cap.release()
