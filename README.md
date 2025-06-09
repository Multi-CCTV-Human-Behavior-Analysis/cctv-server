# CCTV 서버 프로젝트

## 프로젝트 개요
이 프로젝트는 실시간 웹캠 스트리밍과 낙상 감지 기능을 제공하는 CCTV 시스템입니다. 웹 기반 대시보드를 통해 실시간 모니터링과 알림 기능을 제공합니다.

## 주요 기능
- 실시간 웹캠 스트리밍
- AI 기반 낙상 감지
- 실시간 알림 시스템
- 영상 녹화 및 저장
- 웹 기반 대시보드

## 기술 스택
### 백엔드
- Java 21
- Spring Boot 3.4.4
- Spring Data JPA
- MySQL
- WebSocket
- JavaCV

### AI 서버
- Python
- Flask
- OpenCV
- MediaPipe
- PyTorch
- ST-GCN (Spatial Temporal Graph Convolutional Networks)

### 프론트엔드
- React
- WebSocket
- Video.js

## 시스템 구성
1. **메인 서버 (Spring Boot)**
   - RESTful API 제공
   - 데이터베이스 관리
   - 실시간 알림 처리
   - WebSocket 통신

2. **AI 서버 (Flask)**
   - 웹캠 스트리밍 처리
   - 낙상 감지 AI 모델 실행
   - 실시간 이벤트 전송

3. **프론트엔드 (React)**
   - 실시간 비디오 스트리밍 표시
   - 대시보드 UI
   - 알림 표시
   - 녹화 영상 관리

## 시스템 작동 구조

### 전체 시스템 흐름도
1. 웹캠 스트리밍
   - 웹캠1: 일반 스트리밍용
   - 웹캠2: 낙상 감지용
2. AI 서버에서 실시간 분석
   - MediaPipe를 통한 포즈 추출
   - ST-GCN 모델을 통한 낙상 감지
3. 이벤트 발생 시 처리
   - Spring Boot 서버로 이벤트 전송
   - WebSocket을 통한 실시간 알림
   - 데이터베이스에 이벤트 기록
4. 프론트엔드 표시
   - 실시간 스트리밍 표시
   - 알림 표시
   - 녹화 영상 관리

## 주요 파일 구조 및 기능

### 백엔드 (Spring Boot)
```
src/
├── main/
│   ├── java/
│   │   └── com/knu/
│   │       ├── controller/
│   │       │   ├── EventController.java      # 이벤트 처리 컨트롤러
│   │       │   └── WebSocketController.java  # 실시간 알림 처리
│   │       ├── service/
│   │       │   └── EventService.java         # 이벤트 비즈니스 로직
│   │       ├── repository/
│   │       │   └── EventRepository.java      # 이벤트 데이터 접근
│   │       └── model/
│   │           └── Event.java                # 이벤트 엔티티
│   └── resources/
│       └── application.properties            # 서버 설정
```

### AI 서버 (Flask)
```
new_ai_server/
└── webcam/
    ├── original_cam.py           # 메인 AI 서버
    ├── st-gcn/                   # ST-GCN 모델 관련
    │   ├── net/
    │   │   └── st_gcn.py        # ST-GCN 모델 정의
    │   └── model/
    │       └── epoch200_model.pt # 학습된 모델
    └── requirements.txt          # Python 의존성
```

### 프론트엔드 (React)
```
frontend/
├── src/
│   ├── components/
│   │   ├── Dashboard.js         # 메인 대시보드
│   │   ├── VideoStream.js       # 비디오 스트리밍
│   │   ├── AlertList.js         # 알림 목록
│   │   └── RecordingList.js     # 녹화 영상 목록
│   ├── services/
│   │   ├── websocket.js         # WebSocket 연결
│   │   └── api.js              # API 통신
│   └── App.js                   # 메인 앱 컴포넌트
└── package.json                 # 의존성 관리
```

## 주요 기능 상세 설명

### 1. 낙상 감지 시스템
- **MediaPipe 포즈 추출**
  - 33개의 키포인트 추출
  - 실시간 포즈 추적
- **ST-GCN 모델**
  - 시공간적 그래프 컨볼루션 네트워크
  - 30프레임 시퀀스 기반 분석
  - 낙상 확률 계산

### 2. 실시간 스트리밍
- **일반 스트리밍 (웹캠1)**
  - MJPEG 스트리밍
  - 낮은 지연시간
- **낙상 감지 스트리밍 (웹캠2)**
  - 포즈 오버레이 표시
  - 실시간 상태 표시
  - 확률값 표시

### 3. 이벤트 처리
- **이벤트 발생 조건**
  - 낙상 확률 > 0.8
  - 5초 간격으로 중복 방지
- **이벤트 저장**
  - 타임스탬프
  - 확률값
  - 이벤트 타입

### 4. 영상 녹화
- **자동 녹화**
  - 1분 단위 파일 생성
  - MP4 포맷 저장
- **녹화 관리**
  - 파일명: stream_YYYYMMDD_HHMM.mp4
  - recordings.json으로 메타데이터 관리

## 설치 및 실행 방법

### 필수 요구사항
- Java 21
- Python 3.8+
- Node.js
- MySQL
- 웹캠 2대

### 백엔드 서버 실행
```bash
./gradlew bootRun
```

### AI 서버 실행
```bash
cd new_ai_server/webcam
python original_cam.py
```

### 프론트엔드 실행
```bash
cd frontend
npm install
npm start
```

## API 문서
Swagger UI를 통해 API 문서를 확인할 수 있습니다:
```
http://localhost:8081/swagger-ui.html
```

## 주요 엔드포인트
- `/api/history/event`: 낙상 이벤트 기록
- `/video_feed`: 일반 스트리밍 (웹캠1)
- `/video`: 낙상 감지 스트리밍 (웹캠2)
- `/health`: 서버 상태 확인

## 환경 설정
- 웹캠 ID 설정: `new_ai_server/webcam/original_cam.py`에서 `WEBCAM_ID1`과 `WEBCAM_ID2` 값 조정
- 데이터베이스 설정: `application.properties`에서 MySQL 연결 정보 설정

## 주의사항
1. 웹캠이 정상적으로 연결되어 있는지 확인
2. AI 모델 파일이 올바른 경로에 위치하는지 확인
3. MySQL 서버가 실행 중인지 확인

## 라이선스
이 프로젝트는 MIT 라이선스를 따릅니다. 