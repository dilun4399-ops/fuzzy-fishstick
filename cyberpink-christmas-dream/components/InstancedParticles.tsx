import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AppState, ParticleData } from '../types';
import { generateTreeParticles, generateDecorations, generateRibbon, getExplosionTarget } from '../utils/math';

interface Props {
  appState: AppState;
  rotationSpeed: number;
}

const dummy = new THREE.Object3D();
const tempColor = new THREE.Color();

export const InstancedParticles: React.FC<Props> = ({ appState, rotationSpeed }) => {
  // 1. Generate Data
  const leafCount = 5000;
  const decoCount = 800;
  const ribbonCount = 1200;

  const leavesData = useMemo(() => generateTreeParticles(leafCount), []);
  const decoData = useMemo(() => generateDecorations(decoCount), []);
  const ribbonData = useMemo(() => generateRibbon(ribbonCount), []);

  const allData = useMemo(() => [...leavesData, ...decoData, ...ribbonData], [leavesData, decoData, ribbonData]);

  // 2. Refs for Meshes
  const leavesRef = useRef<THREE.InstancedMesh>(null);
  const decoRef = useRef<THREE.InstancedMesh>(null);
  const ribbonRef = useRef<THREE.InstancedMesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  // 3. Store Target Positions for Explode state
  // We calculate explosion targets once and store them
  const explosionTargets = useMemo(() => {
    return allData.map((_, i) => getExplosionTarget(i, allData.length));
  }, [allData]);

  // 4. Animation Loop
  useFrame((state, delta) => {
    // Constant slow rotation + user gesture rotation
    if (groupRef.current) {
        groupRef.current.rotation.y += delta * 0.1 + (rotationSpeed * delta);
    }

    const t = appState === AppState.EXPLODE ? 1 : 0;
    // We use a spring-like Lerp factor
    const lerpFactor = THREE.MathUtils.damp(0, 1, 3, delta); // Just for reference, we do manual interpolation below
    
    // We need to interpolate the ACTUAL positions of instances.
    // Ideally, we'd use a shader for this performance, but let's try JS-side matrix updates first.
    // If 7000 is too heavy for JS loop, we can reduce count or optimize.
    // 7000 is borderline for per-frame setMatrixAt on lower end devices, but fine for desktop.
    
    // To smooth transition state tracking
    // We can't easily store "current" state in a ref array for 7000 items without memory overhead,
    // but reading from instanceMatrix is slow.
    // Let's rely on a global progress variable.
  });

  // Since lerping 7000 matrices in JS useFrame is heavy, let's use a simpler approach:
  // We update a uniform in a custom shader material? 
  // Given the request asks for specific geometries and standard-ish materials (reflections),
  // JS InstancedMesh is safer for visual fidelity if performance holds.
  // Let's optimize: We only update matrices if we are transitioning or in explode mode (where things might drift).
  
  // Actually, let's use a simple transition progress ref.
  const progress = useRef(0);

  useFrame((state, delta) => {
    // Target progress: 0 for Tree, 1 for Explode
    const target = appState === AppState.EXPLODE ? 1 : 0;
    
    // Smooth damp towards target
    // Using a simple linear approach for stability, or damp for smoothness
    const speed = 2.0;
    if (Math.abs(progress.current - target) > 0.001) {
        const dir = target - progress.current;
        progress.current += dir * speed * delta;
        if (Math.abs(target - progress.current) < 0.005) progress.current = target;
        
        updateMatrices();
    } else {
        // Even if static, we want the group rotation (handled above)
        // But if in Tree mode, maybe we want subtle wind?
        // For now, static when reached target to save CPU.
    }

    if (groupRef.current) {
       groupRef.current.rotation.y += (0.1 + rotationSpeed) * delta;
    }
  });

  const updateMatrices = () => {
    const p = progress.current; // 0 to 1
    
    let globalIndex = 0;

    // Update Leaves
    if (leavesRef.current) {
        for (let i = 0; i < leafCount; i++) {
            const data = leavesData[i];
            const explodePos = explosionTargets[globalIndex];
            globalIndex++;

            const x = THREE.MathUtils.lerp(data.position[0], explodePos[0], p);
            const y = THREE.MathUtils.lerp(data.position[1], explodePos[1], p);
            const z = THREE.MathUtils.lerp(data.position[2], explodePos[2], p);

            dummy.position.set(x, y, z);
            dummy.rotation.set(
                data.rotation[0] + p * 2, 
                data.rotation[1] + p * 2, 
                data.rotation[2]
            );
            dummy.scale.setScalar(data.scale);
            dummy.updateMatrix();
            leavesRef.current.setMatrixAt(i, dummy.matrix);
        }
        leavesRef.current.instanceMatrix.needsUpdate = true;
    }

    // Update Decos
    if (decoRef.current) {
        for (let i = 0; i < decoCount; i++) {
            const data = decoData[i];
            const explodePos = explosionTargets[globalIndex];
            globalIndex++;

            const x = THREE.MathUtils.lerp(data.position[0], explodePos[0], p);
            const y = THREE.MathUtils.lerp(data.position[1], explodePos[1], p);
            const z = THREE.MathUtils.lerp(data.position[2], explodePos[2], p);

            dummy.position.set(x, y, z);
            dummy.rotation.set(data.rotation[0], data.rotation[1] + p * 5, data.rotation[2]);
            dummy.scale.setScalar(data.scale);
            dummy.updateMatrix();
            decoRef.current.setMatrixAt(i, dummy.matrix);
        }
        decoRef.current.instanceMatrix.needsUpdate = true;
    }

    // Update Ribbon
    if (ribbonRef.current) {
        for (let i = 0; i < ribbonCount; i++) {
            const data = ribbonData[i];
            const explodePos = explosionTargets[globalIndex];
            globalIndex++;

            const x = THREE.MathUtils.lerp(data.position[0], explodePos[0], p);
            const y = THREE.MathUtils.lerp(data.position[1], explodePos[1], p);
            const z = THREE.MathUtils.lerp(data.position[2], explodePos[2], p);

            dummy.position.set(x, y, z);
            dummy.rotation.set(data.rotation[0] + p, data.rotation[1], data.rotation[2]);
            dummy.scale.setScalar(data.scale);
            dummy.updateMatrix();
            ribbonRef.current.setMatrixAt(i, dummy.matrix);
        }
        ribbonRef.current.instanceMatrix.needsUpdate = true;
    }
  };
  
  // Initial draw
  useEffect(() => {
    updateMatrices();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <group ref={groupRef}>
      {/* Leaves: Pink Octahedrons */}
      <instancedMesh ref={leavesRef} args={[undefined, undefined, leafCount]}>
        <octahedronGeometry args={[0.3, 0]} />
        <meshStandardMaterial 
          color="#FF69B4" 
          roughness={0.4} 
          metalness={0.6}
          side={THREE.DoubleSide}
        />
      </instancedMesh>

      {/* Decorations: Reflective Cubes & Icosahedrons */}
      <instancedMesh ref={decoRef} args={[undefined, undefined, decoCount]}>
        <icosahedronGeometry args={[0.4, 0]} />
        <meshPhysicalMaterial 
            color="#E6E6FA"
            metalness={0.1}
            roughness={0}
            transmission={0.2} 
            thickness={1}
            envMapIntensity={2}
        />
      </instancedMesh>

      {/* Ribbon: White Tetrahedrons */}
      <instancedMesh ref={ribbonRef} args={[undefined, undefined, ribbonCount]}>
        <tetrahedronGeometry args={[0.2, 0]} />
        <meshStandardMaterial 
            color="#FFFFFF"
            emissive="#FFFFFF"
            emissiveIntensity={0.8}
            roughness={0.2}
            metalness={0.8}
        />
      </instancedMesh>
    </group>
  );
};
