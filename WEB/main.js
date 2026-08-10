/**
 * Goofy Foot® — Spray Reveal Interaction + Gallery Drag Scroll
 *
 * Section 2: 흰색 캔버스 위를 클릭/드래그하면
 * 가운데가 강하고 바깥으로 갈수록 약한 스프레이 패턴으로
 * 흰색이 지워지며 아래 소나무 이미지가 드러남.
 * 1분 간 액션이 없으면 다시 흰색으로 복원됨.
 *
 * Section 4: Pine_1~6 이미지를 옆으로 드래그하여 넘기는 갤러리 인터랙션.
 */

document.addEventListener('DOMContentLoaded', () => {
  // -------------------------------------------------------
  // Web Audio API (iOS Safari 호환)
  // -------------------------------------------------------
  let audioCtx = null;

  function initAudio() {
    if (audioCtx) {
      if (audioCtx.state === 'suspended') audioCtx.resume();
      return;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) {
        audioCtx = new AC();
        if (audioCtx.state === 'suspended') audioCtx.resume();
      }
    } catch (e) { /* 오디오 미지원 */ }
  }

  function playSpraySound() {
    initAudio();
    if (!audioCtx) return;
    try {
      const len = audioCtx.sampleRate * 0.35;
      const buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.18));
      }
      const src = audioCtx.createBufferSource();
      src.buffer = buf;
      const filt = audioCtx.createBiquadFilter();
      filt.type = 'bandpass';
      filt.frequency.value = 1800;
      filt.Q.value = 2;
      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.005, audioCtx.currentTime + 0.3);
      src.connect(filt);
      filt.connect(gain);
      gain.connect(audioCtx.destination);
      src.start();
    } catch (e) { /* 오디오 에러 무시 */ }
  }

  document.addEventListener('click', initAudio, { once: true });
  document.addEventListener('touchstart', initAudio, { passive: true, once: true });

  // -------------------------------------------------------
  // Scroll Reveal Observer
  // -------------------------------------------------------
  const revealElements = document.querySelectorAll('.scroll-reveal');
  
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach((el) => revealObserver.observe(el));
  } else {
    revealElements.forEach((el) => el.classList.add('is-visible'));
  }

  // -------------------------------------------------------
  // Navigation Pill Active Tracker
  // -------------------------------------------------------
  const sections = document.querySelectorAll('.section-page');
  const navPills = document.querySelectorAll('.nav-pill');

  window.addEventListener('scroll', () => {
    let currentSectionId = '';
    sections.forEach((sec) => {
      const top = sec.offsetTop;
      const height = sec.offsetHeight;
      if (window.scrollY >= top - height / 3) {
        currentSectionId = sec.getAttribute('id');
      }
    });

    navPills.forEach((pill) => {
      if (pill.getAttribute('href') === `#${currentSectionId}`) {
        pill.style.background = 'rgba(0, 0, 0, 0.08)';
      } else if (!pill.classList.contains('logo-pill')) {
        pill.style.background = 'transparent';
      }
    });
  });

  // -------------------------------------------------------
  // Spray Reveal Canvas
  // -------------------------------------------------------
  const canvas = document.getElementById('spray-canvas');
  const container = document.getElementById('spray-container');
  const hint = document.getElementById('spray-hint');

  if (canvas && container) {
    const ctx = canvas.getContext('2d');
    let isDrawing = false;
    let hasStarted = false;
    let inactivityTimer = null;
    const INACTIVITY_TIMEOUT = 60000; // 1분 (60초)

    // 캔버스를 흰색으로 채움 (확실한 복원)
    function fillWhite() {
      if (!canvas.width || !canvas.height) return;
      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }

    // 캔버스 크기 설정 (유효한 너비/높이 보장)
    function resizeCanvas(forceFill = true) {
      const rect = container.getBoundingClientRect();
      const w = Math.floor(rect.width || container.offsetWidth || window.innerWidth || 1920);
      const h = Math.floor(rect.height || container.offsetHeight || window.innerHeight || 1080);

      const changed = (canvas.width !== w || canvas.height !== h);
      canvas.width = w;
      canvas.height = h;

      if (forceFill || changed || !hasStarted) {
        fillWhite();
      }
    }

    // 초기화 및 로드 시 캔버스 백색 채우기 보장
    resizeCanvas(true);
    window.addEventListener('load', () => resizeCanvas(true));
    requestAnimationFrame(() => resizeCanvas(true));
    setTimeout(() => resizeCanvas(true), 100);
    setTimeout(() => resizeCanvas(true), 400);

    // 소나무 이미지 설정 (최초 로드 시 1회 고정으로 이미지 깜빡임 방지)
    const revealImage = document.getElementById('reveal-image');
    const treeImages = [
      'images/tree_2.png',
      'images/tree_3.png',
      'images/tree_4.png',
      'images/tree_5.png'
    ];

    function setRandomTreeImage() {
      if (!revealImage) return;
      const randomIndex = Math.floor(Math.random() * treeImages.length);
      revealImage.src = treeImages[randomIndex];
    }

    setRandomTreeImage();

    const heroLogo = document.getElementById('spray-hero-logo');

    function hideHeroLogo() {
      if (heroLogo) heroLogo.classList.add('hidden');
      if (hint) hint.classList.add('hidden');
    }

    function showHeroLogo() {
      if (heroLogo) heroLogo.classList.remove('hidden');
      if (hint) hint.classList.remove('hidden');
    }

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resizeCanvas(true);
        hasStarted = false;
        showHeroLogo();
      }, 200);
    });

    // 1분 비활성 후 흰색으로 부드럽게 복원
    function resetToWhite() {
      let opacity = 0;
      const fadeStep = 0.02;

      function fade() {
        opacity += fadeStep;
        if (opacity >= 1) {
          fillWhite();
          hasStarted = false;
          showHeroLogo();
          return;
        }
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = opacity;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
        requestAnimationFrame(fade);
      }
      fade();
    }

    function resetInactivityTimer() {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(resetToWhite, INACTIVITY_TIMEOUT);
    }

    // 향수 에어로졸 스티플 미스트 (모바일 GPU 최적화)
    function triggerPerfumeBurst(x, y) {
      const rect = canvas.getBoundingClientRect();
      const cx = x - rect.left;
      const cy = y - rect.top;

      const isMobile = window.innerWidth < 768 || ('ontouchstart' in window);
      const maxRadius = isMobile ? 220 : 325;
      const startTime = performance.now();
      const DURATION = isMobile ? 600 : 800;

      function animateMist(now) {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / DURATION);
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const currentRadius = maxRadius * (0.2 + 0.8 * easeProgress);

        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';

        const frameDots = isMobile ? 4000 : 28000;
        const opacitySlices = isMobile ? 5 : 8;
        const dotsPerSlice = Math.floor(frameDots / opacitySlices);

        for (let s = 0; s < opacitySlices; s++) {
          const t = s / (opacitySlices - 1);
          const alpha = 0.95 * Math.pow(1 - t, 1.8) + 0.03;
          const sliceMaxRadius = currentRadius * Math.pow(1 - (s / opacitySlices) * 0.65, 1.1);

          ctx.globalAlpha = alpha;
          ctx.beginPath();

          for (let i = 0; i < dotsPerSlice; i++) {
            const angle = Math.random() * Math.PI * 2;
            const u = Math.random();
            const dist = Math.pow(u, 2.0) * sliceMaxRadius;

            const px = cx + Math.cos(angle) * dist;
            const py = cy + Math.sin(angle) * dist;

            const size = isMobile ? (Math.random() * 1.4 + 0.6) : (Math.random() * 0.8 + 0.2);
            ctx.rect(px, py, size, size);
          }
          ctx.fill();
        }
        ctx.restore();

        if (progress < 1) {
          requestAnimationFrame(animateMist);
        }
      }

      requestAnimationFrame(animateMist);
    }

    let currentX = 0;
    let currentY = 0;
    let animFrameId = null;
    let lastBurstTime = 0;

    function sprayLoop() {
      if (!isDrawing) return;
      const now = performance.now();
      const isMobile = window.innerWidth < 768 || ('ontouchstart' in window);
      const interval = isMobile ? 180 : 120;

      if (now - lastBurstTime > interval) {
        triggerPerfumeBurst(currentX, currentY);
        lastBurstTime = now;
      }
      resetInactivityTimer();
      animFrameId = requestAnimationFrame(sprayLoop);
    }

    function onSprayStart(x, y) {
      isDrawing = true;
      currentX = x;
      currentY = y;

      if (!hasStarted) {
        hasStarted = true;
        playSpraySound();
        hideHeroLogo();
      }

      triggerPerfumeBurst(currentX, currentY);
      lastBurstTime = performance.now();
      resetInactivityTimer();

      if (animFrameId) cancelAnimationFrame(animFrameId);
      sprayLoop();
    }

    function onSprayMove(x, y) {
      currentX = x;
      currentY = y;
      if (!isDrawing) return;
      resetInactivityTimer();
    }

    function onSprayEnd() {
      isDrawing = false;
      if (animFrameId) {
        cancelAnimationFrame(animFrameId);
        animFrameId = null;
      }
    }

    const interactEl = container || canvas;

    // 마우스 및 터치 이벤트 핸들러
    interactEl.addEventListener('mousedown', (e) => {
      onSprayStart(e.clientX, e.clientY);
    });
    window.addEventListener('mousemove', (e) => {
      onSprayMove(e.clientX, e.clientY);
    });
    window.addEventListener('mouseup', onSprayEnd);

    interactEl.addEventListener('touchstart', (e) => {
      if (e.touches.length) {
        onSprayStart(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });
    window.addEventListener('touchmove', (e) => {
      if (e.touches.length) {
        onSprayMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });
    interactEl.addEventListener('touchend', onSprayEnd, { passive: true });
  }

  // -------------------------------------------------------
  // Cicada FAB Scroll to Top
  // -------------------------------------------------------
  const cicadaFab = document.getElementById('cicada-fab');
  if (cicadaFab) {
    cicadaFab.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // -------------------------------------------------------
  // Background Music (BGM) & Sound Toggle (Volume: 30%)
  // -------------------------------------------------------
  const bgmAudio = document.getElementById('bgm-audio');
  const bgmToggleBtn = document.getElementById('bgm-toggle-btn');
  let isBgmPlaying = false;
  let isUserExplicitlyMuted = false;

  if (bgmAudio) {
    bgmAudio.volume = 0.3; // 30% volume
  }

  function updateSoundUI(playing) {
    if (!bgmToggleBtn) return;
    if (playing) {
      bgmToggleBtn.textContent = 'SOUND ON';
      bgmToggleBtn.classList.remove('is-muted');
      bgmToggleBtn.setAttribute('aria-label', 'Turn Sound Off');
    } else {
      bgmToggleBtn.textContent = 'SOUND OFF';
      bgmToggleBtn.classList.add('is-muted');
      bgmToggleBtn.setAttribute('aria-label', 'Turn Sound On');
    }
  }

  function playBGM() {
    if (!bgmAudio || isUserExplicitlyMuted) return;
    bgmAudio.volume = 0.3;
    const playPromise = bgmAudio.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        isBgmPlaying = true;
        updateSoundUI(true);
      }).catch(() => {
        isBgmPlaying = false;
        updateSoundUI(false);
      });
    }
  }

  function pauseBGM() {
    if (!bgmAudio) return;
    bgmAudio.pause();
    isBgmPlaying = false;
    updateSoundUI(false);
  }

  if (bgmToggleBtn) {
    bgmToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (isBgmPlaying) {
        isUserExplicitlyMuted = true;
        pauseBGM();
      } else {
        isUserExplicitlyMuted = false;
        playBGM();
      }
    });
  }

  // Auto-play on first user interaction across the window
  const triggerAudioOnFirstAction = () => {
    if (!isBgmPlaying && !isUserExplicitlyMuted) {
      playBGM();
    }
  };

  window.addEventListener('pointerdown', triggerAudioOnFirstAction, { once: true });
  window.addEventListener('keydown', triggerAudioOnFirstAction, { once: true });
  window.addEventListener('touchstart', triggerAudioOnFirstAction, { once: true });

  // -------------------------------------------------------
  // Cicada FAB Hover SFX Interaction (Button Sound.wav)
  // -------------------------------------------------------
  const hoverSfx = document.getElementById('hover-sfx');

  if (cicadaFab && hoverSfx) {
    hoverSfx.volume = 0.45;

    const playHoverSfx = () => {
      // Only play SFX if sound is ON and not muted by user
      if (isUserExplicitlyMuted || !isBgmPlaying) return;
      try {
        hoverSfx.currentTime = 0;
        hoverSfx.play().catch(() => {});
      } catch (err) {}
    };

    cicadaFab.addEventListener('mouseenter', playHoverSfx);
    cicadaFab.addEventListener('touchstart', playHoverSfx, { passive: true });
  }
});
