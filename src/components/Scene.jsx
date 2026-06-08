import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import Globe from "./Globe";
import Starfield from "./Starfield";
import AnimalMarkers from "./AnimalMarkers";
import CameraController from "./CameraController";
import { latLonToVector3 } from "../utils/geo";

function normalizeAngle(a) {
  return ((a % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI) - Math.PI;
}

function GlobeGroup({ animals, occurrenceAnimal, onAnimalDoubleClick }) {
  const groupRef = useRef();
  const tourRef = useRef({ index: 0, timer: 0, settling: false });

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    if (!occurrenceAnimal) {
      // Normal auto-rotation — reset tour state
      groupRef.current.rotation.y += delta * 0.06;
      tourRef.current = { index: 0, timer: 0, settling: false };
      return;
    }

    // Build the full list: primary location first, then all occurrences
    const points = [
      { lat: occurrenceAnimal.lat, lon: occurrenceAnimal.lon },
      ...(occurrenceAnimal.occurrences || []),
    ];

    const idx = tourRef.current.index % points.length;
    const pt = points[idx];

    // Get the point's local-space position on the unit sphere
    const pos = latLonToVector3(pt.lat, pt.lon, 1);

    // Target Y rotation: bring this longitude to the +Z front (facing camera)
    const targetY = -Math.atan2(pos.x, pos.z);

    // Shortest-path lerp for Y
    const curY = groupRef.current.rotation.y;
    const diffY = normalizeAngle(targetY - curY);
    groupRef.current.rotation.y += diffY * Math.min(delta * 2.5, 1);

    // Target X rotation: tilt globe so latitude is vertically centered
    const xzLen = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
    const targetX = -Math.atan2(pos.y, xzLen);
    const curX = groupRef.current.rotation.x;
    const diffX = targetX - curX;
    groupRef.current.rotation.x += diffX * Math.min(delta * 2.5, 1);

    // Once both axes are settled, count down and advance to next point
    const settled = Math.abs(diffY) < 0.02 && Math.abs(diffX) < 0.02;
    if (settled) {
      tourRef.current.timer += delta;
      if (tourRef.current.timer >= 2.5) {
        tourRef.current.timer = 0;
        tourRef.current.index = (tourRef.current.index + 1) % points.length;
      }
    } else {
      tourRef.current.timer = 0;
    }
  });

  return (
    <group ref={groupRef}>
      <Globe />
      <AnimalMarkers
        animals={animals}
        occurrenceAnimal={occurrenceAnimal}
        onDoubleClick={onAnimalDoubleClick}
      />
    </group>
  );
}

export default function Scene({
  animals,
  occurrenceAnimal,
  flyToTarget,
  onAnimalDoubleClick,
}) {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 75, near: 0.5, far: 200 }}
      style={{ background: "#000000", width: "100vw", height: "100vh" }}
    >
      <ambientLight intensity={0.35} />
      <directionalLight position={[5, 3, 5]} intensity={1.3} />
      <Starfield numStars={1000} />
      <Suspense fallback={null}>
        <GlobeGroup
          animals={animals}
          occurrenceAnimal={occurrenceAnimal}
          onAnimalDoubleClick={onAnimalDoubleClick}
        />
      </Suspense>
      <CameraController flyToTarget={flyToTarget} />
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={2.5}
        maxDistance={15}
      />
    </Canvas>
  );
}
