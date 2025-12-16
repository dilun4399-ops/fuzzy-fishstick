export enum AppState {
  TREE = 'TREE',
  EXPLODE = 'EXPLODE'
}

export interface ParticleData {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  color?: string;
  type: 'leaf' | 'decoration' | 'ribbon';
}

export interface GestureData {
  isHandDetected: boolean;
  gesture: 'NONE' | 'FIST' | 'OPEN_PALM';
  handPosition: { x: number; y: number }; // Normalized 0-1
  rotationDelta: number; // For rotating the tree
}
