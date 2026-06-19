/* ============================================================
   script.js — Malshi & Sadeep · Premium Wedding Invitation
   Envelope open sequence · Petals · Countdown · Music · RSVP
   ============================================================ */

'use strict';

/* ─────────────────────────────────────────────────────────────
   STATE
───────────────────────────────────────────────────────────── */
const state = {
  envelopeOpened: false,
  musicPlaying:   false,
};

/* ─────────────────────────────────────────────────────────────
   PETAL SYSTEM
   Canvas-based, triggered by envelope open. Low count (18)
   for elegance. Fades out automatically after 6 seconds.
───────────────────────────────────────────────────────────── */
const PetalSystem = (() => {
  const canvas = document.getElementById('petal-canvas');
  const ctx    = canvas && canvas.getContext('2d');
  let   petals = [];
  let   animId = null;
  let   W = 0, H = 0;
  let   frame = 0;
  let   stopAt = null;   // timestamp after which petals should stop spawning

  const COLORS = [
    'rgba(232,220,203,0.85)',   // secondary
    'rgba(198,167,105,0.55)',   // accent
    'rgba(248,245,240,0.80)',   // bg
    'rgba(220,201,154,0.70)',   // accent-light
    'rgba(255,230,220,0.65)',   // soft blush
  ];

  function resize() {
    if (!canvas) return;
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function makePetal(fromTop = true) {
    return {
      x:         Math.random() * W,
      y:         fromTop ? -16 : Math.random() * H,
      size:      4 + Math.random() * 7,
      vy:        0.35 + Math.random() * 0.7,   // fall speed
      vx:        (Math.random() - 0.5) * 0.4,  // drift
      rot:       Math.random() * Math.PI * 2,
      rotV:      (Math.random() - 0.5) * 0.03,
      swing:     0.3 + Math.random() * 0.5,
      swingFreq: 0.006 + Math.random() * 0.01,
      swingOff:  Math.random() * Math.PI * 2,
      color:     COLORS[Math.floor(Math.random() * COLORS.length)],
      alpha:     0.6 + Math.random() * 0.4,
      life:      1,            // 1 = alive, fades toward 0
      dying:     false,
    };
  }

  function initPetals(count) {
    petals = Array.from({ length: count }, () => makePetal(false));
  }

  function tick() {
    if (!canvas) return;
    ctx.clearRect(0, 0, W, H);
    frame++;

    const now = performance.now();
    const stopping = stopAt !== null && now > stopAt;

    petals.forEach(p => {
      if (stopping && !p.dying) p.dying = true;
      if (p.dying) p.life -= 0.008;

      // Motion
      p.x  += p.vx + Math.sin(frame * p.swingFreq + p.swingOff) * p.swing;
      p.y  += p.vy;
      p.rot += p.rotV;

      // Draw petal (ellipse, rotated)
      ctx.save();
      ctx.globalAlpha = p.alpha * Math.max(0, p.life);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size * 0.45, p.size, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Recycle if off-screen and not dying; remove if dead
      if (p.y > H + 20 && !p.dying) {
        Object.assign(p, makePetal(true));
      }
    });

    // Remove dead petals
    petals = petals.filter(p => p.life > 0 || !p.dying);

    if (petals.length === 0 && stopping) {
      cancelAnimationFrame(animId);
      canvas.classList.add('hide');
      return;
    }

    animId = requestAnimationFrame(tick);
  }

  function start(count = 18) {
    if (!canvas) return;
    resize();
    initPetals(count);
    canvas.classList.add('show');
    canvas.classList.remove('hide');
    stopAt = null;
    animId = requestAnimationFrame(tick);
  }

  function stop(delayMs = 3000) {
    stopAt = performance.now() + delayMs;
  }

  window.addEventListener('resize', resize, { passive: true });

  return { start, stop };
})();


/* ─────────────────────────────────────────────────────────────
   ENVELOPE OPEN SEQUENCE
   The letter is concealed behind the opaque envelope front. On open
   the flap swings up, is dropped BEHIND the letter, and the letter
   then lifts up and out of the top — ending in front of the flap,
   above the envelope (so it reads as being pulled out, not through).
   Timeline (approximate):
     0ms    — hint hides, seal fades, flap rotates open
     350ms  — petals start
     900ms  — flap drops behind the letter
     950ms  — letter lifts up and out of the envelope
     1700ms — couple names fade in below
     3300ms — envelope fades out, main content fades in
───────────────────────────────────────────────────────────── */
function openEnvelope() {
  if (state.envelopeOpened) return;
  state.envelopeOpened = true;

  const hint        = document.getElementById('env-hint');
  const flap        = document.getElementById('env-flap');
  const flapWrap    = document.getElementById('env-flap-wrap');
  const seal        = document.getElementById('env-seal');
  const card        = document.getElementById('env-card');
  const envScreen   = document.getElementById('envelope-screen');
  const mainContent = document.getElementById('main-content');
  const namesReveal = document.getElementById('env-names-reveal');

  // 1. Hide hint + seal
  if (hint) hint.classList.add('hide');
  if (seal) seal.classList.add('hide');

  // 2. Open flap — rotate it back like a lid (stays in front while opening)
  if (flap) {
    flap.style.transition = 'transform 0.9s cubic-bezier(0.4, 0, 0.2, 1)';
    flap.style.transform  = 'rotateX(180deg)';
  }

  // 3. Petals
  setTimeout(() => PetalSystem.start(20), 350);

  // 4. Once the flap is open, drop it BEHIND the letter
  setTimeout(() => {
    if (flapWrap) flapWrap.style.zIndex = '1';
  }, 900);

  // 5. Letter lifts up and out of the envelope's top
  setTimeout(() => {
    if (card) {
      card.style.transition = 'transform 1s cubic-bezier(0.2, 0, 0.2, 1)';
      card.style.transform  = 'translateY(-100%)';
    }
  }, 950);

  // 6. Names reveal below the envelope
  setTimeout(() => {
    if (namesReveal) namesReveal.style.opacity = '1';
  }, 1700);

  // 7. Petals start fading
  setTimeout(() => PetalSystem.stop(3000), 4200);

  // 8. Transition to the main page
  setTimeout(() => {
    if (envScreen) envScreen.classList.add('fade-out');
    if (mainContent) {
      mainContent.style.visibility = 'visible';
      mainContent.style.opacity    = '1';
    }

    attemptMusicStart();
    setTimeout(triggerHeroReveal, 400);

    setTimeout(() => {
      if (envScreen) envScreen.style.display = 'none';
    }, 1200);

  }, 3300);
}

// Expose globally (called from HTML onclick)
window.openEnvelope = openEnvelope;


/* ─────────────────────────────────────────────────────────────
   HERO REVEAL
   Manually trigger the hero's reveal class after page shows
───────────────────────────────────────────────────────────── */
function triggerHeroReveal() {
  const heroReveal = document.querySelector('#hero .reveal');
  if (heroReveal) {
    heroReveal.classList.add('visible');
  }
}


/* ─────────────────────────────────────────────────────────────
   SCROLL REVEAL (IntersectionObserver)
───────────────────────────────────────────────────────────── */
(function initScrollReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          observer.unobserve(e.target);
        }
      });
    },
    { threshold: 0.10 }
  );

  // Observe all reveal elements except hero (handled manually)
  document.querySelectorAll('.reveal:not(#hero .reveal)').forEach(el => {
    observer.observe(el);
  });
})();


