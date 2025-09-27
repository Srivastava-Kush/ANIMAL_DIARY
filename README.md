# 🌍 Animal Globe - Explore Wildlife Around the World

> Discover the amazing diversity of Earth's wildlife through an interactive 3D experience!

Hey there! 👋 Welcome to Animal Globe, an immersive web app that lets you explore animals from all around the world. Using modern web technologies, I've created an educational and entertaining experience that brings wildlife right to your screen.

## ✨ Key Features

| Feature                     | Description                                                     |
| --------------------------- | --------------------------------------------------------------- |
| 🌐 **Interactive 3D Globe** | Spin, zoom, and explore animal locations worldwide              |
| 🎨 **Stunning Visuals**     | Beautiful animal cards, smooth animations, starfield background |
| 📚 **Wildlife Education**   | Learn about species, habitats, and conservation status          |
| 🌊 **Sea Life Flipbook**    | Browse through our collection of marine life                    |
| 🔍 **Smart Search**         | Find animals by name or IUCN Red List status                    |
| 📱 **Responsive Design**    | Perfect experience on any device                                |

## 🛠️ Tech Stack

### Frontend

- HTML5, CSS3, JavaScript (ES6+)
- Three.js for 3D globe rendering
- Custom CSS animations & transitions

### Data & Assets

- GeoJSON for geographical mapping
- Custom Animals.json dataset with 300+ species
- AI-curated data from IUCN Red List
- High-quality Wikimedia images
- Optimized for performance

## 🎮 Quick Start Guide

### 1️⃣ Landing Page

- Check out the rotating animal cards
- Browse through navigation options

### 2️⃣ Globe Exploration

- Click "Enter Animal Globe" button
- Double-click icons for animal details
- Drag to rotate the globe
- Scroll to zoom in/out

### 3️⃣ Discovery Tools

- Use the search bar for specific animals
- Filter by conservation status
- Explore the sea life flipbook in Inspiration
- Learn about the project in Author section

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Srivastava-Kush/ANIMAL_DIARY.git
   ```

2. **Navigate to the project directory**

   ```bash
   cd 3d-globe-with-threejs
   ```

3. **Set up a local server**

   Install `live-server` globally:

   ```bash
   npm install -g live-server
   ```

   Or use it via `npx`:

   ```bash
   npx live-server --port=8080
   ```

4. **Run the server**

   ```bash
   live-server --port=8080
   ```

   This will serve the files in the current directory at `http://localhost:8080`.

5. **Open the application in your browser**

   Navigate to `http://localhost:8080` to view the globe visualization.

## Data Sources

- **GeoJSON Data**: Country outlines are sourced from [Natural Earth GeoJSON](https://github.com/martynafford/natural-earth-geojson).
- **Additional Datasets**: For more datasets, visit [Natural Earth Data](https://www.naturalearthdata.com/downloads/).

## Acknowledgments

- **Three.js**: [threejs.org](https://threejs.org/)
- **Natural Earth Data**: [naturalearthdata.com](https://www.naturalearthdata.com/)
