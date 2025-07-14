import * as THREE from "three";
import { OrbitControls } from 'jsm/controls/OrbitControls.js';
import getStarfield from "./src/getStarfield.js";
import { drawThreeGeo } from "./src/threeGeoJSON.js";

const w = window.innerWidth;
const h = window.innerHeight;
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000000, 0.3);
const camera = new THREE.PerspectiveCamera(75, w / h, 1, 100);
camera.position.z = 5;
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(w, h);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Globe wireframe
const geometry = new THREE.SphereGeometry(2);
const lineMat = new THREE.LineBasicMaterial({ 
  color: 0xffffff,
  transparent: true,
  opacity: 0.4, 
});
const edges = new THREE.EdgesGeometry(geometry, 1);
const line = new THREE.LineSegments(edges, lineMat);
scene.add(line);

// Starfield background
const stars = getStarfield({ numStars: 1000, fog: false });
scene.add(stars);

// Animal sprites and interaction
const animalSprites = [];
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let hoveredSprite = null;
const tooltip = createTooltip();

/**
 * Initialize the globe with country boundaries and animal sprites
 */
function initGlobe() {
  // Load country boundaries
  fetch('./geojson/ne_110m_land.json')
    .then(response => response.text())
    .then(text => {
      const data = JSON.parse(text);
      const countries = drawThreeGeo({
        json: data,
        radius: 2,
        materialOptions: {
          color: 0x80FF80,
        },
      });
      scene.add(countries);
    });

  // Load and display animals
  loadAnimals();
}

/**
 * Load animal data and create sprites for each animal
 */
function loadAnimals() {
  fetch('./data/animals.json')
    .then(response => response.json())
    .then(animals => {
      // Filter out animals without valid coordinates
      const validAnimals = animals.filter(animal => 
        animal.lat !== 0 || animal.lon !== 0
      );

      validAnimals.forEach(animal => {
        addAnimalSprite(animal);
      });

      // Update counter
      const counter = document.getElementById('animalCounter');
      if (counter) {
        counter.textContent = `Animals loaded: ${validAnimals.length}`;
      }

      console.log(`✓ Loaded ${validAnimals.length} animals onto the globe`);
    })
    .catch(error => {
      console.warn('Could not load animals.json from GitHub:', error);
      // Add some default animals if fetch fails
      addDefaultAnimals();
    });
}

/**
 * Add default animals if JSON file is not available
 */
function addDefaultAnimals() {
  const defaultAnimals = [
    { name: "Tiger", lat: 22.5, lon: 88.3, country: "India" },
    { name: "Kangaroo", lat: -25.3, lon: 133.8, country: "Australia" },
    { name: "Panda", lat: 35.0, lon: 104.0, country: "China" },
    { name: "Lion", lat: -1.3, lon: 36.8, country: "Kenya" }
  ];

  defaultAnimals.forEach(animal => {
    addAnimalSprite(animal);
  });
}

/**
 * Create a sprite for an animal at specified lat/lon coordinates
 */
function addAnimalSprite(animal) {
  // Skip animals without valid coordinates
  if (!animal.lat && !animal.lon) {
    return;
  }

  // Create a loading texture first
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = 128;
  canvas.height = 128;

  // Draw a colored circle with animal initial as fallback
  const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff'];
  const color = colors[Math.floor(Math.random() * colors.length)];

  context.fillStyle = color;
  context.beginPath();
  context.arc(64, 64, 60, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = 'white';
  context.font = 'bold 32px Arial';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(animal.name[0], 64, 64);

  // Add a subtle border
  context.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  context.lineWidth = 4;
  context.stroke();

  // Create texture and sprite
  const texture = new THREE.CanvasTexture(canvas);
  const spriteMaterial = new THREE.SpriteMaterial({ 
    map: texture,
    transparent: true,
    alphaTest: 0.1
  });
  const sprite = new THREE.Sprite(spriteMaterial);

  // Convert lat/lon to 3D coordinates on sphere
  const position = latLonToVector3(animal.lat, animal.lon, 2.1);
  sprite.position.copy(position);
  sprite.scale.set(0.4, 0.4, 0.4);

  // Store animal data in sprite userData
  sprite.userData = {
    animal: animal,
    originalScale: 0.4,
    isHovered: false
  };

  // Load actual animal image if available
  if (animal.img) {
    const textureLoader = new THREE.TextureLoader();
    textureLoader.crossOrigin = 'anonymous';
    textureLoader.load(
      animal.img,
      (loadedTexture) => {
        // Create a circular mask for the image
        const maskCanvas = document.createElement('canvas');
        const maskCtx = maskCanvas.getContext('2d');
        maskCanvas.width = 128;
        maskCanvas.height = 128;

        // Create circular clipping path
        maskCtx.beginPath();
        maskCtx.arc(64, 64, 60, 0, Math.PI * 2);
        maskCtx.clip();

        // Create temporary image element
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          // Draw the image within the circular mask
          maskCtx.drawImage(img, 0, 0, 128, 128);

          // Add border
          maskCtx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
          maskCtx.lineWidth = 4;
          maskCtx.stroke();

          // Update sprite texture
          const maskedTexture = new THREE.CanvasTexture(maskCanvas);
          sprite.material.map = maskedTexture;
          sprite.material.needsUpdate = true;
        };
        img.src = animal.img;
      },
      undefined,
      (error) => {
        console.warn(`Could not load image for ${animal.name}:`, error);
      }
    );
  }

  animalSprites.push(sprite);
  scene.add(sprite);
}

