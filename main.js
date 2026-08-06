/**
 * Goofy Foot — Luxury Room Fragrance Website Logic
 * Handles: Web Audio API, Canvas Mist Animation, Touch Events, Interactive Filter
 */

document.addEventListener('DOMContentLoaded', () => {
  // -------------------------------------------------------------
  // 1. AudioContext setup (iOS Safari Compatible Rules)
  // -------------------------------------------------------------
  let audioCtx = null;
  let isAudioPlaying = false;
  let ambientGainNode = null;
  let noiseNode = null;

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
      console.log('AudioContext not supported or restricted:', e);
    }
  }

  // Synthesize Ambient Space Mist Sound using Web Audio API
  function toggleAmbientSound() {
    initAudio();
    if (!audioCtx) return;

    const btnAudio = document.getElementById('btn-audio');
    const audioLabel = document.getElementById('audio-label');

    if (!isAudioPlaying) {
      // Create White Noise Buffer for Space Mist Atmosphere
      const bufferSize = 2 * audioCtx.sampleRate;
      const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      noiseNode = audioCtx.createBufferSource();
      noiseNode.buffer = noiseBuffer;
      noiseNode.loop = true;

      // Lowpass Filter for soft deep ambient sound
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, audioCtx.currentTime);

      ambientGainNode = audioCtx.createGain();
      ambientGainNode.gain.setValueAtTime(0.01, audioCtx.currentTime);
      ambientGainNode.gain.exponentialRampToValueAtTime(0.12, audioCtx.currentTime + 2);

      noiseNode.connect(filter);
      filter.connect(ambientGainNode);
      ambientGainNode.connect(audioCtx.destination);

      noiseNode.start();
      isAudioPlaying = true;

      if (btnAudio) btnAudio.classList.add('active');
      if (audioLabel) audioLabel.textContent = 'AMBIENT ON';
    } else {
      if (ambientGainNode && audioCtx) {
        ambientGainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
        setTimeout(() => {
          if (noiseNode) {
            noiseNode.stop();
            noiseNode.disconnect();
          }
          isAudioPlaying = false;
        }, 800);
      }
      if (btnAudio) btnAudio.classList.remove('active');
      if (audioLabel) audioLabel.textContent = 'AMBIENT SOUND';
    }
  }

  // Play Fragrance Mist Burst Sound Effect
  function triggerMistSpraySound() {
    initAudio();
    if (!audioCtx) return;

    try {
      const bufferSize = audioCtx.sampleRate * 0.4;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
      }

      const noise = audioCtx.createBufferSource();
      noise.buffer = buffer;

      const filter = audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1800;
      filter.Q.value = 3.0;

      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);

      noise.start();
    } catch (e) {
      console.log('Spray sound error:', e);
    }
  }

  // Attach global user interaction listeners to resume AudioContext (iOS Safari requirement)
  document.addEventListener('click', initAudio, { once: true });
  document.addEventListener('touchstart', initAudio, { passive: true, once: true });

  const btnAudio = document.getElementById('btn-audio');
  if (btnAudio) {
    btnAudio.addEventListener('click', toggleAmbientSound);
  }

  // -------------------------------------------------------------
  // 2. Interactive Mist Particle Canvas (Mouse & Touch Responsive)
  // -------------------------------------------------------------
  const canvas = document.getElementById('mist-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let particles = [];
    let particleCount = window.innerWidth < 768 ? 35 : 75; // Adjust particle count for mobile

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particleCount = window.innerWidth < 768 ? 35 : 75;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    class Particle {
      constructor(x, y) {
        this.x = x || Math.random() * canvas.width;
        this.y = y || Math.random() * canvas.height;
        this.radius = Math.random() * 2.5 + 0.5;
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = -Math.random() * 0.4 - 0.1;
        this.alpha = Math.random() * 0.4 + 0.1;
        this.maxAlpha = this.alpha;
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
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.restore();
      }
    }

    function initParticles() {
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
    }
    initParticles();

    function animateMist() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.update();
        p.draw();
      });
      requestAnimationFrame(animateMist);
    }
    animateMist();

    // Spawn Burst of Particles on Touch / Mouse Movements
    function createBurst(x, y) {
      for (let i = 0; i < 5; i++) {
        const p = new Particle(x, y);
        p.vx = (Math.random() - 0.5) * 2;
        p.vy = (Math.random() - 0.5) * 2;
        p.alpha = 0.8;
        particles.push(p);
        if (particles.length > particleCount + 30) {
          particles.shift();
        }
      }
    }

    window.addEventListener('mousemove', (e) => {
      if (Math.random() < 0.15) {
        createBurst(e.clientX, e.clientY);
      }
    });

    window.addEventListener(
      'touchmove',
      (e) => {
        if (e.touches.length > 0 && Math.random() < 0.25) {
          createBurst(e.touches[0].clientX, e.touches[0].clientY);
        }
      },
      { passive: true }
    );
  }

  // -------------------------------------------------------------
  // 3. Interactive Room Fragrance Spray Test Buttons
  // -------------------------------------------------------------
  const sprayButtons = document.querySelectorAll('.btn-spray-test');
  sprayButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      triggerMistSpraySound();

      const card = btn.closest('.product-card');
      if (card) {
        card.style.transform = 'scale(0.98)';
        setTimeout(() => {
          card.style.transform = '';
        }, 150);
      }

      // Visual Toast Notification
      const scentName = btn.getAttribute('data-scent') || 'GOOFY FOOT';
      showToast(`[${scentName}] Room Spray Mist Released`);
    });
  });

  function showToast(message) {
    let toast = document.getElementById('toast-notice');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast-notice';
      toast.style.cssText = `
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        background: #FFFFFF;
        color: #000000;
        font-family: var(--font-en);
        font-weight: 800;
        font-size: 0.8rem;
        letter-spacing: 0.15em;
        text-transform: uppercase;
        padding: 0.85rem 1.5rem;
        border-radius: 2px;
        z-index: 1000;
        box-shadow: 0 10px 30px rgba(0,0,0,0.9);
        transition: all 0.3s ease;
        opacity: 0;
        transform: translateY(20px);
      `;
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(20px)';
    }, 2500);
  }

  // -------------------------------------------------------------
  // 4. Atmosphere & Mood Selector Filter Tabs
  // -------------------------------------------------------------
  const filterBtns = document.querySelectorAll('.filter-btn');
  const moodData = {
    all: {
      title: 'ALL SPATIAL SCENTS',
      desc: '구피풋의 전 라인업은 공간의 분위기를 순간적으로 전환하도록 독자 조향된 룸 프래그런스 시리즈입니다.',
      top: 'Cedarwood, Bergamot, Ocean Air',
      heart: 'Tobacco Leaf, Crisp Linen, Black Iris',
      base: 'White Musk, Salted Amber, Obsidian Wood'
    },
    chill: {
      title: 'NO. 01 OFF-BEAT (DEEP CHILL)',
      desc: '서재와 거실 공간에 시더우드의 묵직함과 스모키한 타바코 리프가 감싸는 아늑하고 정돈된 분위기를 선사합니다.',
      top: 'Italian Bergamot, Pink Pepper',
      heart: 'Smoky Cedarwood, Tobacco Leaf',
      base: 'Deep Amber, Black Vanilla, Musk'
    },
    focus: {
      title: 'NO. 02 WAVE DRIFT (MORNING FOCUS)',
      desc: '작업실과 아침 침실에 바다의 상쾌한 소금바람과 깨끗하게 건조된 린넨 향이 몰입감 있는 청량함을 더해줍니다.',
      top: 'Sea Salt, Crispy Lemon, Mint',
      heart: 'Sun-dried Linen, White Tea',
      base: 'Driftwood, Clean Amber'
    },
    night: {
      title: 'NO. 03 NOCTURNE SPACE (NIGHT SANCTUARY)',
      desc: '하루를 마무리하는 밤의 침실에 차분한 딥 아이리스와 실키한 머스크 향이 아늑한 정적을 채워줍니다.',
      top: 'Black Pepper, Cardamom',
      heart: 'Midnight Iris, Velvet Plum',
      base: 'Obsidian Musk, Tonka Bean, Sandalwood'
    }
  };

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const filterKey = btn.getAttribute('data-filter') || 'all';
      const info = moodData[filterKey] || moodData['all'];

      const moodTitle = document.getElementById('mood-title');
      const moodDesc = document.getElementById('mood-desc');
      const topNote = document.getElementById('note-top');
      const heartNote = document.getElementById('note-heart');
      const baseNote = document.getElementById('note-base');

      if (moodTitle) moodTitle.textContent = info.title;
      if (moodDesc) moodDesc.textContent = info.desc;
      if (topNote) topNote.textContent = info.top;
      if (heartNote) heartNote.textContent = info.heart;
      if (baseNote) baseNote.textContent = info.base;
    });
  });

  // -------------------------------------------------------------
  // 5. Mobile Drawer Menu Toggle
  // -------------------------------------------------------------
  const mobileToggle = document.getElementById('mobile-toggle');
  const navMenu = document.getElementById('nav-menu');

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('open');
    });

    const navLinks = navMenu.querySelectorAll('.nav-link');
    navLinks.forEach((link) => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
      });
    });
  }

  // -------------------------------------------------------------
  // 6. Header Navbar Scroll Effect
  // -------------------------------------------------------------
  const navbar = document.querySelector('.navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 60) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });
});
