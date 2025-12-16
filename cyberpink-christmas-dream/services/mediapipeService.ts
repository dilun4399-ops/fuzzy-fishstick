import { FilesetResolver, HandLandmarker, DrawingUtils } from "@mediapipe/tasks-vision";
import { GestureData } from "../types";

let handLandmarker: HandLandmarker | undefined;

export const initializeMediaPipe = async () => {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
  );
  
  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
      delegate: "GPU"
    },
    runningMode: "VIDEO",
    numHands: 1
  });
  
  return handLandmarker;
};

export const processVideoFrame = (video: HTMLVideoElement, lastVideoTime: number): { result: any, time: number } | null => {
  if (!handLandmarker) return null;

  if (video.currentTime !== lastVideoTime) {
    const startTimeMs = performance.now();
    const detection = handLandmarker.detectForVideo(video, startTimeMs);
    return { result: detection, time: video.currentTime };
  }
  return null;
};

export const analyzeGesture = (landmarks: any[]): GestureData => {
  if (!landmarks || landmarks.length === 0) {
    return { isHandDetected: false, gesture: 'NONE', handPosition: { x: 0.5, y: 0.5 }, rotationDelta: 0 };
  }

  const hand = landmarks[0]; // First hand
  
  // 1. Calculate centroid (Palm center approx)
  const wrist = hand[0];
  const indexMcp = hand[5];
  const middleMcp = hand[9];
  const ringMcp = hand[13];
  const pinkyMcp = hand[17];
  
  const palmCenterX = (wrist.x + indexMcp.x + middleMcp.x + ringMcp.x + pinkyMcp.x) / 5;
  const palmCenterY = (wrist.y + indexMcp.y + middleMcp.y + ringMcp.y + pinkyMcp.y) / 5;

  // 2. Calculate average distance of fingertips to wrist to detect Open vs Fist
  const tips = [4, 8, 12, 16, 20]; // Thumb, Index, Middle, Ring, Pinky tips
  let totalDist = 0;
  
  tips.forEach(idx => {
    const tip = hand[idx];
    const dx = tip.x - wrist.x;
    const dy = tip.y - wrist.y;
    totalDist += Math.sqrt(dx*dx + dy*dy);
  });
  
  const avgDist = totalDist / 5;
  
  // Heuristic thresholds (normalized coordinates)
  // Fist usually < 0.25 avg dist, Open > 0.35 roughly. 
  // Refined: Check thumb tip to index tip for "Pinch" specifically? 
  // Request asked for: Pinch/Grab (Fist) vs Open Hand.
  
  let gesture: 'FIST' | 'OPEN_PALM' | 'NONE' = 'NONE';
  
  if (avgDist < 0.25) {
      gesture = 'FIST';
  } else if (avgDist > 0.35) {
      gesture = 'OPEN_PALM';
  }

  // 3. Rotation control
  // Map X position (0-1) to rotation speed (-1 to 1)
  // Center (0.5) is 0 speed.
  // Note: MediaPipe X is normalized 0-1. 
  // X increases from left to right of the IMAGE. Since we mirror the video, 
  // moving hand right (physically) moves cursor right on screen.
  const rotationDelta = (palmCenterX - 0.5) * 5; // Multiplier for sensitivity

  return {
    isHandDetected: true,
    gesture,
    handPosition: { x: palmCenterX, y: palmCenterY },
    rotationDelta
  };
};
