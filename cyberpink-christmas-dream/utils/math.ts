import * as THREE from 'three';
import { ParticleData } from '../types';

// Deterministic random for consistent layouts
const seedRandom = (i: number) => {
  const x = Math.sin(i) * 10000;
  return x - Math.floor(x);
};

export const generateTreeParticles = (count: number): ParticleData[] => {
  const particles: ParticleData[] = [];
  const height = 18;
  const radiusBase = 7;

  for (let i = 0; i < count; i++) {
    // Distributed along a cone
    const y = -height / 2 + height * (i / count);
    const radius = radiusBase * (1 - (i / count));
    const theta = i * 2.5; // Spiral distribution

    // Add some noise
    const rNoise = (seedRandom(i) - 0.5) * 1.5;
    const yNoise = (seedRandom(i + 100) - 0.5) * 1.5;
    const thetaNoise = (seedRandom(i + 200) - 0.5) * 0.5;

    const x = (radius + rNoise) * Math.cos(theta + thetaNoise);
    const z = (radius + rNoise) * Math.sin(theta + thetaNoise);

    particles.push({
      position: [x, y + yNoise, z],
      rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI],
      scale: 0.5 + Math.random() * 0.5,
      type: 'leaf'
    });
  }
  return particles;
};

export const generateDecorations = (count: number): ParticleData[] => {
  const particles: ParticleData[] = [];
  const height = 18;
  const radiusBase = 7.5; // Slightly outside the leaves

  for (let i = 0; i < count; i++) {
    const y = -height / 2 + height * (Math.random());
    const level = (y + height / 2) / height;
    const radius = radiusBase * (1 - level);
    
    // Random angle
    const theta = Math.random() * Math.PI * 2;

    const x = radius * Math.cos(theta);
    const z = radius * Math.sin(theta);

    particles.push({
      position: [x, y, z],
      rotation: [Math.random() * Math.PI, Math.random() * Math.PI, 0],
      scale: 0.8 + Math.random() * 0.4,
      type: 'decoration'
    });
  }
  return particles;
};

export const generateRibbon = (count: number): ParticleData[] => {
  const particles: ParticleData[] = [];
  const height = 19;
  const radiusBase = 8;
  const loops = 3.5;

  for (let i = 0; i < count; i++) {
    const progress = i / count;
    const y = -height / 2 + height * progress;
    const radius = radiusBase * (1 - progress);
    const theta = progress * Math.PI * 2 * loops;

    const x = radius * Math.cos(theta);
    const z = radius * Math.sin(theta);

    particles.push({
      position: [x, y, z],
      rotation: [progress * Math.PI * 2, 0, 0],
      scale: 0.3, // Small detailed particles
      type: 'ribbon'
    });
  }
  return particles;
};

export const getExplosionTarget = (index: number, count: number): [number, number, number] => {
  // Sphere distribution
  const phi = Math.acos(-1 + (2 * index) / count);
  const theta = Math.sqrt(count * Math.PI) * phi;
  const r = 15 + seedRandom(index) * 20; // Explosion radius range

  return [
    r * Math.cos(theta) * Math.sin(phi),
    r * Math.sin(theta) * Math.sin(phi),
    r * Math.cos(phi)
  ];
};
