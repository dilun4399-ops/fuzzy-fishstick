// Manual type definitions replacing vite/client reference which was causing errors

declare module '*.svg' {
  import * as React from 'react';
  export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement> & { title?: string }>;
  const src: string;
  export default src;
}

declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.gif';
declare module '*.bmp';
declare module '*.tiff';

// Augment JSX namespace to include React Three Fiber elements
declare namespace JSX {
  interface IntrinsicElements {
    ambientLight: any;
    spotLight: any;
    pointLight: any;
    group: any;
    mesh: any;
    instancedMesh: any;
    extrudeGeometry: any;
    meshStandardMaterial: any;
    sphereGeometry: any;
    meshBasicMaterial: any;
    octahedronGeometry: any;
    icosahedronGeometry: any;
    meshPhysicalMaterial: any;
    tetrahedronGeometry: any;
  }
}
