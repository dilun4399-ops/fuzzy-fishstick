import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { InstancedParticles } from './InstancedParticles';
import { Star } from './Star';
import { AppState } from '../types';

interface Props {
  appState: AppState;
  onCanvasClick: () => void;
  rotationSpeed: number;
}

export const Experience: React.FC<Props> = ({ appState, onCanvasClick, rotationSpeed }) => {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ antialias: false, toneMappingExposure: 1.5 }}
      onClick={onCanvasClick}
      className="cursor-pointer"
    >
      <PerspectiveCamera makeDefault position={[0, 0, 35]} fov={50} />
      
      {/* Lighting */}
      <ambientLight intensity={0.2} color="#ffb7c5" />
      <spotLight 
        position={[10, 20, 10]} 
        angle={0.3} 
        penumbra={1} 
        intensity={2} 
        color="#ff69b4" 
      />
      <pointLight position={[-10, -10, -10]} intensity={1} color="#00ffff" />
      
      {/* Backlight for Rim effect */}
      <spotLight position={[0, 10, -20]} intensity={5} color="#ffffff" />

      {/* Environment for reflections */}
      <Environment preset="city" />

      {/* Scene Content */}
      <group position={[0, -2, 0]}>
        <InstancedParticles appState={appState} rotationSpeed={rotationSpeed} />
        <Star />
      </group>

      {/* Post Processing */}
      <EffectComposer disableNormalPass>
        <Bloom 
            luminanceThreshold={0.8} 
            mipmapBlur 
            intensity={1.5} 
            radius={0.4}
        />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>

      {/* Controls (allow manual orbit if needed, but limited) */}
      <OrbitControls 
        enablePan={false} 
        enableZoom={true} 
        minDistance={10} 
        maxDistance={60} 
        autoRotate={false} // We handle rotation manually
      />
    </Canvas>
  );
};