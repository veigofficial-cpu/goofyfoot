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

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resizeCanvas();
      hasStarted = false;
      if (hint) hint.classList.remove('hidden');
    }, 200);
  });

  // 1분 비활성 후 흰색으로 부드럽게 복원
  function resetToWhite() {
    let opacity = 0;
    const fadeStep = 0.02;
    const fadeInterval = 20; // 20ms 간격

    function fade() {
      opacity += fadeStep;
      if (opacity >= 1) {
        opacity = 1;
        fillWhite();
        hasStarted = false;
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
  // 스프레이 브러시: 참고 이미지처럼 중심이 매우 밀도 높고
  // 바깥으로 갈수록 점이 흩어지는 에어로졸 스티플 패턴
  // -------------------------------------------------------
  function sprayAt(x, y) {
    const rect = canvas.getBoundingClientRect();
    const cx = x - rect.left;
    const cy = y - rect.top;

    ctx.globalCompositeOperation = 'destination-out';

    const sprayRadius = window.innerWidth < 768 ? 112 : 160;

    // --- Layer 1: 중심부 솔리드 코어 (완전 불투명하게 지움) ---
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.arc(cx, cy, sprayRadius * 0.15, 0, Math.PI * 2);
    ctx.fill();

    // --- Layer 2: 중심 근처 고밀도 영역 (반경 0~30%) ---
    const innerDensity = 300;
    for (let i = 0; i < innerDensity; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * sprayRadius * 0.3;
      const px = cx + Math.cos(angle) * dist;
      const py = cy + Math.sin(angle) * dist;
      const r = Math.random() * 0.5 + 0.2;
      ctx.globalAlpha = 0.6 + Math.random() * 0.3;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // --- Layer 3: 중간 영역 (반경 20~60%) ---
    const midDensity = 400;
    for (let i = 0; i < midDensity; i++) {
      const angle = Math.random() * Math.PI * 2;
      // 가우시안으로 중간 영역에 분포
      const u1 = Math.random();
      const u2 = Math.random();
      const g = Math.abs(Math.sqrt(-2 * Math.log(u1 || 0.001)) * Math.cos(2 * Math.PI * u2));
      const dist = g * sprayRadius * 0.28 + sprayRadius * 0.05;
      const px = cx + Math.cos(angle) * dist;
      const py = cy + Math.sin(angle) * dist;
      const r = Math.random() * 0.5 + 0.2;
      const distRatio = dist / sprayRadius;
      ctx.globalAlpha = Math.max(0.08, 0.55 * (1 - distRatio));
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // --- Layer 4: 외곽 흩뿌림 영역 (반경 40~100%) ---
    const outerDensity = 250;
    for (let i = 0; i < outerDensity; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = sprayRadius * 0.4 + Math.random() * sprayRadius * 0.6;
      const px = cx + Math.cos(angle) * dist;
      const py = cy + Math.sin(angle) * dist;
      const r = Math.random() * 0.4 + 0.2;
      const distRatio = dist / sprayRadius;
      ctx.globalAlpha = Math.max(0.02, 0.25 * Math.pow(1 - distRatio, 2));
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // --- Layer 5: 최외곽 미세 먼지 (반경 70~120%) ---
    const dustDensity = 80;
    for (let i = 0; i < dustDensity; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = sprayRadius * 0.7 + Math.random() * sprayRadius * 0.5;
      const px = cx + Math.cos(angle) * dist;
      const py = cy + Math.sin(angle) * dist;
      const r = Math.random() * 0.3 + 0.15;
      ctx.globalAlpha = Math.random() * 0.08 + 0.01;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }

  // -------------------------------------------------------
  // 이벤트 핸들러
  // -------------------------------------------------------
  function onSprayStart(x, y) {
    isDrawing = true;

    if (!hasStarted) {
      hasStarted = true;
      playSpraySound();
      if (hint) hint.classList.add('hidden');
    }

    sprayAt(x, y);
    resetInactivityTimer();
  }

  function onSprayMove(x, y) {
    if (!isDrawing) return;
    sprayAt(x, y);
    resetInactivityTimer();
  }

  function onSprayEnd() {
    isDrawing = false;
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
