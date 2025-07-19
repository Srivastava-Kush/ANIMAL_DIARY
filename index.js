
import * as THREE from "https://unpkg.com/three@0.158.0/build/three.module.js";
import { OrbitControls } from 'https://unpkg.com/three@0.158.0/examples/jsm/controls/OrbitControls.js';
import getStarfield from "./src/getStarfield.js";
import { drawThreeGeo } from "./src/threeGeoJSON.js";

const w = window.innerWidth;
const h = window.innerHeight;
let scene, camera, renderer, controls;
let animalSprites = [];
let allAnimals = [];
let filteredAnimals = [];
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let hoveredSprite = null;
let currentPage = 'landing';

// Landing page functionality
function showSection(section) {
    // Hide all sections first
    document.querySelectorAll('.content-section').forEach(sec => sec.classList.remove('active'));
    
    // Show selected section
    document.getElementById(section).classList.add('active');
    
    // Add click outside to close
    setTimeout(() => {
        document.addEventListener('click', closeSectionOnOutsideClick);
    }, 100);
}

function closeSectionOnOutsideClick(event) {
    if (event.target.classList.contains('content-section')) {
        event.target.classList.remove('active');
        document.removeEventListener('click', closeSectionOnOutsideClick);
    }
}

function enterGlobe() {
    document.getElementById('landingPage').classList.add('hidden');
    document.getElementById('globePage').classList.remove('hidden');
    currentPage = 'globe';
    initGlobe();
}

function backToLanding() {
    document.getElementById('globePage').classList.add('hidden');
    document.getElementById('landingPage').classList.remove('hidden');
    currentPage = 'landing';
}

function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (username && password) {
        document.querySelector('.blog-login').style.display = 'none';
        document.getElementById('blogContent').classList.remove('hidden');
        loadBlogPosts();
    }
}

function createPost() {
    const title = prompt('Enter post title:');
    const content = prompt('Enter post content:');
    if (title && content) {
        const post = { title, content, votes: 0, author: 'User', timestamp: new Date().toISOString() };
        saveBlogPost(post);
        loadBlogPosts();
    }
}

function loadBlogPosts() {
    const posts = JSON.parse(localStorage.getItem('blogPosts') || '[]');
    const container = document.getElementById('blogPosts');
    container.innerHTML = posts.map(post => `
        <div class="blog-post">
            <h3>${post.title}</h3>
            <p>${post.content}</p>
            <div class="post-meta">
                <span>By ${post.author} - ${new Date(post.timestamp).toLocaleDateString()}</span>
                <div class="vote-buttons">
                    <button onclick="votePost('${post.id}', 1)">👍 ${post.votes}</button>
                    <button onclick="votePost('${post.id}', -1)">👎</button>
                </div>
            </div>
        </div>
    `).join('');
}

function saveBlogPost(post) {
    post.id = Date.now().toString();
    const posts = JSON.parse(localStorage.getItem('blogPosts') || '[]');
    posts.push(post);
    localStorage.setItem('blogPosts', JSON.stringify(posts));
}

function votePost(postId, value) {
    const posts = JSON.parse(localStorage.getItem('blogPosts') || '[]');
    const post = posts.find(p => p.id === postId);
    if (post) {
        post.votes += value;
        localStorage.setItem('blogPosts', JSON.stringify(posts));
        loadBlogPosts();
    }
}

// Globe functionality
function initGlobe() {
    if (scene) return; // Already initialized
    
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.3);
    camera = new THREE.PerspectiveCamera(75, w / h, 1, 100);
    camera.position.z = 5;
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(w, h);
    
    const container = document.getElementById('globeContainer');
    container.appendChild(renderer.domElement);
    
    controls = new OrbitControls(camera, renderer.domElement);
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
    
    // Load animals
    loadAnimals();
    setupEventListeners();
    animate();
}

function loadAnimals() {
    fetch('./data/animals.json')
        .then(response => response.json())
        .then(animals => {
            allAnimals = animals;
            filteredAnimals = [...animals];
            displayAnimals(filteredAnimals);
        })
        .catch(error => {
            console.error('Error loading animals:', error);
        });
}

function displayAnimals(animals) {
    // Clear existing sprites
    animalSprites.forEach(sprite => scene.remove(sprite));
    animalSprites = [];
    
    animals.forEach(animal => {
        if (animal.lat && animal.lon) {
            addAnimalSprite(animal);
        }
    });
}

