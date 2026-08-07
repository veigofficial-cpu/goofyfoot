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

    // 캔버스 크기 설정 (항상 유효 크기 측정 및 흰색 채우기)
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

    // 초기화 및 다중 프레임 백색 채우기 보장
    resizeCanvas(true);
    window.addEventListener('load', () => resizeCanvas(true));
    requestAnimationFrame(() => resizeCanvas(true));
    setTimeout(() => resizeCanvas(true), 100);
    setTimeout(() => resizeCanvas(true), 400);

    // 소나무 이미지 랜덤 선택 (tree_2, tree_3, tree_4, tree_5)
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

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resizeCanvas(true);
        hasStarted = false;
        if (hint) hint.classList.remove('hidden');
      }, 200);
    });

    // 1분 비활성 후 흰색으로 부드럽게 복원하며 이미지 랜덤 재설정
    function resetToWhite() {
      let opacity = 0;
      const fadeStep = 0.02;

      function fade() {
        opacity += fadeStep;
        if (opacity >= 1) {
          fillWhite();
          hasStarted = false;
          setRandomTreeImage();
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

    // 향수 에어로졸 스티플 미스트
    function triggerPerfumeBurst(x, y) {
      const rect = canvas.getBoundingClientRect();
      const cx = x - rect.left;
      const cy = y - rect.top;

      const maxRadius = window.innerWidth < 768 ? 225 : 325;
      const startTime = performance.now();
      const DURATION = 800;

      function animateMist(now) {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / DURATION);
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const currentRadius = maxRadius * (0.2 + 0.8 * easeProgress);

        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';

        const frameDots = 30000;
        const opacitySlices = 8;
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

            const size = Math.random() * 0.8 + 0.2;
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
      if (now - lastBurstTime > 120) {
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
        if (hint) hint.classList.add('hidden');
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
    window.addEventListener('touchend', onSprayEnd, { passive: true });
  }

  // -------------------------------------------------------
  // Gallery Smooth Bounded Drag-to-Scroll Interaction (Exact Start/End Alignment, No White Space)
  // -------------------------------------------------------
  const gallerySection = document.getElementById('gallery');
  const galleryTrack = document.getElementById('gallery-track');

  if (gallerySection && galleryTrack) {
    let isDragging = false;
    let startX = 0;
    let startTrackX = 0;
    let currentX = 0;
    let targetX = 0;
    let velocity = 0;
    let lastMoveX = 0;
    let lastMoveTime = 0;

    function getBounds() {
      const trackWidth = galleryTrack.getBoundingClientRect().width;
      const viewWidth = gallerySection.clientWidth;
      const minX = Math.min(0, viewWidth - trackWidth);
      return { minX, maxX: 0 };
    }

    function updatePhysics() {
      const { minX, maxX } = getBounds();

      if (isDragging) {
        // 드래그 중: 목표 위치로 부드럽게 이송 (lerp)
        currentX += (targetX - currentX) * 0.35;
      } else {
        // 드래그 해제 후: 관성 이동 및 경계선 튕김 보정
        if (Math.abs(velocity) > 0.1) {
          targetX += velocity;
          velocity *= 0.92; // 마찰 감속
        } else {
          velocity = 0;
        }

        // 정확한 시작(Pine_1)과 끝(Pine_12) 지점 경계선 탄성 복원
        if (targetX > maxX) {
          targetX += (maxX - targetX) * 0.25;
        } else if (targetX < minX) {
          targetX += (minX - targetX) * 0.25;
        }

        currentX += (targetX - currentX) * 0.25;
      }

      galleryTrack.style.transform = `translate3d(${currentX}px, 0, 0)`;
      requestAnimationFrame(updatePhysics);
    }

    requestAnimationFrame(updatePhysics);

    function startDrag(x) {
      isDragging = true;
      startX = x;
      startTrackX = targetX;
      velocity = 0;
      lastMoveX = x;
      lastMoveTime = performance.now();
    }

    function moveDrag(x) {
      if (!isDragging) return;
      const dx = x - startX;
      const { minX, maxX } = getBounds();
      let nextX = startTrackX + dx;

      // 경계 밖으로 나갈 때 고무줄 저항 효과
      if (nextX > maxX) {
        nextX = maxX + (nextX - maxX) * 0.2;
      } else if (nextX < minX) {
        nextX = minX + (nextX - minX) * 0.2;
      }

      targetX = nextX;

      const now = performance.now();
      const dt = now - lastMoveTime;
      if (dt > 0) {
        velocity = ((x - lastMoveX) / dt) * 14;
      }
      lastMoveX = x;
      lastMoveTime = now;
    }

    function endDrag() {
      if (!isDragging) return;
      isDragging = false;
      const { minX, maxX } = getBounds();
      // 관성을 통한 최종 이동 타겟 계산
      targetX += velocity * 5;
      targetX = Math.max(minX, Math.min(maxX, targetX));
    }

    // 마우스 이벤트
    gallerySection.addEventListener('mousedown', (e) => {
      startDrag(e.clientX);
      e.preventDefault();
    });
    window.addEventListener('mousemove', (e) => {
      moveDrag(e.clientX);
    });
    window.addEventListener('mouseup', endDrag);

    // 터치 이벤트
    gallerySection.addEventListener('touchstart', (e) => {
      if (e.touches.length) startDrag(e.touches[0].clientX);
    }, { passive: true });
    gallerySection.addEventListener('touchmove', (e) => {
      if (e.touches.length) moveDrag(e.touches[0].clientX);
    }, { passive: true });
    gallerySection.addEventListener('touchend', endDrag, { passive: true });

    // 카드 클릭 이벤트 (드래그 중 클릭 방지)
    gallerySection.addEventListener('click', (e) => {
      if (Math.abs(velocity) > 2) {
        e.preventDefault();
        e.stopPropagation();
      }
    });
  }
});
