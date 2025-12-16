import React, { useEffect, useRef, useState } from 'react';
import { initializeMediaPipe, processVideoFrame, analyzeGesture } from '../services/mediapipeService';
import { AppState, GestureData } from '../types';

interface Props {
  onGestureUpdate: (data: GestureData) => void;
  currentAppState: AppState;
}

export const GestureOverlay: React.FC<Props> = ({ onGestureUpdate, currentAppState }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [permissionError, setPermissionError] = useState(false);
  const requestRef = useRef<number>(0);
  const lastVideoTimeRef = useRef(-1);

  // For cursor visualization
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [detected, setDetected] = useState(false);

  useEffect(() => {
    const startCamera = async () => {
      try {
        await initializeMediaPipe();
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: 320, 
                height: 240, 
                frameRate: { ideal: 30 } 
            } 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.addEventListener('loadeddata', () => {
             setLoaded(true);
             predict();
          });
        }
      } catch (err) {
        console.error("Camera error:", err);
        setPermissionError(true);
      }
    };

    startCamera();
    return () => cancelAnimationFrame(requestRef.current);
  }, []);

  const predict = () => {
    if (videoRef.current) {
      const data = processVideoFrame(videoRef.current, lastVideoTimeRef.current);
      if (data) {
        lastVideoTimeRef.current = data.time;
        const gestureResult = analyzeGesture(data.result.landmarks);
        
        onGestureUpdate(gestureResult);
        
        // Update local UI state
        setDetected(gestureResult.isHandDetected);
        // Mediapipe x is 0-1 (left-right). Mirror effect happens in CSS transform scaleX(-1).
        // If we flip the video, x=0 is left visually.
        // Mediapipe returns normalized coordinates relative to image.
        // If we CSS flip the video container, we need to flip the cursor X coordinate to match visually.
        setCursorPos({ 
            x: (1 - gestureResult.handPosition.x) * 100, 
            y: gestureResult.handPosition.y * 100 
        });
      }
    }
    requestRef.current = requestAnimationFrame(predict);
  };

  return (
    <>
      {/* Gesture Cursor */}
      {detected && (
        <div 
            className="gesture-cursor"
            style={{ 
                left: `${cursorPos.x}%`, 
                top: `${cursorPos.y}%`,
                borderColor: currentAppState === AppState.TREE ? '#00FF00' : '#FF69B4',
                backgroundColor: currentAppState === AppState.TREE ? 'rgba(0,255,0,0.3)' : 'rgba(255,105,180,0.3)'
            }}
        />
      )}

      {/* Camera Preview */}
      <div className="fixed bottom-5 right-5 w-40 h-32 bg-black/50 rounded-lg overflow-hidden border border-pink-500/30 backdrop-blur-sm z-40 transition-opacity hover:opacity-100 opacity-80">
        {!loaded && !permissionError && <div className="text-white text-xs p-4 text-center">Loading AI Vision...</div>}
        {permissionError && <div className="text-red-400 text-xs p-4 text-center">Camera Access Denied</div>}
        
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover transform scale-x-[-1]" // Mirror flip
        />
        
        {/* Status Indicator */}
        <div className="absolute top-1 left-1 flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${detected ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className="text-[10px] text-white font-mono">
                {detected ? 'HAND DETECTED' : 'NO HAND'}
            </span>
        </div>
      </div>
    </>
  );
};