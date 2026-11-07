/**
 * CYBERPRO CINEMATIC BRAND SIGNATURE ENGINE
 * Ultra-Premium, 60fps GPU-optimized cinematic brand animation
 * Features:
 *  - Canvas-based ambient cyber particles and energy trails
 *  - Letter-by-letter metallic chrome & emerald 3D depth
 *  - Continuous futuristic laser scanning beam with specular glint
 *  - Harmonic breathing light pulse & telemetry HUD
 *  - IntersectionObserver auto-pause for zero CPU/battery waste
 *  - Full prefers-reduced-motion accessibility support
 */

(function () {
  'use strict';

  function initSignature() {
    // 1. Locate or create signature containers on the current page
    let wraps = document.querySelectorAll('.footer-wordmark-wrap');

    // If on homepage and no .footer-wordmark-wrap yet, replace faded background text or append to footer
    if (wraps.length === 0) {
      const footer = document.querySelector('footer');
      if (footer) {
        // Remove legacy faded text if present
        const faded = footer.querySelector('.select-none.opacity-\\[0\\.03\\], .select-none.opacity-5');
        if (faded) faded.remove();

        const newWrap = document.createElement('div');
        newWrap.className = 'footer-wordmark-wrap';
        footer.appendChild(newWrap);
        wraps = [newWrap];
      }
    }



    wraps.forEach((wrap) => {
      // Prevent double initialization
      if (wrap.dataset.cyberproInit === 'true') return;
      wrap.dataset.cyberproInit = 'true';

      wrap.innerHTML = `
        <!-- Deep Cinematic Ambient Background & Particle Canvas -->
        <canvas class="cyberpro-canvas-ambient"></canvas>
        <div class="cyberpro-atmosphere-glow"></div>

        <!-- Upper Precision Telemetry Ribbon -->
        <div class="wordmark-telemetry">
          <span class="telemetry-beacon">
            <span class="beacon-ping"></span>
            <span class="beacon-core"></span>
          </span>
          <span class="telemetry-text">DEFENSE GRID ACTIVE // CCCE CERTIFIED // GLOBAL PROTOCOL</span>
          <span class="telemetry-beacon">
            <span class="beacon-ping"></span>
            <span class="beacon-core"></span>
          </span>
        </div>

        <!-- Laser Horizon Emitter -->
        <div class="cyberpro-horizon-emitter">
          <div class="horizon-beam"></div>
          <div class="horizon-flare"></div>
        </div>

        <!-- Main CYBERPRO 3D Wordmark Stage -->
        <div class="cyberpro-stage-container" aria-label="CYBERPRO">
          <div class="cyberpro-letters-wrapper">
            <span class="c-letter" data-char="C">C</span>
            <span class="c-letter" data-char="Y">Y</span>
            <span class="c-letter" data-char="B">B</span>
            <span class="c-letter" data-char="E">E</span>
            <span class="c-letter" data-char="R">R</span>
            <span class="c-letter" data-char="P">P</span>
            <span class="c-letter" data-char="R">R</span>
            <span class="c-letter" data-char="O">O</span>
          </div>

          <!-- Futuristic Scanning Laser Beam Sweep -->
          <div class="cyber-laser-scanner">
            <div class="laser-vertical-line"></div>
            <div class="laser-glow-sheen"></div>
          </div>
        </div>

        <!-- Lower Architectural Subline -->
        <div class="wordmark-subline">
          <span class="subline-bracket">[</span>
          <span class="subline-content">PRACTICAL OFFENSIVE SECURITY &bull; ENTERPRISE LABS &bull; NEXT-GEN READINESS</span>
          <span class="subline-bracket">]</span>
        </div>
      `;

      // Set up Particle Canvas
      const canvas = wrap.querySelector('.cyberpro-canvas-ambient');
      if (canvas) {
        setupParticleCanvas(wrap, canvas);
      }
    });
  }

  function setupParticleCanvas(container, canvas) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = container.offsetWidth || 800);
    let height = (canvas.height = container.offsetHeight || 260);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Responsive particle count
    const particleCount = width < 600 ? 22 : 45;
    const particles = [];

    class Particle {
      constructor() {
        this.reset(true);
      }
      reset(initial = false) {
        this.x = Math.random() * width;
        this.y = initial ? Math.random() * height : height + 5;
        this.vx = (Math.random() - 0.5) * 0.45;
        this.vy = -(0.35 + Math.random() * 0.65);
        this.size = 1 + Math.random() * 1.8;
        this.alpha = 0.15 + Math.random() * 0.55;
        this.fadeSpeed = 0.003 + Math.random() * 0.006;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= this.fadeSpeed;
        if (this.y < 0 || this.alpha <= 0) {
          this.reset(false);
        }
      }
      draw(c) {
        c.fillStyle = `rgba(57, 255, 20, ${this.alpha})`;
        c.shadowColor = '#39ff14';
        c.shadowBlur = this.size * 3;
        c.beginPath();
        c.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        c.fill();
        c.shadowBlur = 0;
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    let isVisible = true;
    let animId = null;

    function render() {
      if (!isVisible) return;
      ctx.clearRect(0, 0, width, height);

      // Draw subtle connecting mesh lines between nearby particles
      ctx.lineWidth = 0.6;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 60) {
            const lineAlpha = (1 - dist / 60) * 0.12 * Math.min(particles[i].alpha, particles[j].alpha);
            ctx.strokeStyle = `rgba(57, 255, 20, ${lineAlpha})`;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Update and draw particles
      particles.forEach((p) => {
        if (!prefersReducedMotion) p.update();
        p.draw(ctx);
      });

      if (!prefersReducedMotion) {
        animId = requestAnimationFrame(render);
      }
    }

    // Observer to pause animation when offscreen
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            isVisible = entry.isIntersecting;
            if (isVisible && !prefersReducedMotion) {
              if (animId) cancelAnimationFrame(animId);
              animId = requestAnimationFrame(render);
            }
          });
        },
        { threshold: 0.05 }
      );
      observer.observe(container);
    } else {
      animId = requestAnimationFrame(render);
    }

    // Resize handler with debounce
    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        width = canvas.width = container.offsetWidth || 800;
        height = canvas.height = container.offsetHeight || 260;
      }, 200);
    });

    render();
  }

  // Auto-init on script load or DOM readiness
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSignature);
  } else {
    initSignature();
  }

  // Export globally for dynamic SPA/LMS view changes
  window.initCyberproSignature = initSignature;
})();
