"use client";
import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import Header from "./Header";
import StatusCard from "./StatusCard";
import styles from "./FaceRecorder.module.css";

export default function FaceRecorder() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [recording, setRecording] = useState(false);
  const recordedChunksRef = useRef([]);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [fps, setFps] = useState(0);
  const lastFrameTime = useRef(Date.now());

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = "/models";
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(
          `${MODEL_URL}/tiny_face_detector`
        ),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri(
          `${MODEL_URL}/face_landmark_68_tiny`
        ),
      ]);
      setModelsLoaded(true);
      console.log("Models loaded");

      startVideo();
    };

    loadModels();
  }, []);

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
    } catch (err) {
      console.error("Error accessing webcam:", err);
    }
  };

  useEffect(() => {
    const interval = setInterval(async () => {
      if (!videoRef.current || videoRef.current.readyState !== 4) return;

      const detections = await faceapi
        .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks(true);

      const canvas = canvasRef.current;
      const video = videoRef.current;

      faceapi.matchDimensions(canvas, {
        width: video.videoWidth,
        height: video.videoHeight,
      });

      const resized = faceapi.resizeResults(detections, {
        width: video.videoWidth,
        height: video.videoHeight,
      });

      canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
      faceapi.draw.drawDetections(canvas, resized);
      faceapi.draw.drawFaceLandmarks(canvas, resized);
      setFaceDetected(detections.length > 0);
      const now = Date.now();
      const delta = now - lastFrameTime.current;
      lastFrameTime.current = now;

      setFps(Math.round(1000 / delta));
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const startRecording = () => {
    const videoStream = videoRef.current.srcObject;
    const canvasStream = canvasRef.current.captureStream();

    if (!videoStream) {
      console.error("Video stream is not ready");
      return;
    }

    const combinedStream = new MediaStream([
      ...videoStream.getTracks(),
      ...canvasStream.getVideoTracks(),
    ]);

    mediaRecorderRef.current = new MediaRecorder(combinedStream, {
      mimeType: "video/webm",
    });

    recordedChunksRef.current = [];

    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    mediaRecorderRef.current.onstop = () => {
      setTimeout(() => {
        const blob = new Blob(recordedChunksRef.current, {
          type: "video/webm",
        });
        const url = URL.createObjectURL(blob);
        localStorage.setItem("recordedVideo", url);
        const a = document.createElement("a");
        a.href = url;
        a.download = "face-recording.webm";
        a.click();
      }, 100);
    };

    mediaRecorderRef.current.start();
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setRecording(false);
  };

  return (
    <>
      <Header />
      <div className="flex flex-col items-center justify-center w-full min-h-screen">
        <div className="flex flex-col md:flex-row items-center justify-center gap-8">
          {/* Video + Canvas */}
          <div className="flex flex-col items-center">
            <div className="relative w-[640px] h-[480px]">
              <video
                ref={videoRef}
                autoPlay
                muted
                className="rounded-lg w-full h-full scale-x-[-1]"
              />

              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full scale-x-[-1]"
              />
            </div>

            <div className="mt-4">
              {!recording ? (
                <button
                  onClick={startRecording}
                  className={`${styles["recorder-button"]}  text-white font-semibold py-2 px-6 rounded`}
                >
                  Start Recording
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className={`${styles["recorder-button"]} text-white font-semibold py-2 px-6 rounded`}
                >
                  Stop Recording
                </button>
              )}
            </div>
          </div>

          {/* Status Card */}
          <div className="relative drop-shadow-xl w-48 h-64 overflow-hidden rounded-xl bg-[#3d3c3d] mt-6 md:mt-0">
            <div className="absolute flex items-center justify-center text-white z-[1] opacity-90 rounded-xl inset-0.5 bg-[#323132] p-2">
              <StatusCard
                isRecording={recording}
                modelsLoaded={modelsLoaded}
                faceDetected={faceDetected}
                fps={fps}
              />
            </div>
            <div className="absolute w-56 h-48 bg-white blur-[50px] -left-1/2 -top-1/2 opacity-20" />
          </div>
        </div>
      </div>
    </>
  );
}