/* ─────────────────────────────────────────────────────────────
   NAV SCROLL EFFECT
───────────────────────────────────────────────────────────── */
(function initNav() {
  const nav = document.getElementById('site-nav');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 80);
  }, { passive: true });
})();


/* ─────────────────────────────────────────────────────────────
   BACKGROUND MUSIC
   Only starts after user interaction (envelope click)
───────────────────────────────────────────────────────────── */
const audio        = document.getElementById('bg-music');
const musicBtn     = document.getElementById('music-btn');
const iconPlay     = document.getElementById('music-icon-play');
const iconPause    = document.getElementById('music-icon-pause');

function setMusicUI(playing) {
  state.musicPlaying = playing;
  musicBtn.setAttribute('aria-pressed', String(playing));
  musicBtn.title = playing ? 'Pause music' : 'Play music';
  if (iconPlay)  iconPlay.style.display  = playing ? 'none'  : '';
  if (iconPause) iconPause.style.display = playing ? ''      : 'none';
}

function attemptMusicStart() {
  if (!audio || state.musicPlaying) return;
  audio.volume = 0.3;
  audio.play()
    .then(() => setMusicUI(true))
    .catch(() => {
      // Silently fail — user can click the music button manually
    });
}

if (musicBtn) {
  musicBtn.addEventListener('click', () => {
    if (state.musicPlaying) {
      audio.pause();
      setMusicUI(false);
    } else {
      audio.play()
        .then(() => setMusicUI(true))
        .catch(err => console.warn('Music play blocked:', err));
    }
  });
}


