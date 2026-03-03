/**
 * File:     WebcamRecorder.tsx
 * Purpose:  The webcam recorder.
 * Authors:  Ojos Project & Iris contributors
 * License:  GNU General Public License v3.0
 */
import React, { useEffect, useRef, useState } from "react";
import styles from "./WebcamRecorder.module.css";
import { useRouter } from "next/navigation";
import Dialog from "@/components/Dialog";
import { saveVideo } from "../_helper";
import { invoke } from "@tauri-apps/api/core";

interface MotionResult {
  motion_detected: boolean;
  intensity: number;
  timestamp: number;
}

export default function WebcamRecorder() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const motionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [motionData, setMotionData] = useState<MotionResult | null>(null);

  const confirmDialog = () => {
    stopRecording();
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
    }
    setShowDialog(false);
    router.push("/");
  };

  const closeDialog = () => {
    setShowDialog(false);
  };

  // Capture frame from video and send to Rust for motion detection
  const captureAndProcessFrame = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to base64 image
    const frameData = canvas.toDataURL("image/png");

    try {
      // Send frame to Rust backend for motion detection
      const result = await invoke<MotionResult>("process_frame", {
        frameData: frameData,
      });

      // Update motion data state
      setMotionData(result);

      // Log motion detection results... simple for now
      console.log("Motion Detection Result:", {
        detected: result.motion_detected,
        intensity: result.intensity.toFixed(2),
        timestamp: new Date(result.timestamp * 1000).toISOString(),
      });

      // add additional logic here based on motion detection
      if (result.motion_detected) {
        console.log(
          `⚠️ Motion detected! Intensity: ${result.intensity.toFixed(2)}`,
        );
      }
    } catch (error) {
      console.error("Error processing frame:", error);
    }
  };

  useEffect(() => {
    // Function to start video streaming
    const startVideo = async () => {
      try {
        // Request access to the user's webcam and microphone
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        // Set the video stream to the video element
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Initialize MediaRecorder with the stream
        mediaRecorderRef.current = new MediaRecorder(stream);
        // Set up the data available handler to process recorded chunks
        mediaRecorderRef.current.ondataavailable = handleDataAvailable;

        // Start motion detection (capture every 500ms)
        motionIntervalRef.current = setInterval(() => {
          captureAndProcessFrame();
        }, 500);
      } catch (error) {
        console.error("Error accessing the webcam:", error);
      }
    };

    startVideo(); // Call the startVideo function to initiate streaming

    return () => {
      // Cleanup function to stop all media tracks when component unmounts
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stream
          .getTracks()
          .forEach((track) => track.stop());
      }
    };
  }, []); // Empty dependency array means this runs once on component mount

  // Handler for when data is available from the MediaRecorder
  const handleDataAvailable = (event: BlobEvent) => {
    saveVideo(new Blob([event.data], { type: "video/mp4" }));
  };

  // Function to start recording
  const startRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.start();
      setIsRecording(true);
    }
  };

  // Function to stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleMute = () => {
    if (mediaRecorderRef.current?.stream) {
      const audioTracks = mediaRecorderRef.current.stream.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !isMicOn; // Toggle audio track enabled state
      });
      setIsMicOn(!isMicOn);
    }
  };

  const toggleCamera = () => {
    if (mediaRecorderRef.current?.stream) {
      const videoTracks = mediaRecorderRef.current.stream.getVideoTracks();
      videoTracks.forEach((track) => {
        track.enabled = !isCameraOn; // Toggle video track enabled state
      });
      setIsCameraOn(!isCameraOn);
    }
  };

  // Function to handle ending the recording and cleanup
  const handleEnd = () => {
    if (isRecording) {
      setShowDialog(!showDialog);
    } else {
      router.push("/");
    }
  };

  return (
    <div>
      {/* Hidden canvas for capturing frames */}
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* Video element to display the webcam feed */}
      <video
        className={styles.video_container}
        ref={videoRef}
        autoPlay
        playsInline
        muted={true}
      />

      {/* Motion detection indicator... maybe put this into its own component */}
      {motionData && (
        <div
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            background: motionData.motion_detected
              ? "rgba(255, 0, 0, 0.8)"
              : "rgba(0, 255, 0, 0.8)",
            color: "white",
            padding: "10px",
            borderRadius: "5px",
          }}
        >
          <div>Motion: {motionData.motion_detected ? "DETECTED" : "None"}</div>
          <div>Intensity: {motionData.intensity.toFixed(2)}</div>
        </div>
      )}

      {showDialog && (
        <Dialog
          title="You are still recording!"
          content="Recording will end if you leave the page. Leave the page?"
        >
          <button className="dangerPrimary" onClick={confirmDialog}>
            Leave page
          </button>
          <button className="primary" onClick={closeDialog}>
            Stay
          </button>
        </Dialog>
      )}
      <div className={styles.controls}>
        {/* Button to go back to the previous page */}
        <button
          className={isRecording ? "secondary" : "primary"}
          onClick={handleEnd}
        >
          Back
        </button>
        <button
          className={isRecording ? "secondary" : "primary"}
          onClick={isRecording ? stopRecording : startRecording}
        >
          {isRecording ? "Stop Recording" : "Start Recording"}
        </button>

        <button
          className={isCameraOn ? "secondary" : "primary"}
          onClick={toggleCamera}
        >
          {isCameraOn ? "Stop Camera" : "Start Camera"}
        </button>
        <button
          className={isMicOn ? "secondary" : "primary"}
          onClick={toggleMute}
        >
          {isMicOn ? "Stop Mic" : "Start Mic"}
        </button>
      </div>
    </div>
  );
}
