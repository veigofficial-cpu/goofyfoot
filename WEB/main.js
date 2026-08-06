/**
 * Goofy Foot® — Spray Reveal Interaction
 *
 * Section 2: 흰색 캔버스 위를 클릭/드래그하면
 * 가운데가 강하고 바깥으로 갈수록 약한 스프레이 패턴으로
 * 흰색이 지워지며 아래 소나무 이미지가 드러남.
 * 1분 간 액션이 없으면 다시 흰색으로 복원됨.
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
  // Spray Reveal Canvas
  // -------------------------------------------------------
  const canvas = document.getElementById('spray-canvas');
  const container = document.getElementById('spray-container');
  const hint = document.getElementById('spray-hint');

  if (!canvas || !container) return;

  const ctx = canvas.getContext('2d');
  let isDrawing = false;
  let hasStarted = false;
  let inactivityTimer = null;
  const INACTIVITY_TIMEOUT = 60000; // 1분 (60초)

  // 캔버스를 흰색으로 완전히 채움
  function fillWhite() {
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // 캔버스 크기 설정
  function resizeCanvas() {
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    fillWhite();
  }

  resizeCanvas();

  // -------------------------------------------------------
  // 소나무 이미지 랜덤 선택 (tree_1.png / tree_2.png)
  // -------------------------------------------------------
  const revealImage = document.getElementById('reveal-image');
  const treeImages = ['images/tree_1.png', 'images/tree_2.png'];

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
      resizeCanvas();
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
        opacity = 1;
        fillWhite();
        hasStarted = false;
        setRandomTreeImage(); // 리셋 후 새 나무 이미지 랜덤 지정
        if (hint) hint.classList.remove('hidden');
        return;
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = opacity;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 1;
      requestAnimationFrame(fade);
    }
    fade();
  }

  // 비활성 타이머 리셋
  function resetInactivityTimer() {
    if (inactivityTimer) clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(resetToWhite, INACTIVITY_TIMEOUT);
  }

  // -------------------------------------------------------
  // 향수 에어로졸 스티플 미스트: 참고 이미지와 동일하게 중심이 매우 빽빽하고
  // 외곽으로 갈수록 점들이 흩어지는 1초 확산 애니메이션
  // -------------------------------------------------------
  function triggerPerfumeBurst(x, y) {
    const rect = canvas.getBoundingClientRect();
    const cx = x - rect.left;
    const cy = y - rect.top;

    const maxRadius = window.innerWidth < 768 ? 900 : 1300;
    const startTime = performance.now();
    const DURATION = 1000; // 1초 확산

    function animateMist(now) {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / DURATION);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentRadius = maxRadius * (0.2 + 0.8 * easeProgress);

      ctx.globalCompositeOperation = 'destination-out';

      // 프레임 당 350개 점 분사 (참고 이미지 스티플 밀집도 매칭)
      const frameDots = 350;
      for (let i = 0; i < frameDots; i++) {
        const angle = Math.random() * Math.PI * 2;

        // 거듭제곱(pow(u, 2.2)): 중심부 25% 영역에 80% 이상의 입자가 집중됨
        const u = Math.random();
        const dist = Math.pow(u, 2.2) * currentRadius;

        const px = cx + Math.cos(angle) * dist;
        const py = cy + Math.sin(angle) * dist;

        // 입자 크기: 0.15px ~ 0.55px 미세 입자
        const r = Math.random() * 0.4 + 0.15;

        // 중심일수록 높은 불투명도, 외곽으로 갈수록 부드러운 감쇄
        const normDist = dist / currentRadius;
        const alpha = Math.max(0.015, 0.85 * Math.pow(1 - normDist, 1.6));

        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;

      if (progress < 1) {
        requestAnimationFrame(animateMist);
      }
    }

    requestAnimationFrame(animateMist);
  }

  // -------------------------------------------------------
  // 이벤트 핸들러 및 연속 분사 홀드 루프
  // -------------------------------------------------------
  let currentX = 0;
  let currentY = 0;
  let animFrameId = null;
  let lastBurstTime = 0;

  function sprayLoop() {
    if (!isDrawing) return;
    const now = performance.now();
    if (now - lastBurstTime > 150) { // 150ms마다 연속 향수 분사
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

  // 마우스 이벤트
  canvas.addEventListener('mousedown', (e) => {
    onSprayStart(e.clientX, e.clientY);
  });
  canvas.addEventListener('mousemove', (e) => {
    onSprayMove(e.clientX, e.clientY);
  });
  canvas.addEventListener('mouseup', onSprayEnd);
  canvas.addEventListener('mouseleave', onSprayEnd);

  // 터치 이벤트 (모바일 대응)
  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length) {
      onSprayStart(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: true });
  canvas.addEventListener('touchmove', (e) => {
    if (e.touches.length) {
      onSprayMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: true });
  canvas.addEventListener('touchend', onSprayEnd, { passive: true });
});
