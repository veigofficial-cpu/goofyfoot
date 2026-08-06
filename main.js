/**
 * Goofy Foot® — Pine Wood Room Spray Interactive Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  // -------------------------------------------------------------
  // 1. Web Audio API Setup (iOS Safari Compatible Rules)
  // -------------------------------------------------------------
  let audioCtx = null;

  function initAudio() {
    if (audioCtx) {
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      return;
    }
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
        if (audioCtx.state === 'suspended') {
          audioCtx.resume();
        }
      }
    } catch (e) {
      console.log('AudioContext not supported:', e);
    }
  }

  // Synthesize Pine Wood Spray Sound Effect
  function playSpraySound() {
    initAudio();
    if (!audioCtx) return;

    try {
      const bufferSize = audioCtx.sampleRate * 0.45;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);

      // Synthesize noise envelope simulating room spray mist release
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.22));
      }

      const noise = audioCtx.createBufferSource();
      noise.buffer = buffer;

      const filter = audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1600;
      filter.Q.value = 2.5;

      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.35, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.005, audioCtx.currentTime + 0.4);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);

      noise.start();
    } catch (e) {
      console.log('Audio spray error:', e);
    }
  }

  document.addEventListener('click', initAudio, { once: true });
  document.addEventListener('touchstart', initAudio, { passive: true, once: true });

  // -------------------------------------------------------------
  // 2. Mist Particle Canvas
  // -------------------------------------------------------------
  const canvas = document.getElementById('mist-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let particles = [];
    let particleCount = window.innerWidth < 768 ? 30 : 60;

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particleCount = window.innerWidth < 768 ? 30 : 60;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    class MistParticle {
      constructor(x, y) {
        this.x = x || Math.random() * canvas.width;
        this.y = y || Math.random() * canvas.height;
        this.radius = Math.random() * 2 + 0.5;
        this.vx = (Math.random() - 0.5) * 0.25;
        this.vy = -Math.random() * 0.35 - 0.1;
        this.alpha = Math.random() * 0.3 + 0.05;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.y < 0) {
          this.y = canvas.height;
          this.x = Math.random() * canvas.width;
        }
        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
      }

      draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#222222';
        ctx.fill();
        ctx.restore();
      }
    }

    function initParticles() {
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push(new MistParticle());
      }
    }
    initParticles();

    function renderMist() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.update();
        p.draw();
      });
      requestAnimationFrame(renderMist);
    }
    renderMist();

    // Trigger Spray Burst on Click
    window.triggerSprayBurst = function (originX, originY) {
      const x = originX || canvas.width / 2;
      const y = originY || canvas.height / 2;

      for (let i = 0; i < 40; i++) {
        const p = new MistParticle(x, y);
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4 + 1;
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed;
        p.alpha = 0.6;
        p.radius = Math.random() * 3 + 1;
        particles.push(p);
      }

      // Limit array size
      if (particles.length > 120) {
        particles.splice(0, particles.length - 120);
      }
    };
  }

  // -------------------------------------------------------------
  // 3. Action Interaction Spray Button
  // -------------------------------------------------------------
  const btnSpray = document.getElementById('btn-spray');
  if (btnSpray) {
    btnSpray.addEventListener('click', (e) => {
      playSpraySound();

      const rect = btnSpray.getBoundingClientRect();
      const clickX = rect.left + rect.width / 2;
      const clickY = rect.top + rect.height / 2;

      if (window.triggerSprayBurst) {
        window.triggerSprayBurst(clickX, clickY);
      }

      showToast('GOOFY FOOT® PINE WOOD SPRAY Released');
    });
  }

  // Toast Notice Function
  function showToast(message) {
    let toast = document.getElementById('toast-notice');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast-notice';
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }
});
