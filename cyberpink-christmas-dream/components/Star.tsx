import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Sparkles, Float } from '@react-three/drei';

export const Star: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Create a star shape
  const starShape = new THREE.Shape();
  const outerRadius = 1.5;
  const innerRadius = 0.6;
  const points = 5;

  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI) / points;
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) starShape.moveTo(x, y);
    else starShape.lineTo(x, y);
  }
  starShape.closePath();

  const extrudeSettings = {
    depth: 0.2,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.1,
    bevelThickness: 0.1,
  };

  useFrame((state) => {
    if (meshRef.current) {
        meshRef.current.rotation.y += 0.01;
        meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime) * 0.1;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <group position={[0, 9.5, 0]}>
        <mesh ref={meshRef}>
          <extrudeGeometry args={[starShape, extrudeSettings]} />
          <meshStandardMaterial 
            color="#FFD700" 
            emissive="#FFD700"
            emissiveIntensity={2}
            roughness={0.1}
            metalness={1}
          />
        </mesh>
        {/* Glow Halo */}
        <mesh position={[0, 0, 0]}>
             <sphereGeometry args={[2, 32, 32]} />
             <meshBasicMaterial color="#FFD700" transparent opacity={0.15} blending={THREE.AdditiveBlending} side={THREE.BackSide} />
        </mesh>
        
        {/* Sparkles around star */}
        <Sparkles 
            count={50} 
            scale={4} 
            size={4} 
            speed={0.4} 
            opacity={1} 
            color="#FFF" 
        />
      </group>
    </Float>
  );
};
