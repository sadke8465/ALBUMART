/**
 * A lightweight mesh gradient implementation for creating smooth 
 * animated gradients with Canvas 2D
 */
class MeshGradient {
  constructor(options) {
    this.canvas = options.canvas;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Unable to get 2D context from canvas');
    this.ctx = ctx;
    
    this.points = [];
    this.blurAmount = options.blurAmount || 80;
    
    // Set default colors if none provided
    this.colors = options.colorPoints || [
      '#000000', '#222222', '#333333', '#444444', '#555555'
    ];
    
    const pointCount = options.pointCount || 7;
    this.initializePoints(pointCount);
    
    this.targetColors = [...this.colors];
    this.transitionStartTime = 0;
    this.isTransitioning = false;
  }
  
  /**
   * Create initial gradient points with random positions
   */
  initializePoints(count) {
    const { width, height } = this.canvas;
    this.points = [];
    
    // Create points with random positions across the canvas
    for (let i = 0; i < count; i++) {
      const colorIndex = i % this.colors.length;
      
      this.points.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.max(width, height) * (0.1 + Math.random() * 0.2),
        color: this.colors[colorIndex],
        targetColor: this.colors[colorIndex],
        originalColor: this.colors[colorIndex]
      });
    }
  }
  
  /**
   * Update colors used in the gradient
   */
  updateColors(newColors) {
    if (!newColors || newColors.length < 1) return;
    
    // Start color transition
    this.targetColors = [...newColors];
    while (this.targetColors.length < this.points.length) {
      // If we have fewer colors than points, duplicate colors
      this.targetColors = [...this.targetColors, ...newColors];
    }
    
    // Set target color for each point
    this.points.forEach((point, i) => {
      point.originalColor = point.color;
      point.targetColor = this.targetColors[i % this.targetColors.length];
    });
    
    this.isTransitioning = true;
    this.transitionStartTime = performance.now();
  }
  
  /**
   * Animate color transition between original and target colors
   * @param progress Value between 0-1 representing animation progress
   */
  animateColors(progress) {
    if (this.isTransitioning) {
      // Calculate transition progress (complete in 500ms)
      const elapsed = performance.now() - this.transitionStartTime;
      const transitionProgress = Math.min(1, elapsed / 500);
      
      // Update each point's current color based on transition progress
      this.points.forEach(point => {
        point.color = this.lerpColor(
          point.originalColor, 
          point.targetColor, 
          transitionProgress
        );
      });
      
      // Transition complete
      if (transitionProgress >= 1) {
        this.isTransitioning = false;
        this.colors = [...this.targetColors];
        
        // Update original colors
        this.points.forEach(point => {
          point.originalColor = point.color;
        });
      }
    }
    
    // Apply subtle "drift" movement to points for animation when not transitioning
    // but don't change colors when not transitioning
    if (!this.isTransitioning) {
      const { width, height } = this.canvas;
      const maxMove = Math.min(width, height) * 0.05;
      
      this.points.forEach(point => {
        // Subtle perlin-like movement based on the progress value
        const angle = Math.sin(progress * Math.PI * 2) * Math.PI * 2;
        const moveAmount = Math.sin(progress * Math.PI) * maxMove;
        
        // Circular motion
        point.x += Math.cos(angle) * moveAmount;
        point.y += Math.sin(angle) * moveAmount;
        
        // Keep points on canvas
        point.x = Math.max(0, Math.min(width, point.x));
        point.y = Math.max(0, Math.min(height, point.y));
      });
    }
  }
  
  /**
   * Linear interpolation between two colors
   */
  lerpColor(color1, color2, amount) {
    const r1 = parseInt(color1.slice(1, 3), 16);
    const g1 = parseInt(color1.slice(3, 5), 16);
    const b1 = parseInt(color1.slice(5, 7), 16);
    
    const r2 = parseInt(color2.slice(1, 3), 16);
    const g2 = parseInt(color2.slice(3, 5), 16);
    const b2 = parseInt(color2.slice(5, 7), 16);
    
    const r = Math.round(r1 + (r2 - r1) * amount);
    const g = Math.round(g1 + (g2 - g1) * amount);
    const b = Math.round(b1 + (b2 - b1) * amount);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
  
  /**
   * Render the gradient to the canvas
   */
  render() {
    const { width, height } = this.canvas;
    const ctx = this.ctx;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Apply blur
    ctx.shadowBlur = this.blurAmount;
    ctx.globalCompositeOperation = 'source-over';
    
    // Draw each point as a radial gradient
    this.points.forEach(point => {
      const gradient = ctx.createRadialGradient(
        point.x, point.y, 0,
        point.x, point.y, point.radius
      );
      
      // Add color stops
      gradient.addColorStop(0, point.color);
      gradient.addColorStop(1, `${point.color}00`); // Transparent version of color
      
      // Set shadow color to match gradient
      ctx.shadowColor = point.color;
      
      // Draw gradient
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }
}
