import { useLoader } from "@react-three/fiber";
import { TextureLoader } from "three";

const EARTH_TEXTURE =
  "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg";

export default function Globe() {
  const texture = useLoader(TextureLoader, EARTH_TEXTURE);

  return (
    <mesh>
      <sphereGeometry args={[2, 64, 64]} />
      <meshStandardMaterial map={texture} />
    </mesh>
  );
}
