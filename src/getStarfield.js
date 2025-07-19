import * as THREE from "three";

export default function getStarfield({ numStars = 500, fog = false } = {}) {
  const verts = [];
  for (let i = 0; i < numStars; i++) {
    const x = (Math.random() - 0.5) * 2000;
    const y = (Math.random() - 0.5) * 2000;
    const z = -Math.random() * 2000;
    verts.push(x, y, z);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));

  const mat = new THREE.PointsMaterial({ 
    color: 0xffffff,
    size: 2,
    fog: fog
  });

  const points = new THREE.Points(geo, mat);
  return points;
}