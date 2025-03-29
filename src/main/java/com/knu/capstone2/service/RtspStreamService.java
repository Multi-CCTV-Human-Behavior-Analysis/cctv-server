package com.knu.capstone2.service;

import com.knu.capstone2.websocket.VideoStreamBroadcaster;
import lombok.RequiredArgsConstructor;
import org.bytedeco.javacv.FFmpegFrameGrabber;
import org.bytedeco.javacv.Frame;
import org.bytedeco.javacv.Java2DFrameConverter;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;

@Service
@RequiredArgsConstructor
public class RtspStreamService {

    private final VideoStreamBroadcaster broadcaster;
    private volatile boolean streaming = false;

    public void startStreaming() {
        if (streaming) return;
        streaming = true;

        new Thread(() -> {
            try (FFmpegFrameGrabber grabber = new FFmpegFrameGrabber("rtsp://admin:123456@192.168.0.2/stream1")) {

                // 지연 최소화를 위한 옵션 설정
                grabber.setOption("rtsp_transport", "tcp");
                grabber.setOption("fflags", "nobuffer");
                grabber.setOption("flags", "low_delay");
                grabber.setOption("tune", "zerolatency");
                grabber.setOption("max_delay", "0");
                grabber.setOption("analyzeduration", "0");
                grabber.setOption("probesize", "32");

                grabber.start();

                Java2DFrameConverter converter = new Java2DFrameConverter();

                while (streaming) {
                    Frame frame = grabber.grabImage(); // 오디오 제외한 순수 영상 프레임만
                    if (frame == null) continue;

                    BufferedImage bufferedImage = converter.convert(frame);
                    ByteArrayOutputStream baos = new ByteArrayOutputStream();
                    ImageIO.write(bufferedImage, "jpg", baos);
                    byte[] jpegBytes = baos.toByteArray();

                    broadcaster.broadcast(jpegBytes);

                    Thread.sleep(10); // 빠른 전송 (필요 시 15~20ms 조절 가능)
                }

                grabber.stop();
            } catch (Exception e) {
                e.printStackTrace();
            }
        }).start();
    }

    public void stopStreaming() {
        streaming = false;
    }
}