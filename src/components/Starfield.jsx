import { useMemo } from "react";
import * as THREE from "three";

export default function Starfield({ numStars = 1000 }) {
  const { positions, colors } = useMemo(() => {
    const positions = [];
    const colors = [];

    for (let i = 0; i < numStars; i++) {
      const radius = Math.random() * 25 + 25;
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      positions.push(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi)
      );
      const col = new THREE.Color().setHSL(0.6, 0.2, Math.random());
      colors.push(col.r, col.g, col.b);
    }

    return {
      positions: new Float32Array(positions),
      colors: new Float32Array(colors),
    };
  }, [numStars]);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.2} vertexColors fog={false} />
    </points>
  );
}
