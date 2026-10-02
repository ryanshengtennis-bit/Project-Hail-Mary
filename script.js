const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach((element, index) => {
  element.style.transitionDelay = `${Math.min(index % 4, 3) * 70}ms`;
  observer.observe(element);
});

document.querySelectorAll('.interest-card').forEach((card) => {
  card.addEventListener('click', () => {
    const toggle = card.querySelector('.card-toggle');
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    const description = document.querySelector(`#${toggle.getAttribute('aria-controls')}`);

    toggle.setAttribute('aria-expanded', String(!isOpen));
    description.classList.toggle('is-open', !isOpen);
  });
});

const themeToggle = document.querySelector('.theme-toggle');
const themeLabel = themeToggle.querySelector('.theme-label');
const themeIcon = themeToggle.querySelector('.theme-icon');
const savedTheme = localStorage.getItem('ryan-theme');

function setTheme(theme) {
  const isDark = theme === 'dark';
  document.documentElement.dataset.theme = theme;
  themeToggle.setAttribute('aria-pressed', String(isDark));
  themeLabel.textContent = isDark ? 'Light mode' : 'Dark mode';
  themeIcon.textContent = isDark ? '☀' : '☾';
  localStorage.setItem('ryan-theme', theme);
}

if (savedTheme === 'dark') {
  setTheme('dark');
}

themeToggle.addEventListener('click', () => {
  if (themeToggle.dataset.animating === 'true') return;

  const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduceMotion) {
    setTheme(nextTheme);
    return;
  }

  themeToggle.dataset.animating = 'true';
  const bounds = themeToggle.getBoundingClientRect();
  const originX = bounds.left + bounds.width / 2;
  const originY = bounds.top + bounds.height / 2;
  const radius = Math.hypot(
    Math.max(originX, window.innerWidth - originX),
    Math.max(originY, window.innerHeight - originY)
  );
  const ripple = document.createElement('span');

  ripple.className = 'theme-ripple';
  ripple.style.left = `${originX}px`;
  ripple.style.top = `${originY}px`;
  ripple.style.width = `${radius * 2.35}px`;
  ripple.style.height = `${radius * 2.35}px`;
  document.body.appendChild(ripple);

  window.setTimeout(() => setTheme(nextTheme), 650);
  window.setTimeout(() => ripple.classList.add('is-fading'), 790);
  window.setTimeout(() => {
    ripple.remove();
    delete themeToggle.dataset.animating;
  }, 1120);
});