/* ─────────────────────────────────────────────────────────────
   COUNTDOWN TIMER
   Target: 5th August. If date has passed, advances to next year.
───────────────────────────────────────────────────────────── */
(function initCountdown() {
  const elDays  = document.getElementById('cd-days');
  const elHours = document.getElementById('cd-hours');
  const elMins  = document.getElementById('cd-mins');
  const elSecs  = document.getElementById('cd-secs');
  const elWrap  = document.getElementById('countdown-timer');
  const elDone  = document.getElementById('cd-passed');
  if (!elDays) return;

  function getWeddingDate() {
    const now    = new Date();
    let target   = new Date(now.getFullYear(), 7, 5, 17, 0, 0);  // Aug = month 7, 5pm ceremony
    if (now >= target) target = new Date(now.getFullYear() + 1, 7, 5, 17, 0, 0);
    return target;
  }

  function pad(n) { return String(n).padStart(2, '0'); }

  function tick() {
    const diff = getWeddingDate() - new Date();
    if (diff <= 0) {
      elWrap.classList.add('hidden');
      elDone.classList.remove('hidden');
      return;
    }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000)  / 60000);
    const s = Math.floor((diff % 60000)    / 1000);

    elDays.textContent  = pad(d);
    elHours.textContent = pad(h);
    elMins.textContent  = pad(m);
    elSecs.textContent  = pad(s);
  }

  tick();
  setInterval(tick, 1000);
})();


/* ─────────────────────────────────────────────────────────────
   RSVP FORM
───────────────────────────────────────────────────────────── */
(function initRsvpForm() {
  const form       = document.getElementById('rsvp-form');
  const successEl  = document.getElementById('rsvp-success');
  const errEl      = document.getElementById('rsvp-error');
  const btnText    = document.getElementById('rsvp-btn-text');
  const submitBtn  = document.getElementById('rsvp-submit');
  const attYes     = document.getElementById('att-yes');
  const attNo      = document.getElementById('att-no');
  if (!form) return;

  function showErr(msg) {
    errEl.textContent = msg;
    errEl.classList.remove('hidden');
  }
  function clearErr() {
    errEl.textContent = '';
    errEl.classList.add('hidden');
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErr();

    const name      = form.querySelector('#rsvp-name').value.trim();
    const attending = form.querySelector('input[name="attending"]:checked');
    const message   = form.querySelector('#rsvp-message').value.trim();

    if (!name) {
      showErr('Please enter your full name.');
      form.querySelector('#rsvp-name').focus();
      return;
    }
    if (!attending) {
      showErr('Please indicate whether you will attend.');
      return;
    }

    submitBtn.disabled  = true;
    btnText.textContent = 'Sending…';

    try {
      const res = await fetch('/api/rsvp', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          name,
          attending: attending.value === 'yes',
          message,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        form.style.display = 'none';
        successEl.classList.add('show');
        successEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        showErr(data.error || 'Something went wrong. Please try again.');
        submitBtn.disabled  = false;
        btnText.textContent = 'Send RSVP';
      }
    } catch {
      showErr('Network error. Please check your connection and try again.');
      submitBtn.disabled  = false;
      btnText.textContent = 'Send RSVP';
    }
  });
})();
