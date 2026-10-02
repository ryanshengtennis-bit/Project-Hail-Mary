const year = document.querySelector('#year');
year.textContent = new Date().getFullYear();

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