function addAnimalSprite(animal) {
    // Create canvas for sprite texture
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 128;
    canvas.height = 128;
    
    // Color based on IUCN status
    const statusColors = {
        'critically_endangered': '#d32f2f',
        'endangered': '#f57c00',
        'vulnerable': '#fbc02d',
        'near_threatened': '#689f38',
        'least_concern': '#388e3c'
    };
    
    const color = statusColors[animal.iucn_status] || '#666666';
    
    // Draw circle with IUCN status color
    context.fillStyle = color;
    context.beginPath();
    context.arc(64, 64, 60, 0, Math.PI * 2);
    context.fill();
    
    // Add glow effect for endangered species
    if (['critically_endangered', 'endangered', 'vulnerable'].includes(animal.iucn_status)) {
        context.shadowColor = color;
        context.shadowBlur = 20;
        context.strokeStyle = color;
        context.lineWidth = 4;
        context.stroke();
    }
    
    // Add animal initial
    context.fillStyle = 'white';
    context.font = 'bold 32px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(animal.name[0], 64, 64);
    
    // Create texture and sprite
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ 
        map: texture,
        transparent: true,
        alphaTest: 0.1
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    
    // Position sprite on globe
    const position = latLonToVector3(animal.lat, animal.lon, 2.1);
    sprite.position.copy(position);
    sprite.scale.set(0.4, 0.4, 0.4);
    
    // Store animal data
    sprite.userData = {
        animal: animal,
        originalScale: 0.4,
        isHovered: false
    };
    
    // Load actual animal image
    if (animal.img) {
        loadAnimalImage(animal.img, sprite);
    }
    
    animalSprites.push(sprite);
    scene.add(sprite);
}

function loadAnimalImage(imgUrl, sprite) {
    const textureLoader = new THREE.TextureLoader();
    textureLoader.crossOrigin = 'anonymous';
    textureLoader.load(
        imgUrl,
        (loadedTexture) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 128;
            canvas.height = 128;
            
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                // Create circular clipping path
                ctx.beginPath();
                ctx.arc(64, 64, 60, 0, Math.PI * 2);
                ctx.clip();
                
                // Draw image
                ctx.drawImage(img, 0, 0, 128, 128);
                
                // Add border based on IUCN status
                const animal = sprite.userData.animal;
                const statusColors = {
                    'critically_endangered': '#d32f2f',
                    'endangered': '#f57c00',
                    'vulnerable': '#fbc02d',
                    'near_threatened': '#689f38',
                    'least_concern': '#388e3c'
                };
                
                ctx.strokeStyle = statusColors[animal.iucn_status] || '#666666';
                ctx.lineWidth = 6;
                ctx.stroke();
                
                // Update sprite texture
                const maskedTexture = new THREE.CanvasTexture(canvas);
                sprite.material.map = maskedTexture;
                sprite.material.needsUpdate = true;
            };
            img.src = imgUrl;
        },
        undefined,
        (error) => {
            console.warn(`Could not load image for ${sprite.userData.animal.name}:`, error);
        }
    );
}

function latLonToVector3(lat, lon, radius) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = (radius * Math.sin(phi) * Math.sin(theta));
    const y = (radius * Math.cos(phi));
    
    return new THREE.Vector3(x, y, z);
}

function setupEventListeners() {
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('dblclick', onDoubleClick);
    window.addEventListener('resize', handleWindowResize);
}

function onMouseMove(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(animalSprites);
    
    // Reset previous hover
    if (hoveredSprite && !intersects.find(i => i.object === hoveredSprite)) {
        hoveredSprite.scale.set(0.4, 0.4, 0.4);
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
            sprite.scale.set(0.6, 0.6, 0.6);
            showTooltip(sprite.userData.animal, event.clientX, event.clientY);
        }
    }
    
    renderer.domElement.style.cursor = intersects.length > 0 ? 'pointer' : 'default';
}

function onDoubleClick(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(animalSprites);
    
    if (intersects.length > 0) {
        const animal = intersects[0].object.userData.animal;
        showAnimalModal(animal);
    }
}

function showTooltip(animal, x, y) {
    let tooltip = document.getElementById('tooltip');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'tooltip';
        tooltip.style.cssText = `
            position: absolute;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 10px 15px;
            border-radius: 5px;
            font-size: 14px;
            pointer-events: none;
            z-index: 1000;
            white-space: nowrap;
        `;
        document.body.appendChild(tooltip);
    }
    
    tooltip.innerHTML = `<strong>${animal.name}</strong><br>${animal.country}`;
    tooltip.style.left = (x + 10) + 'px';
    tooltip.style.top = (y - 10) + 'px';
    tooltip.style.display = 'block';
}

