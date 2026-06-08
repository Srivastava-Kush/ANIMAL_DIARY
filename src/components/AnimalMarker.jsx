import { useRef, useState, memo } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard } from "@react-three/drei";
import { useAnimalTexture } from "../hooks/useAnimalTexture";
import { latLonToVector3 } from "../utils/geo";
import { IUCN_COLORS } from "../utils/iucn";

const AnimalMarker = memo(function AnimalMarker({
  animal,
  isHighlighted,
  isFaded,
  onDoubleClick,
}) {
  const texture = useAnimalTexture(animal);
  const meshRef = useRef();
  const ringRef = useRef();
  const [hovered, setHovered] = useState(false);

  const pos = latLonToVector3(animal.lat, animal.lon, 2.05);
  const glowColor = IUCN_COLORS[animal.iucn_status] || "#ffffff";

  useFrame(({ clock, camera }) => {
    if (!meshRef.current) return;

    const dist = camera.position.length();
    const baseScale = Math.max(0.08, Math.min(0.22, dist * 0.042));
    const targetScale = hovered
      ? baseScale * 1.6
      : isHighlighted
      ? baseScale * 1.25
      : isFaded
      ? baseScale * 0.85
      : baseScale;

    const cur = meshRef.current.scale.x;
    meshRef.current.scale.setScalar(cur + (targetScale - cur) * 0.12);
    meshRef.current.material.opacity = isFaded ? 0.2 : 1;

    if (ringRef.current) {
      const t = clock.getElapsedTime();
      const pulse = 1 + Math.sin(t * 3) * 0.18;
      const rs = meshRef.current.scale.x * 1.6 * pulse;
      ringRef.current.scale.setScalar(rs);
      ringRef.current.material.opacity = isHighlighted
        ? 0.55 + Math.sin(t * 3) * 0.25
        : 0;
    }
  });

  return (
    <Billboard position={pos}>
      <mesh ref={ringRef} renderOrder={1}>
        <ringGeometry args={[0.85, 1.1, 32]} />
        <meshBasicMaterial
          color={glowColor}
          transparent
          depthWrite={false}
        />
      </mesh>
      <mesh
        ref={meshRef}
        renderOrder={2}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "default";
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          onDoubleClick(animal);
        }}
      >
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          map={texture}
          transparent
          alphaTest={0.05}
          depthWrite={false}
        />
      </mesh>
    </Billboard>
  );
});

export default AnimalMarker;
