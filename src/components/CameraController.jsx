import { useRef, useEffect } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { latLonToVector3 } from "../utils/geo";

export default function CameraController({ flyToTarget }) {
  const { camera } = useThree();
  const targetRef = useRef(null);

  useEffect(() => {
    if (flyToTarget) {
      const dir = latLonToVector3(flyToTarget.lat, flyToTarget.lon, 1).normalize();
      targetRef.current = dir.multiplyScalar(5);
    }
  }, [flyToTarget]);

  useFrame((_, delta) => {
    if (!targetRef.current) return;
    camera.position.lerp(targetRef.current, delta * 1.8);
    if (camera.position.distanceTo(targetRef.current) < 0.05) {
      targetRef.current = null;
    }
  });

  return null;
}
