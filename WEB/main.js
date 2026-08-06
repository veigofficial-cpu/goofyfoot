/* ==========================================================================
   The Portfolio Shift — Presentation Logic & Particles Engine
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------------------------------------
    // 1. Particle Canvas Engine (White & Gold Floating Particles)
    // ----------------------------------------------------------------------
    const canvas = document.getElementById('particle-canvas');
    const ctx = canvas.getContext('2d');

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });

    const particles = [];
    const particleCount = Math.min(Math.floor(window.innerWidth / 15), 100);

    class Particle {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * 0.4;
            this.vy = -Math.random() * 0.8 - 0.2; // Float upwards (Anti-gravity effect)
            this.radius = Math.random() * 2 + 0.8;
            this.alpha = Math.random() * 0.6 + 0.2;
            this.color = Math.random() > 0.85 ? '#FFD600' : '#FFFFFF';
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;

            // Wrap around edges
            if (this.y < -10) this.y = height + 10;
            if (this.x < -10) this.x = width + 10;
            if (this.x > width + 10) this.x = -10;
        }

        draw() {
            ctx.save();
            ctx.globalAlpha = this.alpha;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }

    function animateParticles() {
        ctx.clearRect(0, 0, width, height);
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        requestAnimationFrame(animateParticles);
    }
    animateParticles();

    // ----------------------------------------------------------------------
    // 2. Sound Effects Engine (Web Audio API Synthesizer)
    // ----------------------------------------------------------------------
    let soundEnabled = true;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    let audioCtx = null;

    function initAudio() {
        if (!audioCtx) {
            audioCtx = new AudioContext();
        }
    }

    function playTone(freq, duration = 0.1, type = 'sine') {
        if (!soundEnabled) return;
        try {
            initAudio();
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + duration);
        } catch (e) {
            // Audio context failed or muted by browser policy
        }
    }

    // ----------------------------------------------------------------------
    // 3. Scroll Snap Slide Manager & Navigation
    // ----------------------------------------------------------------------
    const presentation = document.getElementById('presentation');
    const slides = Array.from(document.querySelectorAll('.slide'));
    const totalSlides = slides.length;

    const currentSlideEl = document.getElementById('current-slide');
    const totalSlidesEl = document.getElementById('total-slides');
    const progressBar = document.getElementById('progress-bar');
    const dots = Array.from(document.querySelectorAll('.dot'));

    totalSlidesEl.textContent = String(totalSlides).padStart(2, '0');

    let currentIndex = 0;

    function scrollToSlide(index) {
        if (index < 0) index = 0;
        if (index >= totalSlides) index = totalSlides - 1;

        slides[index].scrollIntoView({ behavior: 'smooth' });
    }
    window.scrollToSlide = (num) => scrollToSlide(num - 1);

    function updateActiveSlide(index) {
        if (currentIndex === index) return;
        currentIndex = index;

        // Sound feedback
        playTone(300 + index * 40, 0.12, 'sine');

        // Update Counter
        currentSlideEl.textContent = String(index + 1).padStart(2, '0');

        // Update Progress Bar
        const progressPercent = ((index + 1) / totalSlides) * 100;
        progressBar.style.width = `${progressPercent}%`;

        // Update Active Slide Classes
        slides.forEach((slide, i) => {
            if (i === index) {
                slide.classList.add('active');
            } else {
                slide.classList.remove('active');
            }
        });

        // Update Dot Nav
        dots.forEach((dot, i) => {
            if (i === index) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }

    // IntersectionObserver to detect currently visible slide
    const observerOptions = {
        root: presentation,
        threshold: 0.5
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const slideNum = parseInt(entry.target.getAttribute('data-slide')) - 1;
                updateActiveSlide(slideNum);
            }
        });
    }, observerOptions);

    slides.forEach(slide => observer.observe(slide));

    // Dot Navigation Click Event
    dots.forEach((dot) => {
        dot.addEventListener('click', () => {
            const slideNum = parseInt(dot.getAttribute('data-goto'));
            scrollToSlide(slideNum - 1);
        });
    });

    // Restart Button Event
    const btnRestart = document.getElementById('btn-restart');
    if (btnRestart) {
        btnRestart.addEventListener('click', () => {
            scrollToSlide(0);
        });
    }

    // ----------------------------------------------------------------------
    // 4. Keyboard Navigation Controls
    // ----------------------------------------------------------------------
    window.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
            e.preventDefault();
            scrollToSlide(currentIndex + 1);
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'PageUp') {
            e.preventDefault();
            scrollToSlide(currentIndex - 1);
        } else if (e.key === 'f' || e.key === 'F') {
            toggleFullscreen();
        } else if (e.key === 'm' || e.key === 'M') {
            toggleSound();
        }
    });

    // Fullscreen Toggle Button
    const btnFullscreen = document.getElementById('btn-fullscreen');
    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }
    btnFullscreen.addEventListener('click', toggleFullscreen);

    // Sound Toggle Button
    const btnSound = document.getElementById('btn-sound');
    function toggleSound() {
        soundEnabled = !soundEnabled;
        btnSound.style.opacity = soundEnabled ? '1' : '0.4';
        if (soundEnabled) playTone(523.25, 0.15, 'triangle');
    }
    btnSound.addEventListener('click', toggleSound);

    // Initial activation
    updateActiveSlide(0);
});
