import { useState, useEffect } from "react";
import * as THREE from "three";
import { IUCN_COLORS } from "../utils/iucn";

const resolvedUrlCache = new Map();
const textureCache = new Map();

function createFallbackTexture(animal) {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  const color = IUCN_COLORS[animal.iucn_status] || "#666666";

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(64, 64, 60, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "white";
  ctx.font = "bold 52px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(((animal.name || "?")[0] || "?").toUpperCase(), 64, 64);

  return new THREE.CanvasTexture(canvas);
}

function createImageTexture(img, iucnStatus) {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");

  ctx.save();
  ctx.beginPath();
  ctx.arc(64, 64, 60, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(img, 0, 0, 128, 128);
  ctx.restore();

  const color = IUCN_COLORS[iucnStatus] || "#666666";
  ctx.strokeStyle = color;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(64, 64, 57, 0, Math.PI * 2);
  ctx.stroke();

  return new THREE.CanvasTexture(canvas);
}

async function resolveImageUrl(imgUrl) {
  if (resolvedUrlCache.has(imgUrl)) return resolvedUrlCache.get(imgUrl);

  let url = imgUrl;
  if (imgUrl.includes("commons.wikimedia.org")) {
    const filename = decodeURIComponent(imgUrl.split("/").pop());
    const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${filename}&prop=imageinfo&iiprop=url&format=json&origin=*`;
    const res = await fetch(apiUrl);
    const data = await res.json();
    const pages = data.query.pages;
    const page = pages[Object.keys(pages)[0]];
    if (page.imageinfo?.[0]) {
      url = page.imageinfo[0].url;
    } else {
      resolvedUrlCache.set(imgUrl, null);
      return null;
    }
  }

  resolvedUrlCache.set(imgUrl, url);
  return url;
}

export function useAnimalTexture(animal) {
  const [texture, setTexture] = useState(() => createFallbackTexture(animal));

  useEffect(() => {
    if (!animal.img) return;
    const key = animal.img + "|" + animal.iucn_status;

    if (textureCache.has(key)) {
      setTexture(textureCache.get(key));
      return;
    }

    let cancelled = false;

    resolveImageUrl(animal.img)
      .then((url) => {
        if (!url || cancelled) return;
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          if (cancelled) return;
          const tex = createImageTexture(img, animal.iucn_status);
          textureCache.set(key, tex);
          setTexture(tex);
        };
        img.onerror = () => {};
        img.src = url;
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [animal.img, animal.iucn_status]);

  return texture;
}