function hideTooltip() {
    const tooltip = document.getElementById('tooltip');
    if (tooltip) {
        tooltip.style.display = 'none';
    }
}

function showAnimalModal(animal) {
    const modal = document.getElementById('animalModal');
    const modalBody = document.getElementById('modalBody');
    
    const statusLabels = {
        'critically_endangered': 'Critically Endangered',
        'endangered': 'Endangered',
        'vulnerable': 'Vulnerable',
        'near_threatened': 'Near Threatened',
        'least_concern': 'Least Concern'
    };
    
    modalBody.innerHTML = `
        <div class="animal-detail">
            <img src="${animal.img}" alt="${animal.name}">
            <h2>${animal.name}</h2>
            <p><strong>Location:</strong> ${animal.country}</p>
            <div class="iucn-badge ${animal.iucn_status}">
                ${statusLabels[animal.iucn_status] || animal.iucn_status}
            </div>
            <p><strong>Habitat:</strong> ${animal.habitat || 'Various'}</p>
            <p><strong>Fun Fact:</strong> ${animal.fun_fact || 'No fun fact available'}</p>
            <button onclick="showAllOccurrences('${animal.name}')" class="occurrence-btn">
                Show All Occurrences
            </button>
            <button onclick="reportDiscrepancy('${animal.name}')" class="report-btn">
                Report Discrepancy
            </button>
        </div>
    `;
    
    modal.classList.remove('hidden');
}

function closeModal() {
    document.getElementById('animalModal').classList.add('hidden');
}

function showAllOccurrences(animalName) {
    const animal = allAnimals.find(a => a.name === animalName);
    if (animal && animal.occurrences) {
        // Clear existing sprites and show all occurrences
        animalSprites.forEach(sprite => scene.remove(sprite));
        animalSprites = [];
        
        // Show primary location
        addAnimalSprite(animal);
        
        // Show all occurrences
        animal.occurrences.forEach(occurrence => {
            const occurrenceAnimal = {
                ...animal,
                country: occurrence.country,
                lat: occurrence.lat,
                lon: occurrence.lon,
                name: animal.name + ' (occurrence)'
            };
            addAnimalSprite(occurrenceAnimal);
        });
        
        closeModal();
    }
}

function reportDiscrepancy(animalName = '') {
    const message = `Report a discrepancy for: ${animalName}\n\nPlease describe the issue:`;
    const report = prompt(message);
    if (report) {
        // In a real app, this would send to a server
        alert('Thank you for your report. It has been submitted for review.');
        console.log('Discrepancy report:', { animal: animalName, report: report });
    }
}

function filterAnimals() {
    const searchTerm = document.getElementById('animalSearch').value.toLowerCase();
    const iucnFilter = document.getElementById('iucnFilter').value;
    
    filteredAnimals = allAnimals.filter(animal => {
        const matchesSearch = animal.name.toLowerCase().includes(searchTerm);
        const matchesIUCN = !iucnFilter || animal.iucn_status === iucnFilter;
        return matchesSearch && matchesIUCN;
    });
    
    displayAnimals(filteredAnimals);
}

function animate() {
    if (currentPage !== 'globe') return;
    
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
    
    // Animate hovered sprites
    animalSprites.forEach(sprite => {
        if (sprite.userData.isHovered) {
            const time = Date.now() * 0.003;
            const offset = Math.sin(time) * 0.1;
            const baseScale = sprite.userData.originalScale * 1.5;
            sprite.scale.set(baseScale + offset, baseScale + offset, baseScale + offset);
        }
    });
}

function handleWindowResize() {
    if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

// Flashcard slideshow animation
function initFlashcardSlideshow() {
    const flashcards = document.querySelectorAll('.flashcard');
    let currentIndex = 0;
    
    setInterval(() => {
        flashcards.forEach(card => card.classList.remove('active'));
        currentIndex = (currentIndex + 1) % flashcards.length;
        flashcards[currentIndex].classList.add('active');
    }, 3000);
}

// Initialize everything
document.addEventListener('DOMContentLoaded', () => {
    initFlashcardSlideshow();
    
    // Make functions globally available
    window.showSection = showSection;
    window.enterGlobe = enterGlobe;
    window.backToLanding = backToLanding;
    window.login = login;
    window.createPost = createPost;
    window.votePost = votePost;
    window.filterAnimals = filterAnimals;
    window.closeModal = closeModal;
    window.showAllOccurrences = showAllOccurrences;
    window.reportDiscrepancy = reportDiscrepancy;
});
