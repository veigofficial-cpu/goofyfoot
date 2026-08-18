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
  // Always Start at Section 1 (Top Hero) on Page Load / Link Entry
  // -------------------------------------------------------
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }
  if (window.location.hash) {
    history.replaceState(null, '', window.location.pathname + window.location.search);
  }
  window.scrollTo(0, 0);
  window.addEventListener('load', () => {
    window.scrollTo(0, 0);
  });

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

  const sprayAudio = document.getElementById('spray-sfx');

  function playSpraySound() {
    if (isUserExplicitlyMuted) return;
    if (sprayAudio) {
      try {
        sprayAudio.volume = 0.1; // 10% volume
        sprayAudio.currentTime = 0;
        sprayAudio.play().catch(() => {});
        return;
      } catch (e) {}
    }
  }

  document.addEventListener('click', initAudio, { once: true });
  document.addEventListener('touchstart', initAudio, { passive: true, once: true });

  // -------------------------------------------------------
  // Scroll Reveal Observer (Triggers every time on scroll)
  // -------------------------------------------------------
  const revealElements = document.querySelectorAll('.scroll-reveal');
  
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        } else {
          entry.target.classList.remove('is-visible');
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
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

    // 캔버스 크기 설정 (유효한 너비/높이 보장 및 드로잉 상태 보존)
    function resizeCanvas(forceFill = false) {
      const rect = container.getBoundingClientRect();
      const w = Math.round(rect.width || container.offsetWidth || window.innerWidth || 1920);
      const h = Math.round(rect.height || container.offsetHeight || window.innerHeight || 1080);

      if (w <= 0 || h <= 0) return;

      const changed = (canvas.width !== w || canvas.height !== h);
      if (changed) {
        if (hasStarted && canvas.width > 0 && canvas.height > 0) {
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = canvas.width;
          tempCanvas.height = canvas.height;
          const tempCtx = tempCanvas.getContext('2d');
          tempCtx.drawImage(canvas, 0, 0);

          canvas.width = w;
          canvas.height = h;
          ctx.drawImage(tempCanvas, 0, 0, w, h);
        } else {
          canvas.width = w;
          canvas.height = h;
          fillWhite();
        }
      } else if (forceFill || !hasStarted) {
        fillWhite();
      }
    }

    // 초기화 및 로드 시 캔버스 백색 채우기 보장
    resizeCanvas(true);
    window.addEventListener('load', () => resizeCanvas(true));
    requestAnimationFrame(() => resizeCanvas(true));
    setTimeout(() => resizeCanvas(true), 100);
    setTimeout(() => resizeCanvas(true), 400);

    // 스프레이 소나무 이미지 설정: tree_9.png 단일 고정
    const revealImage = document.getElementById('reveal-image');
    if (revealImage) {
      revealImage.src = 'images/tree_9.png';
    }

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
        resizeCanvas(false);
      }, 100);
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

    // 리셋 버튼 클릭 시 스프레이 캔버스 초기화 및 로고 복원 (타 섹션 스크롤 시 상단 복귀)
    const sprayResetBtn = document.getElementById('spray-reset-btn');
    if (sprayResetBtn) {
      sprayResetBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        fillWhite();
        hasStarted = false;
        showHeroLogo();
        if (window.scrollY > 50) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    }

    function resetInactivityTimer() {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(resetToWhite, INACTIVITY_TIMEOUT);
    }

    // 향수 에어로졸 스티플 미스트 (화면 비율 및 캔버스 스케일 1:1 매핑)
    function triggerPerfumeBurst(x, y) {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const cx = (x - rect.left) * scaleX;
      const cy = (y - rect.top) * scaleY;

      const isMobile = window.innerWidth < 768 || ('ontouchstart' in window);
      const maxRadius = isMobile ? 250 : 360;
      const startTime = performance.now();
      const DURATION = isMobile ? 600 : 800;

      function animateMist(now) {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / DURATION);
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const currentRadius = maxRadius * (0.25 + 0.75 * easeProgress);

        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';

        const frameDots = isMobile ? 14000 : 85000;
        const opacitySlices = isMobile ? 6 : 9;
        const dotsPerSlice = Math.floor(frameDots / opacitySlices);

        for (let s = 0; s < opacitySlices; s++) {
          const t = s / (opacitySlices - 1);
          const alpha = 0.99 * Math.pow(1 - t, 1.2) + 0.08;
          const sliceMaxRadius = currentRadius * Math.pow(1 - (s / opacitySlices) * 0.45, 1.05);

          ctx.globalAlpha = alpha;
          ctx.beginPath();

          for (let i = 0; i < dotsPerSlice; i++) {
            const angle = Math.random() * Math.PI * 2;
            const u = Math.random();
            // 중심 분자 밀집 영역을 80% 확장하는 균일 코어 분포
            const dist = Math.pow(u, 1.25) * sliceMaxRadius;
            const normDist = dist / sliceMaxRadius;

            // 중심 65% 반경까지 풍성한 밀집도 유지, 외곽 35% 구간은 퀸틱(Smootherstep) 곡선으로 초미세 분무 감쇄
            if (normDist > 0.65) {
              const k = Math.min(1, (normDist - 0.65) / 0.35);
              const smootherFalloff = k * k * k * (k * (k * 6 - 15) + 10); // 5차 퀸틱 스무딩
              const survivalProb = 1.0 - 0.82 * smootherFalloff; // 1.0 -> 0.18 완전 연속 감쇄
              if (Math.random() > survivalProb) {
                continue;
              }
            }

            const px = cx + Math.cos(angle) * dist;
            const py = cy + Math.sin(angle) * dist;

            // 전체 분자 크기 (초미세 입자)
            const baseSize = isMobile ? (Math.random() * 0.56 + 0.24) : (Math.random() * 0.32 + 0.08);
            ctx.rect(px, py, baseSize, baseSize);
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

      playSpraySound();

      if (!hasStarted) {
        hasStarted = true;
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

    // 마우스 및 터치 이벤트 리스너 (모바일 자연스러운 터치 스크롤 100% 보장)
    [canvas, container].forEach((target) => {
      if (!target) return;

      // 데스크톱 마우스 이벤트
      target.addEventListener('mousedown', (e) => {
        if (e.button && e.button !== 0) return;
        onSprayStart(e.clientX, e.clientY);
      });

      target.addEventListener('mousemove', (e) => {
        if (isDrawing) {
          onSprayMove(e.clientX, e.clientY);
        }
      });

      target.addEventListener('mouseup', onSprayEnd);

      // 모바일 터치 이벤트: passive: true로 세로 스크롤을 절대 막지 않음
      target.addEventListener('touchstart', (e) => {
        if (e.touches && e.touches.length > 0) {
          onSprayStart(e.touches[0].clientX, e.touches[0].clientY);
        }
      }, { passive: true });

      target.addEventListener('touchmove', (e) => {
        if (e.touches && e.touches.length > 0) {
          onSprayMove(e.touches[0].clientX, e.touches[0].clientY);
        }
      }, { passive: true });

      target.addEventListener('touchend', onSprayEnd, { passive: true });
      target.addEventListener('touchcancel', onSprayEnd, { passive: true });
    });

    window.addEventListener('mouseup', onSprayEnd);
    window.addEventListener('touchend', onSprayEnd, { passive: true });
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
  // Product Explain Accordion Interactive Toggles (Single Open Exclusive)
  // -------------------------------------------------------
  const accordionItems = document.querySelectorAll('.product-accordion-group .accordion-item');
  const accordionHeaders = document.querySelectorAll('.product-accordion-group .accordion-header');

  accordionHeaders.forEach((header) => {
    header.addEventListener('click', () => {
      const item = header.closest('.accordion-item');
      if (!item || item.classList.contains('is-disabled')) return;
      const isOpen = item.classList.contains('is-open');

      // 하나의 카테고리만 열리도록 다른 모든 카테고리 닫기
      accordionItems.forEach((otherItem) => {
        otherItem.classList.remove('is-open');
        const otherHeader = otherItem.querySelector('.accordion-header');
        if (otherHeader) otherHeader.setAttribute('aria-expanded', 'false');
      });

      // 클릭한 카테고리가 닫혀있던 상태였다면 열기
      if (!isOpen) {
        item.classList.add('is-open');
        header.setAttribute('aria-expanded', 'true');

        if (window.innerWidth <= 768) {
          setTimeout(() => {
            const rect = header.getBoundingClientRect();
            if (rect.top < 60 || rect.top > window.innerHeight * 0.4) {
              const targetY = window.pageYOffset + rect.top - 70;
              window.scrollTo({ top: targetY, behavior: 'smooth' });
            }
          }, 50);
        }
      }
    });
  });

  // -------------------------------------------------------
  // Section 3 Description Smooth Wheel Scrolling Delegation
  // -------------------------------------------------------
  const productDetails = document.querySelector('.product-explain-details');
  const descScroll = document.querySelector('#accordion-description .accordion-content-inner');

  if (productDetails && descScroll) {
    productDetails.addEventListener('wheel', (e) => {
      // Only apply on desktop sticky panel layout
      if (window.innerWidth <= 768) return;

      const descItem = document.getElementById('accordion-description');
      const isDescOpen = descItem && descItem.classList.contains('is-open');
      if (!isDescOpen) return;

      const isInsideDesc = descScroll.contains(e.target);

      if (!isInsideDesc) {
        const canScrollDown = descScroll.scrollTop + descScroll.clientHeight < descScroll.scrollHeight - 1;
        const canScrollUp = descScroll.scrollTop > 1;

        if ((e.deltaY > 0 && canScrollDown) || (e.deltaY < 0 && canScrollUp)) {
          e.preventDefault();
          descScroll.scrollTop += e.deltaY;
        }
      }
    }, { passive: false });
  }



  // -------------------------------------------------------
  // Background Music (BGM: BGM 2.wav) & Sound Toggle (Volume: 90%)
  // -------------------------------------------------------
  const bgmAudio = document.getElementById('bgm-audio');
  const bgmToggleBtn = document.getElementById('bgm-toggle-btn');
  let isBgmPlaying = false;
  let isUserExplicitlyMuted = false;

  if (bgmAudio) {
    bgmAudio.volume = 0.9; // 90% volume
  }

  const soundIconImg = document.getElementById('sound-icon-img');

  function updateSoundUI(playing) {
    if (!bgmToggleBtn) return;
    if (soundIconImg) {
      if (playing) {
        soundIconImg.src = 'svg/sound%20on%20icon_1.svg?v=99';
        soundIconImg.alt = 'Sound On';
        bgmToggleBtn.setAttribute('aria-label', 'Sound On (Click to turn off)');
      } else {
        soundIconImg.src = 'svg/sound%20off%20icon_2.svg?v=99';
        soundIconImg.alt = 'Sound Off';
        bgmToggleBtn.setAttribute('aria-label', 'Sound Off (Click to turn on)');
      }
    }
  }

  function playBGM() {
    if (!bgmAudio || isUserExplicitlyMuted) return;
    bgmAudio.volume = 0.9;
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
    if (hoverSfx) {
      hoverSfx.pause();
      hoverSfx.currentTime = 0;
    }
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
  // Cicada FAB Hover SFX Interaction (Volume: 100%, Hover Only)
  // -------------------------------------------------------
  const hoverSfx = document.getElementById('hover-sfx');

  if (cicadaFab && hoverSfx) {
    hoverSfx.volume = 1.0; // 100% volume

    const startHoverSfx = () => {
      // Only play SFX if sound is ON and not muted by user
      if (isUserExplicitlyMuted || !isBgmPlaying) return;
      try {
        hoverSfx.currentTime = 0;
        hoverSfx.loop = true;
        hoverSfx.play().catch(() => {});
      } catch (err) {}
    };

    const stopHoverSfx = () => {
      try {
        hoverSfx.pause();
        hoverSfx.currentTime = 0;
      } catch (err) {}
    };

    cicadaFab.addEventListener('mouseenter', startHoverSfx);
    cicadaFab.addEventListener('mouseleave', stopHoverSfx);
    cicadaFab.addEventListener('touchstart', startHoverSfx, { passive: true });
    cicadaFab.addEventListener('touchend', stopHoverSfx, { passive: true });
    cicadaFab.addEventListener('touchcancel', stopHoverSfx, { passive: true });
  }
});
