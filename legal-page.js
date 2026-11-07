const nav = document.getElementById('nav');
const navToggle = document.getElementById('navToggle');
const navMobilePanel = document.getElementById('navMobilePanel');

const trackConversion = (name, detail = {}) => {
  if (!name) return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: 'cyberpro_conversion',
    conversion_name: name,
    ...detail
  });
};

document.querySelectorAll('[data-conversion]').forEach((element) => {
  element.addEventListener('click', () => {
    trackConversion(element.dataset.conversion, {
      conversion_text: element.textContent.trim(),
      conversion_url: element.getAttribute('href') || ''
    });
  });
});

const updateChrome = () => {
  if (nav) nav.classList.toggle('scrolled', window.scrollY > 24);
};

updateChrome();
window.addEventListener('scroll', updateChrome, { passive: true });
window.addEventListener('resize', updateChrome);

if (navToggle && navMobilePanel) {
  navToggle.addEventListener('click', () => navMobilePanel.classList.toggle('open'));
  navMobilePanel.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => navMobilePanel.classList.remove('open'));
  });
}

const cursorLight = document.querySelector('.cursor-light');
if (cursorLight && window.matchMedia('(hover:hover)').matches) {
  let x = window.innerWidth / 2;
  let y = window.innerHeight / 2;
  let tx = x;
  let ty = y;
  window.addEventListener('pointermove', (event) => {
    tx = event.clientX;
    ty = event.clientY;
  }, { passive: true });
  const moveCursor = () => {
    x += (tx - x) * 0.12;
    y += (ty - y) * 0.12;
    cursorLight.style.transform = `translate(${x - 180}px, ${y - 180}px)`;
    requestAnimationFrame(moveCursor);
  };
  moveCursor();
}

document.querySelectorAll('.ccce-page .btn').forEach((button) => {
  button.addEventListener('pointermove', (event) => {
    if (!window.matchMedia('(hover:hover)').matches) return;
    const rect = button.getBoundingClientRect();
    const mx = (event.clientX - rect.left - rect.width / 2) * 0.18;
    const my = (event.clientY - rect.top - rect.height / 2) * 0.24;
    button.style.transform = `translate(${mx}px, ${my}px)`;
  });
  button.addEventListener('pointerleave', () => {
    button.style.transform = '';
  });
});

const counterObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const target = entry.target;
    const end = Number(target.dataset.count || 0);
    if (!end) return;
    const suffix = target.textContent.includes('+') ? '+' : '';
    const start = performance.now();
    const duration = 950;
    const tick = (now) => {
      const progressValue = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progressValue, 3);
      target.textContent = `${Math.round(end * eased)}${suffix}`;
      if (progressValue < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    observer.unobserve(target);
  });
}, { threshold: 0.55 });

document.querySelectorAll('[data-count]').forEach((counter) => counterObserver.observe(counter));

const phaseNodes = document.querySelectorAll('.phase-node');
if (phaseNodes.length) {
  const phaseObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      phaseNodes.forEach((node) => node.classList.remove('is-active'));
      entry.target.classList.add('is-active');
    });
  }, { threshold: 0.45, rootMargin: '-15% 0px -35% 0px' });
  phaseNodes.forEach((node) => phaseObserver.observe(node));
}

const registerModal = document.getElementById('ccceRegisterModal');
const registerForm = document.getElementById('ccceRegisterForm');
const registerNote = document.getElementById('ccceRegisterNote');
if (registerModal && registerForm) {
  const openRegister = () => {
    registerModal.classList.add('is-open');
    registerModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    const firstInput = registerForm.querySelector('input');
    if (firstInput) setTimeout(() => firstInput.focus(), 80);
  };
  const closeRegister = () => {
    registerModal.classList.remove('is-open');
    registerModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  document.querySelectorAll('.ccce-open-register').forEach((trigger) => {
    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      openRegister();
    });
  });

  registerModal.querySelectorAll('[data-close-register]').forEach((control) => {
    control.addEventListener('click', closeRegister);
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && registerModal.classList.contains('is-open')) closeRegister();
  });

  const setRegisterState = (message, isError = false) => {
    if (!registerNote) return;
    registerNote.textContent = message;
    registerNote.style.color = isError ? '#fecaca' : '#c7f9d4';
  };

  registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(registerForm);
    const submitButton = registerForm.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Sending...';
    }
    setRegisterState('Sending your CCCE request...');
    trackConversion('ccce-registration-submit', {
      program: 'CCCE'
    });
    const payload = Object.fromEntries(data.entries());
    payload.source = 'ccce-registration';
    payload.interest = 'Cydenium Certified Cybersecurity Expert';
    payload.page = window.location.href;
    try {
      const response = await fetch('/api/submit-lead.php', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) {
        throw new Error(result.message || 'Could not send this request.');
      }
      setRegisterState('Request received. Taking you to the next step...');
      registerForm.reset();
      setTimeout(() => {
        window.location.href = 'https://whatsapp.com/channel/0029VbEBQmnDZ4LY3ot9dp2x';
      }, 500);
    } catch (error) {
      setRegisterState(error.message || 'Could not send this request. Please try again.', true);
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Submit request';
      }
    }
  });
}


  /* Live IST Clock */
  function startLiveISTClock() {
    var els = document.querySelectorAll('#footer-clock, .ist-clock');
    if (!els || els.length === 0) return;

    function renderTime() {
      var timeStr = '';
      try {
        var now = new Date();
        var formatter = new Intl.DateTimeFormat('en-GB', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        });
        timeStr = formatter.format(now);
      } catch (err) {
        var d = new Date();
        var utc = d.getTime() + (d.getTimezoneOffset() * 60000);
        var ist = new Date(utc + (3600000 * 5.5));
        var pad = function(n) { return (n < 10 ? '0' : '') + n; };
        timeStr = pad(ist.getHours()) + ':' + pad(ist.getMinutes()) + ':' + pad(ist.getSeconds());
      }

      els.forEach(function(el) {
        el.innerHTML = 'IST &rarr; ' + timeStr;
      });
    }

    renderTime();
    setInterval(renderTime, 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startLiveISTClock);
  } else {
    startLiveISTClock();
  }


// CyberPro Community Modal functions
function openCommunityModal(e) {
  if (e && e.preventDefault) e.preventDefault();
  var modal = document.getElementById('cyberpro-community-modal');
  if (!modal) return;
  modal.style.display = 'flex';
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  setTimeout(function() {
    modal.classList.remove('opacity-0');
  }, 10);
}

function closeCommunityModal() {
  var modal = document.getElementById('cyberpro-community-modal');
  if (!modal) return;
  modal.classList.add('opacity-0');
  setTimeout(function() {
    modal.style.display = 'none';
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }, 300);
}

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeCommunityModal();
});

document.addEventListener('click', function(e) {
  var modal = document.getElementById('cyberpro-community-modal');
  if (modal && e.target === modal) closeCommunityModal();
});
