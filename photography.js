/**
 * Brian Lam - Full Photography Archive Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  initAmbientCanvas();
  initNavigation();
  initFullGalleryAndLightbox();
  initCurrentYear();
});

/* ==========================================================================
   1. Ambient Constellation Canvas
   ========================================================================== */
function initAmbientCanvas() {
  const canvas = document.getElementById('ambient-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  let width, height;
  let particles = [];
  const particleCount = Math.min(Math.floor(window.innerWidth / 28), 40);

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }
  
  window.addEventListener('resize', resize);
  resize();

  class Particle {
    constructor() {
      this.reset();
    }

    reset() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * 0.3;
      this.vy = (Math.random() - 0.5) * 0.3;
      this.radius = Math.random() * 1.5 + 0.5;
      this.alpha = Math.random() * 0.5 + 0.2;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      if (this.x < 0 || this.x > width) this.vx *= -1;
      if (this.y < 0 || this.y > height) this.vy *= -1;
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(56, 189, 248, ${this.alpha})`;
      ctx.fill();
    }
  }

  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 120) {
          const alpha = (1 - dist / 120) * 0.1;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(99, 102, 241, ${alpha})`;
          ctx.lineWidth = 0.7;
          ctx.stroke();
        }
      }
    }

    particles.forEach(p => {
      p.update();
      p.draw();
    });

    requestAnimationFrame(animate);
  }

  animate();
}

/* ==========================================================================
   2. Navigation Header
   ========================================================================== */
function initNavigation() {
  const header = document.getElementById('site-header');
  const mobileToggle = document.getElementById('mobile-toggle');
  const mobileDrawer = document.getElementById('mobile-drawer');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 30) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  if (mobileToggle && mobileDrawer) {
    mobileToggle.addEventListener('click', () => {
      mobileToggle.classList.toggle('active');
      mobileDrawer.classList.toggle('open');
    });
  }
}

/* ==========================================================================
   3. Full Gallery Rendering & Lightbox Modal
   ========================================================================== */
function initFullGalleryAndLightbox() {
  const photoGrid = document.getElementById('full-photo-grid');
  const filterBtns = document.querySelectorAll('.gallery-filter-btn');
  const albumCards = document.querySelectorAll('.album-card');
  const statusLabel = document.getElementById('current-filter-label');
  
  const modal = document.getElementById('lightbox-modal');
  const backdrop = document.getElementById('lightbox-backdrop');
  const closeBtn = document.getElementById('lightbox-close');
  const prevBtn = document.getElementById('lightbox-prev');
  const nextBtn = document.getElementById('lightbox-next');
  const lbImage = document.getElementById('lightbox-image');
  const lbTitle = document.getElementById('lightbox-title');
  const lbLoc = document.getElementById('lightbox-loc');
  const lbTech = document.getElementById('lightbox-tech');

  if (!window.photosData || !photoGrid) return;

  let currentFilteredPhotos = [...window.photosData];
  let currentActiveIndex = 0;

  const categoryNames = {
    'all': 'all 123 photographs',
    'nyc': 'New York City collection (59 photos)',
    'tokyo': 'Tokyo collection (15 photos)',
    'chicago': 'Chicago collection (17 photos)',
    'seattle': 'Seattle collection (14 photos)',
    'washu': 'Debate Day at WashU collection (18 photos)'
  };

  function renderGallery(photos) {
    photoGrid.innerHTML = '';

    photos.forEach((photo, idx) => {
      const card = document.createElement('div');
      card.className = 'photo-card';
      card.setAttribute('data-category', photo.category);
      card.setAttribute('data-series', photo.series);

      card.innerHTML = `
        <div class="photo-img-wrap">
          <img src="${photo.thumb}" alt="${photo.title}" loading="lazy" class="gallery-img">
          <div class="photo-overlay">
            <div class="photo-meta">
              <span class="photo-loc">${photo.location} · ${photo.year}</span>
              <h4 class="photo-title">${photo.title}</h4>
              <span class="photo-tech">${photo.seriesTitle}</span>
            </div>
            <button class="photo-zoom-btn" aria-label="View photo in lightbox">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                <line x1="11" y1="8" x2="11" y2="14"></line>
                <line x1="8" y1="11" x2="14" y2="11"></line>
              </svg>
            </button>
          </div>
        </div>
      `;

      card.addEventListener('click', () => {
        openLightbox(idx);
      });

      photoGrid.appendChild(card);
    });
  }

  function applyFilter(filterKey) {
    // Sync filter button active states
    filterBtns.forEach(b => {
      if (b.getAttribute('data-filter') === filterKey) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });

    if (filterKey === 'all') {
      currentFilteredPhotos = [...window.photosData];
    } else {
      currentFilteredPhotos = window.photosData.filter(p => p.category === filterKey || p.series === filterKey);
    }

    if (statusLabel) {
      statusLabel.innerText = `Showing ${categoryNames[filterKey] || currentFilteredPhotos.length + ' photos'}`;
    }

    renderGallery(currentFilteredPhotos);
  }

  // Filter Buttons
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.getAttribute('data-filter');
      applyFilter(filter);
    });
  });

  // Album Cards (Top quick links)
  albumCards.forEach(card => {
    card.addEventListener('click', () => {
      const series = card.getAttribute('data-filter-series');
      applyFilter(series);
      // Scroll to gallery
      const filterBar = document.getElementById('gallery-filters');
      if (filterBar) {
        filterBar.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  });

  // Initial Render
  renderGallery(currentFilteredPhotos);

  // Lightbox Functions
  function openLightbox(index) {
    if (!modal || currentFilteredPhotos.length === 0) return;
    currentActiveIndex = index;
    updateLightboxContent();
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (!modal) return;
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function updateLightboxContent() {
    const photo = currentFilteredPhotos[currentActiveIndex];
    if (!photo) return;

    lbImage.src = photo.src;
    lbImage.alt = photo.title;
    lbTitle.innerText = photo.title;
    lbLoc.innerText = `${photo.location} (${photo.year})`;
    lbTech.innerText = `${photo.seriesTitle} · Photo ${currentActiveIndex + 1} of ${currentFilteredPhotos.length}`;
  }

  function showPrev() {
    if (currentFilteredPhotos.length === 0) return;
    currentActiveIndex = (currentActiveIndex - 1 + currentFilteredPhotos.length) % currentFilteredPhotos.length;
    updateLightboxContent();
  }

  function showNext() {
    if (currentFilteredPhotos.length === 0) return;
    currentActiveIndex = (currentActiveIndex + 1) % currentFilteredPhotos.length;
    updateLightboxContent();
  }

  if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
  if (backdrop) backdrop.addEventListener('click', closeLightbox);
  if (prevBtn) prevBtn.addEventListener('click', (e) => { e.stopPropagation(); showPrev(); });
  if (nextBtn) nextBtn.addEventListener('click', (e) => { e.stopPropagation(); showNext(); });

  // Keyboard navigation
  window.addEventListener('keydown', (e) => {
    if (!modal || !modal.classList.contains('active')) return;

    if (e.key === 'Escape') {
      closeLightbox();
    } else if (e.key === 'ArrowLeft') {
      showPrev();
    } else if (e.key === 'ArrowRight') {
      showNext();
    }
  });
}

function initCurrentYear() {
  const yearEl = document.getElementById('current-year');
  if (yearEl) {
    yearEl.innerText = new Date().getFullYear();
  }
}
