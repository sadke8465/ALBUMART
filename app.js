// Sample album art collection for demo purposes
const SAMPLE_ALBUMS = [
  {
    title: "Currents",
    artist: "Tame Impala",
    imageUrl: "https://upload.wikimedia.org/wikipedia/en/9/9b/Tame_Impala_-_Currents.png"
  },
  {
    title: "Random Access Memories",
    artist: "Daft Punk",
    imageUrl: "https://upload.wikimedia.org/wikipedia/en/a/a7/Random_Access_Memories.jpg"
  },
  {
    title: "DAMN.",
    artist: "Kendrick Lamar",
    imageUrl: "https://upload.wikimedia.org/wikipedia/en/5/51/Kendrick_Lamar_-_Damn.png"
  },
  {
    title: "Blonde",
    artist: "Frank Ocean",
    imageUrl: "https://upload.wikimedia.org/wikipedia/en/a/a0/Blonde_-_Frank_Ocean.jpeg"
  },
  {
    title: "After Hours",
    artist: "The Weeknd",
    imageUrl: "https://upload.wikimedia.org/wikipedia/en/c/c1/The_Weeknd_-_After_Hours.png"
  }
];

document.addEventListener('DOMContentLoaded', () => {
  // Initialize main structure
  const artContainer = document.getElementById('art-container');
  const imageWrapper = document.getElementById('image-wrapper');
  let currentTrackId = null;
  let zoomActive = false;
  let zoomQuadrant = 0;
  let zoomAnimationTimeout = null;
  let transitionTimeout = null;
  let tracks = [];
  let shouldAnimate = true;
  
  // Create canvas for mesh gradient
  const meshCanvas = document.createElement('canvas');
  meshCanvas.id = 'mesh-canvas';
  document.body.prepend(meshCanvas);
  
  // Initialize mesh gradient
  let meshGradient = null;
  
  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  shouldAnimate = !prefersReducedMotion;
  
  // Create and set up the canvas
  function setupMeshGradient() {
    meshCanvas.width = window.innerWidth;
    meshCanvas.height = window.innerHeight;
    
    meshGradient = new MeshGradient({
      canvas: meshCanvas,
      blurAmount: 80,
      colorPoints: ['#000000', '#222222', '#333333', '#444444', '#555555'],
      pointCount: 7
    });
    
    meshGradient.render();
    
    // Start animation loop if motion is allowed
    if (shouldAnimate) {
      startMeshAnimation();
    }
  }
  
  // Animation function for mesh gradient
  let lastFrameTime = 0;
  const FPS = 30;
  const frameInterval = 1000 / FPS;
  let animationId = null;
  
  function animateMesh(timestamp) {
    if (!meshGradient) return;
    
    // Control FPS
    if (timestamp - lastFrameTime >= frameInterval) {
      lastFrameTime = timestamp;
      
      // 20s animation loop with ease-in-out
      const progress = (timestamp % 20000) / 20000;
      const easeInOut = progress < 0.5 ? 
        2 * progress * progress : 
        1 - Math.pow(-2 * progress + 2, 2) / 2;
      
      meshGradient.animateColors(easeInOut);
      meshGradient.render();
    }
    
    animationId = requestAnimationFrame(animateMesh);
  }
  
  function startMeshAnimation() {
    if (animationId) cancelAnimationFrame(animationId);
    lastFrameTime = performance.now();
    animationId = requestAnimationFrame(animateMesh);
  }
  
  function stopMeshAnimation() {
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
  }
  
  // Handle visibility change
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      stopMeshAnimation();
    } else if (shouldAnimate) {
      startMeshAnimation();
    }
  });
  
  // Handle window resize
  window.addEventListener('resize', () => {
    if (meshCanvas) {
      meshCanvas.width = window.innerWidth;
      meshCanvas.height = window.innerHeight;
      
      if (meshGradient) {
        meshGradient.render();
      }
    }
  });
  
  // Extract color palette from image
  function extractPalette(imageUrl) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      
      img.onload = () => {
        try {
          const colorThief = new ColorThief();
          const palette = colorThief.getPalette(img, 7);
          
          // Convert RGB to hex
          const hexPalette = palette.map(rgb => {
            return '#' + rgb.map(x => {
              const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16);
              return hex.length === 1 ? '0' + hex : hex;
            }).join('');
          });
          
          resolve(hexPalette);
        } catch (error) {
          console.error('Error extracting colors:', error);
          resolve(['#000000', '#222222', '#333333', '#444444', '#555555']);
        }
      };
      
      img.onerror = () => {
        resolve(['#000000', '#222222', '#333333', '#444444', '#555555']);
      };
      
      img.src = imageUrl;
    });
  }
  
  // Update background with new track
  async function addNewTrack(title, artist, imageUrl) {
    // Cancel any ongoing transitions
    if (transitionTimeout) {
      clearTimeout(transitionTimeout);
      transitionTimeout = null;
    }
    
    // Extract palette from image
    const palette = await extractPalette(imageUrl);
    
    // Update mesh gradient colors
    if (meshGradient) {
      meshGradient.updateColors(palette);
    }
    
    // Custom event for cover change
    const coverChangedEvent = new CustomEvent('coverChanged', {
      detail: { url: imageUrl }
    });
    window.dispatchEvent(coverChangedEvent);
    
    // Create unique track ID
    const uniqueId = `${title}-${artist}-${Date.now()}`;
    
    // Add to tracks array
    tracks.push({
      title,
      artist,
      imageUrl,
      key: uniqueId
    });
    
    // Create background layer
    const bgLayer = document.createElement('div');
    bgLayer.className = `backgroundArt ${tracks.length > 1 ? 'bottomBackgroundLayer' : 'topBackgroundLayer'}`;
    bgLayer.style.backgroundImage = `url(${imageUrl})`;
    bgLayer.id = `bg-${uniqueId}`;
    artContainer.appendChild(bgLayer);
    
    // Create image layer
    const imageLayer = document.createElement('div');
    imageLayer.className = `imageLayer ${tracks.length > 1 ? 'bottomLayer' : 'topLayer'}`;
    
    const albumImg = document.createElement('img');
    albumImg.src = imageUrl;
    albumImg.alt = `${title} by ${artist}`;
    albumImg.width = 775;
    albumImg.height = 500;
    albumImg.className = 'albumImage';
    albumImg.style.objectFit = 'fill';
    
    imageLayer.appendChild(albumImg);
    imageWrapper.appendChild(imageLayer);
    
    // Start transition
    artContainer.classList.add('transitioning');
    
    // After transition completes, remove old layers
    transitionTimeout = setTimeout(() => {
      // Keep only the newest track
      const oldTracks = tracks.slice(0, -1);
      tracks = [tracks[tracks.length - 1]];
      
      // Remove old layers
      oldTracks.forEach(oldTrack => {
        const oldBg = document.getElementById(`bg-${oldTrack.key}`);
        if (oldBg) oldBg.remove();
        
        // Remove old image layers (all except the last one)
        const imageLayers = imageWrapper.querySelectorAll('.imageLayer');
        if (imageLayers.length > 1) {
          for (let i = 0; i < imageLayers.length - 1; i++) {
            imageLayers[i].remove();
          }
        }
      });
      
      artContainer.classList.remove('transitioning');
    }, 1000);
    
    currentTrackId = uniqueId;
  }
  
  // Quadrant zoom animation
  function startZoomAnimation() {
    if (zoomActive) return;
    
    zoomActive = true;
    zoomQuadrant = 1;
    imageWrapper.classList.add('zooming', 'quadrant1');
    
    function animateQuadrants() {
      zoomQuadrant++;
      
      if (zoomQuadrant > 4) {
        // Reset zoom
        imageWrapper.classList.remove('zooming', 'quadrant1', 'quadrant2', 'quadrant3', 'quadrant4');
        zoomActive = false;
        return;
      }
      
      // Remove old quadrant class
      imageWrapper.classList.remove('quadrant1', 'quadrant2', 'quadrant3', 'quadrant4');
      
      // Add new quadrant class
      imageWrapper.classList.add(`quadrant${zoomQuadrant}`);
    }
    
    // Schedule animation for each quadrant (12 seconds each)
    for (let i = 1; i <= 4; i++) {
      setTimeout(animateQuadrants, i * 12000);
    }
  }
  
  // Initialize with first album
  function initialize() {
    setupMeshGradient();
    
    // Start with a random album
    const randomIndex = Math.floor(Math.random() * SAMPLE_ALBUMS.length);
    const firstAlbum = SAMPLE_ALBUMS[randomIndex];
    
    addNewTrack(
      firstAlbum.title, 
      firstAlbum.artist, 
      firstAlbum.imageUrl
    );
    
    // Start automatic album rotation
    setInterval(() => {
      const nextIndex = Math.floor(Math.random() * SAMPLE_ALBUMS.length);
      const nextAlbum = SAMPLE_ALBUMS[nextIndex];
      
      addNewTrack(
        nextAlbum.title,
        nextAlbum.artist,
        nextAlbum.imageUrl
      );
    }, 60000); // Switch every 60 seconds
    
    // Trigger initial zoom animation after 2 seconds
    setTimeout(() => {
      startZoomAnimation();
    }, 2000);
    
    // Set up auto-zoom every 2 minutes
    setInterval(() => {
      if (!zoomActive) {
        startZoomAnimation();
      }
    }, 120000);
  }
  
  // 'A' key press triggers zoom animation
  document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'a' && !zoomActive) {
      startZoomAnimation();
    }
  });
  
  // Start everything
  initialize();
});
