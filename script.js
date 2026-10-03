const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

const starfield = document.querySelector('.starfield');
const starColors = ['#ffffff', '#d9e5ff', '#c8bfff', '#ffe4a3'];
const stars = document.createDocumentFragment();

for (let index = 0; index < 280; index += 1) {
  const star = document.createElement('span');
  const size = 0.6 + Math.pow(Math.random(), 3) * 2.4;

  star.className = 'space-star';
  star.style.left = `${Math.random() * 100}%`;
  star.style.top = `${Math.random() * 100}%`;
  star.style.setProperty('--star-size', `${size.toFixed(2)}px`);
  star.style.setProperty('--star-opacity', (0.3 + Math.random() * 0.7).toFixed(2));
  star.style.setProperty('--star-color', starColors[Math.floor(Math.random() * starColors.length)]);
  star.style.setProperty('--twinkle-speed', `${(2.5 + Math.random() * 5).toFixed(2)}s`);
  star.style.setProperty('--twinkle-delay', `${(-Math.random() * 7).toFixed(2)}s`);
  stars.appendChild(star);
}

starfield.appendChild(stars);

const crownMark = document.querySelector('.brand-mark');
let crownClicks = 0;
let crownClickTimer;
let meteorShowerActive = false;

function launchMeteorShower() {
  if (meteorShowerActive) return;

  meteorShowerActive = true;
  const shower = document.createElement('div');
  const meteorCount = window.innerWidth < 680 ? 24 : 38;

  shower.className = 'meteor-shower';
  shower.setAttribute('aria-hidden', 'true');

  for (let index = 0; index < meteorCount; index += 1) {
    const meteor = document.createElement('span');
    const isGolden = Math.random() > 0.62;

    meteor.className = `meteor${isGolden ? ' meteor-gold' : ''}`;
    meteor.style.left = `${20 + Math.random() * 115}vw`;
    meteor.style.top = `${-30 + Math.random() * 42}vh`;
    meteor.style.setProperty('--meteor-delay', `${(Math.random() * 1.8).toFixed(2)}s`);
    meteor.style.setProperty('--meteor-duration', `${(1.05 + Math.random() * 1.1).toFixed(2)}s`);
    meteor.style.setProperty('--meteor-length', `${(70 + Math.random() * 150).toFixed(0)}px`);
    meteor.style.setProperty('--meteor-scale', (0.65 + Math.random() * 0.75).toFixed(2));
    shower.appendChild(meteor);
  }

  document.body.appendChild(shower);
  crownMark.classList.add('meteor-triggered');

  window.setTimeout(() => {
    shower.remove();
    crownMark.classList.remove('meteor-triggered');
    meteorShowerActive = false;
  }, 4300);
}

crownMark.addEventListener('click', () => {
  crownClicks += 1;
  crownMark.classList.remove('secret-tap');
  void crownMark.offsetWidth;
  crownMark.classList.add('secret-tap');

  window.clearTimeout(crownClickTimer);
  crownClickTimer = window.setTimeout(() => {
    crownClicks = 0;
  }, 2600);

  if (crownClicks >= 5) {
    crownClicks = 0;
    window.clearTimeout(crownClickTimer);
    launchMeteorShower();
  }
});

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
