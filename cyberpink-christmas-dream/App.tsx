import { useState, useCallback } from 'react';
import { Experience } from './components/Experience';
import { GestureOverlay } from './components/GestureOverlay';
import { AppState, GestureData } from './types';

function App() {
  const [appState, setAppState] = useState<AppState>(AppState.TREE);
  const [rotationSpeed, setRotationSpeed] = useState(0);
  const [lastGesture, setLastGesture] = useState<string>('NONE');

  const toggleState = () => {
    setAppState(prev => prev === AppState.TREE ? AppState.EXPLODE : AppState.TREE);
  };

  const handleGestureUpdate = useCallback((data: GestureData) => {
    if (data.isHandDetected) {
      // Rotation logic
      if (data.gesture === 'OPEN_PALM') {
          // Allow rotation control when hand is open
          setRotationSpeed(data.rotationDelta * 0.5);
      } else {
          setRotationSpeed(0);
      }

      // State switching logic with debouncing/locking to prevent flickering
      // Only switch if different from current
      if (data.gesture === 'FIST' && appState !== AppState.TREE) {
        setAppState(AppState.TREE);
        setLastGesture('FIST');
      } else if (data.gesture === 'OPEN_PALM' && appState !== AppState.EXPLODE) {
        // Only explode if we aren't "holding" the rotation? 
        // Request says: "Open Hand -> Trigger EXPLODE".
        // Also says: "Open hand move -> Rotate".
        // These can coexist. Open hand means exploded state, moving it rotates the exploded chaos.
        setAppState(AppState.EXPLODE);
        setLastGesture('OPEN_PALM');
      }
    } else {
        // No hand, drift slowly
        setRotationSpeed(0);
    }
  }, [appState]);

  return (
    <div className="relative w-full h-full bg-[#050103] overflow-hidden text-pink-100 font-sans selection:bg-pink-500 selection:text-white">
      
      {/* 3D Scene */}
      <div className="absolute inset-0 z-0">
        <Experience 
            appState={appState} 
            onCanvasClick={toggleState} 
            rotationSpeed={rotationSpeed}
        />
      </div>

      {/* Overlay UI */}
      <div className="absolute top-0 left-0 w-full p-6 pointer-events-none z-10 flex flex-col justify-between h-full">
        
        {/* Header */}
        <div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-300 to-white drop-shadow-[0_0_10px_rgba(255,105,180,0.5)]">
            CYBERPINK
            <br />
            <span className="text-2xl md:text-3xl font-light tracking-widest text-pink-200">CHRISTMAS</span>
          </h1>
          <p className="mt-2 text-pink-300/70 text-sm md:text-base max-w-md">
            Click screen or use hand gestures to interact.
            <br />
            <span className="text-white/50 text-xs">✊ Fist: Assemble Tree | 🖐️ Open: Explode & Rotate</span>
          </p>
        </div>

        {/* Footer info */}
        <div className="text-right">
             <div className="inline-block px-3 py-1 bg-black/40 backdrop-blur border border-pink-500/20 rounded-full text-xs font-mono text-pink-400">
                STATE: {appState}
             </div>
        </div>
      </div>

      {/* Gesture Control Layer */}
      <GestureOverlay 
        onGestureUpdate={handleGestureUpdate} 
        currentAppState={appState}
      />

    </div>
  );
}

export default App;