/**
 * Convert latitude and longitude to 3D vector coordinates
 */
function latLonToVector3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = (radius * Math.sin(phi) * Math.sin(theta));
  const y = (radius * Math.cos(phi));

  return new THREE.Vector3(x, y, z);
}

/**
 * Setup raycaster for mouse interaction with sprites
 */
function setupRaycaster() {
  renderer.domElement.addEventListener('mousemove', onMouseMove);
  renderer.domElement.addEventListener('click', onMouseClick);
}

/**
 * Handle mouse movement for hover effects
 */
function onMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(animalSprites);

  // Reset previously hovered sprite
  if (hoveredSprite && !intersects.find(i => i.object === hoveredSprite)) {
    animateSprite(hoveredSprite, hoveredSprite.userData.originalScale);
    hoveredSprite.userData.isHovered = false;
    hideTooltip();
    hoveredSprite = null;
  }

  // Handle new hover
  if (intersects.length > 0) {
    const sprite = intersects[0].object;
    if (sprite !== hoveredSprite) {
      hoveredSprite = sprite;
      sprite.userData.isHovered = true;
      animateSprite(sprite, sprite.userData.originalScale * 1.5);
      showTooltip(sprite.userData.animal, event.clientX, event.clientY);

      // Play sound if available
      playAnimalSound(sprite.userData.animal);
    }
  }

  // Update cursor style
  renderer.domElement.style.cursor = intersects.length > 0 ? 'pointer' : 'default';
}

/**
 * Handle mouse clicks on sprites
 */
function onMouseClick(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(animalSprites);

  if (intersects.length > 0) {
    const animal = intersects[0].object.userData.animal;
    console.log(`Clicked on ${animal.name} from ${animal.country}`);

    // Additional click effects could go here
    playAnimalSound(animal);
  }
}

/**
 * Animate sprite scaling with smooth transition
 */
function animateSprite(sprite, targetScale) {
  const startScale = sprite.scale.x;
  const duration = 200; // milliseconds
  const startTime = Date.now();

  function animate() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeProgress = 1 - Math.pow(1 - progress, 3); // ease-out cubic

    const currentScale = startScale + (targetScale - startScale) * easeProgress;
    sprite.scale.set(currentScale, currentScale, currentScale);

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  }

  animate();
}

/**
 * Play animal sound if available
 */
function playAnimalSound(animal) {
  if (animal.sound) {
    const audio = new Audio(animal.sound);
    audio.volume = 0.3;
    audio.play().catch(error => {
      console.warn(`Could not play sound for ${animal.name}:`, error);
    });
  }
}

/**
 * Create tooltip element for animal information
 */
function createTooltip() {
  const tooltip = document.createElement('div');
  tooltip.style.cssText = `
    position: absolute;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 8px 12px;
    border-radius: 4px;
    font-family: Arial, sans-serif;
    font-size: 14px;
    pointer-events: none;
    z-index: 1000;
    display: none;
    white-space: nowrap;
  `;
  document.body.appendChild(tooltip);
  return tooltip;
}

/**
 * Show tooltip with animal information
 */
function showTooltip(animal, x, y) {
  const location = animal.country && animal.country.trim() !== '' 
    ? animal.country 
    : `${animal.lat.toFixed(1)}°, ${animal.lon.toFixed(1)}°`;

  tooltip.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <div>
        <strong style="color: #80FF80; font-size: 16px;">${animal.name}</strong><br>
        <span style="color: #ccc; font-size: 12px;">📍 ${location}</span>
      </div>
    </div>
  `;
  tooltip.style.display = 'block';
  tooltip.style.left = (x + 10) + 'px';
  tooltip.style.top = (y - 10) + 'px';
}

/**
 * Hide the tooltip
 */
function hideTooltip() {
  tooltip.style.display = 'none';
}

/**
 * Main animation loop
 */
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
  controls.update();

  // Update any animated sprites
  animalSprites.forEach(sprite => {
    if (sprite.userData.isHovered) {
      // Gentle floating animation for hovered sprites
      const time = Date.now() * 0.002;
      const offset = Math.sin(time) * 0.05;
      const basePosition = latLonToVector3(
        sprite.userData.animal.lat, 
        sprite.userData.animal.lon, 
        2.1 + offset
      );
      sprite.position.copy(basePosition);
    }
  });
}

/**
 * Handle window resize
 */
function handleWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Initialize everything
initGlobe();
setupRaycaster();
animate();

window.addEventListener('resize', handleWindowResize, false);