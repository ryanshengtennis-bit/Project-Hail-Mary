'use client';

import { useEffect, useRef, useState } from 'react';

const starColors = ['#ffffff', '#d9e5ff', '#c8bfff', '#ffe4a3'];
const solarSystemFacts = [
  'A day on Venus is longer than its year.',
  'Mars is home to Olympus Mons, the tallest volcano in the solar system.',
  'Saturn’s rings are made mostly of ice and bits of rocky material.',
  'Neptune takes about 165 Earth years to orbit the Sun once.',
  'Uranus spins almost on its side as it travels around the Sun.',
  'Mercury completes one trip around the Sun in just 88 Earth days.',
  'The Sun contains about 99.8% of the solar system’s total mass.',
  'Jupiter’s Great Red Spot is a gigantic storm that has raged for centuries.',
  'Venus is the hottest planet, even though Mercury is closer to the Sun.',
  'The Moon is slowly drifting away from Earth by about 3.8 centimetres each year.',
  'Light from the Sun takes about eight minutes to reach Earth.',
  'There are more than 200 known moons orbiting planets in our solar system.',
];

const spaceObjectTypes = ['planet', 'star', 'comet', 'moon', 'asteroid', 'satellite', 'rocket', 'galaxy', 'black-hole', 'supernova'];

const spaceObjectHideSpots = [
  { section: 'hero', side: 'left', top: '5%' },
  { section: 'hero', side: 'right', top: '20%' },
  { section: 'hero', side: 'left', top: '95%' },
  { section: 'hero', side: 'right', top: '80%' },
  { section: 'about', side: 'left', top: '14%' },
  { section: 'about', side: 'right', top: '32%' },
  { section: 'about', side: 'left', top: '68%' },
  { section: 'about', side: 'right', top: '86%' },
  { section: 'interests', side: 'left', top: '9%' },
  { section: 'interests', side: 'right', top: '24%' },
  { section: 'interests', side: 'left', top: '46%' },
  { section: 'interests', side: 'right', top: '63%' },
  { section: 'interests', side: 'left', top: '87%' },
  { section: 'now', side: 'left', top: '12%' },
  { section: 'now', side: 'right', top: '29%' },
  { section: 'now', side: 'left', top: '61%' },
  { section: 'now', side: 'right', top: '83%' },
  { section: 'quote', side: 'left', top: '8%' },
  { section: 'quote', side: 'right', top: '27%' },
  { section: 'quote', side: 'left', top: '69%' },
  { section: 'quote', side: 'right', top: '90%' },
];

function shuffle(items) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function getRandomSpaceObjects(round = 0) {
  const saturnSpot = spaceObjectHideSpots.find((spot) => spot.section === 'about' && spot.side === 'right');
  const targetCount = Math.min(10 + round * 2, spaceObjectHideSpots.length);
  const otherSpots = shuffle(spaceObjectHideSpots.filter((spot) => spot !== saturnSpot)).slice(0, targetCount - 2);
  const objects = shuffle(spaceObjectTypes);
  return [
    { ...saturnSpot, id: 0, type: 'saturn' },
    { section: 'interests', id: 1, type: 'sun' },
    ...otherSpots.map((spot, index) => ({ ...spot, id: index + 2, type: objects[index % objects.length] })),
  ];
}

function Brand({ footer = false, onCrownClick }) {
  return (
    <a className="brand" href="#top" aria-label={footer ? undefined : "Ryan's homepage"}>
      <span className="brand-mark" aria-hidden="true" onClick={onCrownClick}>
        <img src="assets/ryan-crown-logo.jpg?v=2" alt="" />
        <span className="emblem-glint" />
      </span>
      <span>Ryan</span>
    </a>
  );
}

function InterestCard({ number, className, title, subtitle, description, href, extra, children }) {
  const [open, setOpen] = useState(false);
  const descriptionId = `${title.toLowerCase()}-description`;

  return (
    <article className={`interest-card ${className} reveal`} onClick={() => setOpen((value) => !value)}>
      <span className="card-number">{number}</span>
      {children}
      <h3>
        <button className="card-toggle" type="button" aria-expanded={open} aria-controls={descriptionId}>
          <span>{title}</span><span className="card-arrow" aria-hidden="true">⌄</span>
        </button>
      </h3>
      {subtitle && <p className="card-subtitle">{subtitle}</p>}
      <div className={`card-description${open ? ' is-open' : ''}`} id={descriptionId}>
        <div className="card-description-inner">
          <p>{description}</p>
          {extra}
          {href && (
            <a className="card-link" href={href} target="_blank" rel="noopener noreferrer" onClick={(event) => event.stopPropagation()}>
              Visit fencing arena <span aria-hidden="true">↗</span>
            </a>
          )}
        </div>
      </div>
      <span className="card-line" />
    </article>
  );
}

function SpaceObjectIcon({ type }) {
  switch (type) {
    case 'planet':
      return <g><ellipse className="space-object-orbit" cx="32" cy="32" rx="27" ry="10" transform="rotate(-20 32 32)"/><circle className="space-object-planet" cx="32" cy="32" r="16"/><path className="space-object-detail" d="M20 28c6-5 15-5 22-1m-23 9c7 4 14 4 21 1"/></g>;
    case 'black-hole':
      return <g><ellipse className="space-object-black-hole-disk" cx="32" cy="32" rx="25" ry="10" transform="rotate(-22 32 32)"/><ellipse className="space-object-black-hole-hotline" cx="32" cy="32" rx="20" ry="5" transform="rotate(-22 32 32)"/><circle className="space-object-black-hole" cx="32" cy="32" r="13"/><circle className="space-object-black-hole-center" cx="32" cy="32" r="8"/></g>;
    case 'supernova':
      return <g><circle className="space-object-supernova-wave" cx="32" cy="32" r="25"/><path className="space-object-supernova-rays" d="M32 3v12m0 34v12M3 32h12m34 0h12M11.5 11.5 20 20m24 24 8.5 8.5m0-41L44 20m-24 24-8.5 8.5"/><path className="space-object-supernova-burst" d="m32 13 5.2 11.1L49 18l-5 12 12 2-12 5 6 12-13-5-5 12-5-12-12 5 5-12-12-5 12-2-5-12 12 6Z"/><circle className="space-object-supernova-core" cx="32" cy="32" r="6"/></g>;
    case 'saturn':
      return <g><ellipse className="space-object-solar-orbit" cx="32" cy="32" rx="23" ry="11"/><circle className="space-object-sun" cx="32" cy="32" r="6"/><g className="space-object-saturn-revolution"><g transform="translate(22 0)"><circle className="space-object-saturn" cx="32" cy="32" r="5"/><ellipse className="space-object-saturn-ring" cx="32" cy="32" rx="9" ry="3.5" transform="rotate(-20 32 32)"/></g></g></g>;
    case 'star':
      return <g><path className="space-object-star" d="m32 5 7 18 19 1-15 12 5 19-16-11-16 11 5-19L6 24l19-1 7-18Z"/><circle className="space-object-sparkle" cx="32" cy="32" r="5"/></g>;
    case 'comet':
      return <g><path className="space-object-trail" d="M6 48 31 23m-18 32 25-25m-32 9 23-23"/><circle className="space-object-comet" cx="42" cy="20" r="12"/><path className="space-object-detail" d="M37 18q5-6 10-2"/></g>;
    case 'moon':
      return <g><circle className="space-object-moon" cx="32" cy="32" r="23"/><circle className="space-object-shadow" cx="42" cy="20" r="19"/><circle className="space-object-crater" cx="21" cy="29" r="3"/><circle className="space-object-crater" cx="28" cy="43" r="2"/></g>;
    case 'asteroid':
      return <g><path className="space-object-asteroid" d="m10 19 11-11 16 3 14 12-2 17-13 11-18-4L8 35Z"/><circle className="space-object-crater" cx="22" cy="24" r="3"/><circle className="space-object-crater" cx="39" cy="37" r="4"/><path className="space-object-detail" d="m26 42 7-4"/></g>;
    case 'satellite':
      return <g transform="rotate(-24 32 32)"><rect className="space-object-satellite" x="23" y="23" width="18" height="18" rx="4"/><path className="space-object-panel" d="M4 22h15v20H4zm41 0h15v20H45zM32 9v14m0 18v12"/><path className="space-object-detail" d="M8 27h7m-7 6h7m34-6h7m-7 6h7"/></g>;
    case 'rocket':
      return <g transform="rotate(35 32 32)"><path className="space-object-rocket" d="M32 7c10 8 14 18 12 30L32 48 20 37C18 25 22 15 32 7Z"/><circle className="space-object-window" cx="32" cy="25" r="5"/><path className="space-object-fin" d="m20 31-9 4 2 13 13-7m18-10 9 4-2 13-13-7"/><path className="space-object-flame" d="m27 43 5 12 5-12"/></g>;
    default:
      return <g><path className="space-object-galaxy" d="M32 31c-11-13-25-3-17 8 7 9 23 7 28-3 6-12-8-25-22-22-9 2-15 10-15 19"/><circle className="space-object-core" cx="32" cy="32" r="6"/><circle className="space-object-sparkle" cx="49" cy="13" r="2"/></g>;
  }
}

function SpaceObjectLayer({ section, objects, onFind }) {
  const sectionObjects = objects.filter((object) => object.section === section && object.id > 1);
  if (!sectionObjects.length) return null;

  return (
    <div className="space-object-layer">
      {sectionObjects.map((object) => (
        <button
          className={`space-object-button side-${object.side}`}
          key={object.id}
          type="button"
          aria-label={`Click ${object.type.replace('-', ' ')}, object ${object.id + 1} of 10`}
          title={`Click ${object.type.replace('-', ' ')}`}
          style={{ top: object.top }}
          onClick={() => onFind(object.id)}
        >
          <svg viewBox="0 0 64 62" aria-hidden="true">
            <SpaceObjectIcon type={object.type} />
          </svg>
        </button>
      ))}
    </div>
  );
}

export default function Home() {
  const [stars, setStars] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [ripple, setRipple] = useState(null);
  const [meteors, setMeteors] = useState([]);
  const [spaceObjects, setSpaceObjects] = useState([]);
  const [foundObjectCount, setFoundObjectCount] = useState(0);
  const [solarSystemFact, setSolarSystemFact] = useState('');
  const [huntRound, setHuntRound] = useState(0);
  const [huntComplete, setHuntComplete] = useState(false);
  const huntTargetCount = Math.min(10 + huntRound * 2, spaceObjectHideSpots.length);
  const foundObjectIds = useRef(new Set());
  const crownClicks = useRef(0);
  const crownClickTimer = useRef(null);
  const meteorTimer = useRef(null);
  const rippleTimers = useRef([]);

  useEffect(() => {
    setSpaceObjects(getRandomSpaceObjects());
    setStars(Array.from({ length: 280 }, (_, index) => ({
      id: index,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: `${(0.6 + Math.pow(Math.random(), 3) * 2.4).toFixed(2)}px`,
      opacity: (0.3 + Math.random() * 0.7).toFixed(2),
      color: starColors[Math.floor(Math.random() * starColors.length)],
      speed: `${(2.5 + Math.random() * 5).toFixed(2)}s`,
      delay: `${(-Math.random() * 7).toFixed(2)}s`,
    })));

    const savedTheme = localStorage.getItem('ryan-theme');
    if (savedTheme === 'dark') setDarkMode(true);

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

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? 'dark' : 'light';
    localStorage.setItem('ryan-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => () => {
    window.clearTimeout(crownClickTimer.current);
    window.clearTimeout(meteorTimer.current);
    rippleTimers.current.forEach(window.clearTimeout);
  }, []);

  function launchMeteorShower(mark) {
    if (meteors.length) return;
    const meteorCount = window.innerWidth < 680 ? 24 : 38;
    setMeteors(Array.from({ length: meteorCount }, (_, index) => ({
      id: index,
      golden: Math.random() > 0.62,
      left: `${20 + Math.random() * 115}vw`,
      top: `${-30 + Math.random() * 42}vh`,
      delay: `${(Math.random() * 1.8).toFixed(2)}s`,
      duration: `${(1.05 + Math.random() * 1.1).toFixed(2)}s`,
      length: `${(70 + Math.random() * 150).toFixed(0)}px`,
      scale: (0.65 + Math.random() * 0.75).toFixed(2),
    })));
    mark.classList.add('meteor-triggered');
    meteorTimer.current = window.setTimeout(() => {
      setMeteors([]);
      mark.classList.remove('meteor-triggered');
    }, 4300);
  }

  function handleCrownClick(event) {
    event.preventDefault();
    const mark = event.currentTarget;
    crownClicks.current += 1;
    mark.classList.remove('secret-tap');
    void mark.offsetWidth;
    mark.classList.add('secret-tap');

    window.clearTimeout(crownClickTimer.current);
    crownClickTimer.current = window.setTimeout(() => { crownClicks.current = 0; }, 2600);
    if (crownClicks.current >= 5) {
      crownClicks.current = 0;
      window.clearTimeout(crownClickTimer.current);
      launchMeteorShower(mark);
    }
  }

  function handleSpaceObjectClick(id) {
    if (foundObjectIds.current.has(id)) return;
    foundObjectIds.current.add(id);
    const foundCount = foundObjectIds.current.size;
    setFoundObjectCount(foundCount);
    setSpaceObjects((current) => current.filter((object) => object.id !== id));

    if (foundCount === huntTargetCount) {
      setSolarSystemFact(solarSystemFacts[Math.floor(Math.random() * solarSystemFacts.length)]);
      setHuntComplete(true);
    }
  }

  function handlePlayAgain(event) {
    event.stopPropagation();
    const nextRound = huntRound + 1;
    foundObjectIds.current.clear();
    setHuntRound(nextRound);
    setFoundObjectCount(0);
    setSolarSystemFact('');
    setHuntComplete(false);
    setSpaceObjects(getRandomSpaceObjects(nextRound));
  }

  function handleThemeToggle(event) {
    if (ripple) return;
    const nextDarkMode = !darkMode;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDarkMode(nextDarkMode);
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const originX = bounds.left + bounds.width / 2;
    const originY = bounds.top + bounds.height / 2;
    const radius = Math.hypot(
      Math.max(originX, window.innerWidth - originX),
      Math.max(originY, window.innerHeight - originY),
    );
    setRipple({ originX, originY, size: radius * 2.35, fading: false });
    rippleTimers.current = [
      window.setTimeout(() => setDarkMode(nextDarkMode), 650),
      window.setTimeout(() => setRipple((value) => value ? { ...value, fading: true } : value), 790),
      window.setTimeout(() => setRipple(null), 1120),
    ];
  }

  return (
    <>
      <div className="page-shell" style={{
        '--hunt-scale': 1 / (1 + huntRound * 0.12),
        '--hunt-opacity': 0.86 / (1 + huntRound * 0.08),
      }}>
        <div className="starfield" aria-hidden="true">
          {stars.map((star) => (
            <span className="space-star" key={star.id} style={{
              left: star.left,
              top: star.top,
              '--star-size': star.size,
              '--star-opacity': star.opacity,
              '--star-color': star.color,
              '--twinkle-speed': star.speed,
              '--twinkle-delay': star.delay,
            }} />
          ))}
        </div>

        <header className="site-header">
          <Brand onCrownClick={handleCrownClick} />
          <div className="header-actions">
            <nav aria-label="Main navigation">
              <a href="#about">About</a>
              <a href="#interests">Interests</a>
              <a href="#now">Now</a>
            </nav>
            <button className="theme-toggle" type="button" aria-pressed={darkMode} onClick={handleThemeToggle}>
              <span className="theme-icon" aria-hidden="true">{darkMode ? '☀' : '☾'}</span>
              <span className="theme-label">{darkMode ? 'Light mode' : 'Dark mode'}</span>
            </button>
          </div>
        </header>

        <main id="top">
          <section className="hero" aria-labelledby="hero-title">
            <SpaceObjectLayer section="hero" objects={spaceObjects} onFind={handleSpaceObjectClick} />
            <div className="hero-copy reveal">
              <p className="eyebrow"><span /> Student · Explorer · Creator</p>
              <h1 id="hero-title">Hi, I’m Ryan.<span className="hero-tagline"><em>Curious by nature.</em></span></h1>
              <p className="hero-intro">I’m fascinated by living things, captivated by good stories, and always ready to learn something new.</p>
              <div className="hero-actions">
                <a className="button button-primary" href="#about">Get to know me <span aria-hidden="true">↓</span></a>
                <a className="button button-quiet" href="#now">What I’m doing now <span aria-hidden="true">↗</span></a>
              </div>
            </div>

            <div className="hero-art reveal" aria-label="An abstract biology-inspired illustration">
              <div className="orb orb-main">
                <svg className="cell-art" viewBox="0 0 420 420" role="img" aria-label="Stylised cell and leaf illustration">
                  <defs><linearGradient id="cellGradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#eee9ff"/><stop offset="1" stopColor="#b8c4ff"/></linearGradient></defs>
                  <path className="cell-outline" d="M95 83c48-39 130-51 184-13 56 39 82 124 50 187-29 59-111 96-175 79-66-18-111-81-101-147 6-39 14-80 42-106Z"/>
                  <circle className="nucleus" cx="192" cy="196" r="65"/><circle className="nucleus-core" cx="203" cy="184" r="25"/>
                  <path className="leaf" d="M282 119c-9 39-35 61-73 67 5-40 29-64 73-67Z"/><path className="leaf-vein" d="m218 177 53-47"/>
                  <path className="microbe" d="M119 238c21-16 44-12 55 7 10 18 2 40-20 51-23 11-43 3-51-15-7-16-1-31 16-43Z"/>
                  <g className="bubbles"><circle cx="111" cy="151" r="12"/><circle cx="289" cy="233" r="18"/><circle cx="254" cy="289" r="8"/><circle cx="147" cy="105" r="7"/></g>
                </svg>
                <span className="orbit orbit-one"/><span className="orbit orbit-two"/>
              </div>
              <div className="floating-note note-one"><span>🧬</span> Biology</div>
              <div className="floating-note note-two"><span>✦</span> Stay curious</div>
              <span className="dot-grid" aria-hidden="true"/>
            </div>
          </section>

          <section className="about section" id="about" aria-labelledby="about-title">
            <SpaceObjectLayer section="about" objects={spaceObjects} onFind={handleSpaceObjectClick} />
            <div className="about-side reveal">
              <div className="section-label">01 · About me</div>
              <div className="earth-wrap">
                <span className="earth-star earth-star-one" aria-hidden="true">✦</span><span className="earth-star earth-star-two" aria-hidden="true">✧</span>
                <span className="solar-orbit-track" aria-hidden="true"/><span className="saturn-orbit-track" aria-hidden="true"/><span className="solar-sun" aria-hidden="true"/>
                <div className="planet-orbiter" aria-hidden="true">
                  <span className="moon-track moon-track-back"/><span className="moon-track moon-track-front"/><span className="cartoon-moon"/>
                  <svg className="cartoon-earth" viewBox="0 0 220 220">
                    <defs>
                      <linearGradient id="oceanGradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#77d6f2"/><stop offset="1" stopColor="#4b72da"/></linearGradient>
                      <linearGradient id="landGradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#c9ec8f"/><stop offset="1" stopColor="#65b77a"/></linearGradient>
                    </defs>
                    <circle className="earth-shadow" cx="110" cy="116" r="79"/><circle className="earth-ocean" cx="110" cy="104" r="78"/>
                    <path className="earth-land" d="M56 61c13-18 31-29 51-34l10 13-8 13-18 2-7 13 10 11-5 17-19 5-11-10-14-2-7-13 18-15Z"/>
                    <path className="earth-land" d="M139 51c18 8 32 23 41 40l-11 8-1 18-13 5-7 20-15 14-12-7 3-19-12-12 7-17 16-7 4-12-9-12 9-19Z"/>
                    <path className="earth-land small-land" d="m73 128 15 5 8 14-8 20-11-6-4-17-10-8 10-8Z"/>
                    <path className="earth-shine" d="M62 70c10-18 27-29 45-34"/><path className="earth-eye" d="M83 107c4 4 8 4 12 0M126 107c4 4 8 4 12 0"/><path className="earth-smile" d="M94 125c10 10 23 10 33 0"/>
                    <g className="earth-cheeks"><ellipse cx="78" cy="122" rx="9" ry="5"/><ellipse cx="143" cy="122" rx="9" ry="5"/></g>
                  </svg>
                </div>
                {spaceObjects.some((object) => object.id === 0) && <button className="saturn-orbiter" type="button" aria-label="Click Saturn, space object 1 of 10" title="Click Saturn" onClick={() => handleSpaceObjectClick(0)}>
                  <svg className="about-saturn" viewBox="0 0 48 48">
                    <ellipse className="about-saturn-ring-back" cx="24" cy="24" rx="20" ry="7" transform="rotate(-22 24 24)"/>
                    <circle className="about-saturn-planet" cx="24" cy="24" r="10"/>
                    <path className="about-saturn-bands" d="M16 21c5 2 11 2 16 0m-16 6c5-2 11-2 16 0"/>
                    <path className="about-saturn-ring-front" d="M6 27c10 5 26 5 36-1"/>
                  </svg>
                </button>}
              </div>
            </div>
            <div className="about-content reveal">
              <h2 id="about-title">Learning how the world works, one question at a time.</h2>
              <p>I’m Ryan, a student with a big curiosity for science and creativity. Whether I’m exploring how cells work, getting lost in a book, or building something with code, I love following ideas and seeing where they lead. I also enjoy the focus, strategy, and movement of tennis and fencing.</p>
            </div>
          </section>

          <section className="interests section" id="interests" aria-labelledby="interests-title">
            <SpaceObjectLayer section="interests" objects={spaceObjects} onFind={handleSpaceObjectClick} />
            <div className="section-heading reveal">
              <div><div className="section-label">02 · Things I enjoy</div><h2 id="interests-title">A few things that keep me inspired.</h2></div>
              <p>My interests live somewhere between a laboratory, a library, a game world, a melody, a tennis court, and a fencing piste.</p>
            </div>
            <div className="card-grid">
              <InterestCard number="01" className="card-biology" title="Biology" description="Discovering the systems, structures, and tiny processes that make life possible.">
                <div className="card-icon card-icon-dna" aria-hidden="true"><svg viewBox="0 0 48 48"><path className="dna-strand dna-strand-a" d="M14 6c0 9 20 10 20 18S14 33 14 42"/><path className="dna-strand dna-strand-b" d="M34 6c0 9-20 10-20 18s20 9 20 18"/><path className="dna-rungs" d="M17 10h14M19 17h10M14 24h20M19 31h10M17 38h14"/></svg></div>
              </InterestCard>
              <InterestCard number="02" className="card-books" title="Reading" description="Opening a book and stepping into new ideas, perspectives, and worlds.">
                <div className="card-icon card-icon-book" aria-hidden="true"><svg viewBox="0 0 48 48"><path d="M24 38c-4-4-10-6-18-5V11c8-1 14 1 18 5v22Z"/><path d="M24 38c4-4 10-6 18-5V11c-8-1-14 1-18 5v22Z"/><path className="icon-detail" d="M10 17c4 0 7 .7 10 2.4M10 22c4 0 7 .7 10 2.4M38 17c-4 0-7 .7-10 2.4M38 22c-4 0-7 .7-10 2.4"/></svg></div>
              </InterestCard>
              <InterestCard number="03" className="card-games" title="Gaming" description="Enjoying challenges, good stories, and the satisfaction of mastering a game.">
                <div className="card-icon card-icon-game" aria-hidden="true"><svg viewBox="0 0 48 48"><path d="M16 15h16c6 0 10 5 11 14l1 7c.5 4-4 6-7 3l-5-6H16l-5 6c-3 3-7.5 1-7-3l1-7c1-9 5-14 11-14Z"/><path className="icon-detail" d="M12 24h8M16 20v8"/><circle className="icon-fill" cx="34" cy="22" r="2"/><circle className="icon-fill" cx="38" cy="27" r="2"/></svg></div>
              </InterestCard>
              <InterestCard number="04" className="card-music" title="Music" description="Playing music, finding a rhythm, and expressing ideas without needing words.">
                <div className="card-icon" aria-hidden="true">♫</div>
              </InterestCard>
              <InterestCard number="05" className="card-tennis" title="Tennis" description="Building skill, strategy, and resilience one rally at a time.">
                <div className="card-icon card-icon-tennis">
                  <svg viewBox="0 0 48 48" aria-hidden="true"><g className="tennis-racket" transform="rotate(-34 22 23)"><ellipse cx="19" cy="16" rx="10" ry="13"/><ellipse className="racket-inner" cx="19" cy="16" rx="7.2" ry="10.2"/><path className="racket-strings" d="M13 8v16M17 6v20M21 6v20M25 9v14M11 11h16M10 16h18M12 21h14"/><path className="racket-shaft" d="m19 29 1 12M16.5 41h7"/><path className="racket-grip" d="m17.5 33 4.5 2m-4.2 2 4.5 2"/></g></svg>
                  {spaceObjects.some((object) => object.id === 1) && <button className="tennis-sun-button" type="button" aria-label="Click the Sun, space object 2 of 10" title="Click the Sun" onClick={(event) => { event.stopPropagation(); handleSpaceObjectClick(1); }}><svg viewBox="0 0 48 48" aria-hidden="true"><circle className="tennis-sun-halo" cx="24" cy="24" r="18"/><path className="tennis-sun-rays" d="M24 2v7m0 30v7M2 24h7m30 0h7M8.4 8.4l5 5m21.2 21.2 5 5m0-31.2-5 5M13.4 34.6l-5 5"/><circle className="tennis-sun-core" cx="24" cy="24" r="10"/><circle className="tennis-sun-shine" cx="21" cy="20" r="2.4"/></svg></button>}
                </div>
              </InterestCard>
              <InterestCard number="06" className="card-fencing" title="Fencing" subtitle="Click for a game" description="Combining quick decisions, precise movement, and tactical thinking." href="https://en-garde-fencing-arena.echristina-wang.chatgpt.site">
                <div className="card-icon card-icon-fencing" aria-hidden="true"><svg viewBox="0 0 48 48"><path d="M8 38 38 8M10 31l7 7M6 42l5-5M40 6l2 2"/><path d="m10 8 30 30M31 38l7-7M6 6l5 5M38 40l2 2"/><path className="icon-detail" d="M13 34c-3 3-3 7-1 9M34 13c3-3 7-3 9-1"/></svg></div>
              </InterestCard>
              <InterestCard
                number="07"
                className="card-creativity"
                title="Creativity"
                description="Imagining new possibilities and turning ideas into something of my own. Click the website icon five times for a little magic."
                extra={(
                  <div className="space-object-hunt" aria-live="polite">
                    <p>Find and click on {huntTargetCount} space objects to reveal a fun fact!</p>
                    <p className="space-object-hunt-progress">Objects found: {foundObjectCount} of {huntTargetCount}</p>
                    {solarSystemFact && <p className="solar-system-fact">{solarSystemFact}</p>}
                    {huntComplete && <button className="play-again-button" type="button" onClick={handlePlayAgain}>Play again · {Math.min(10 + (huntRound + 1) * 2, spaceObjectHideSpots.length)} objects</button>}
                  </div>
                )}
              >
                <div className="card-icon card-icon-creativity" aria-hidden="true"><svg viewBox="0 0 48 48"><path d="m13 35 20-20 5 5-20 20-5-5Z"/><path className="icon-detail" d="m30 9 1.5-4M36 14l4-1.5M25 8l-1-4M39 25l4 1M19 18l-3-3"/><path d="m12 8 .7 2.3L15 11l-2.3.7L12 14l-.7-2.3L9 11l2.3-.7L12 8Z"/></svg></div>
              </InterestCard>
            </div>
          </section>

          <section className="now section" id="now" aria-labelledby="now-title">
            <SpaceObjectLayer section="now" objects={spaceObjects} onFind={handleSpaceObjectClick} />
            <div className="now-panel reveal">
              <div className="now-copy"><div className="section-label light">03 · Right now</div><h2 id="now-title">Building, learning, and preparing.</h2><p>I’m putting my curiosity into action through two projects that matter to me.</p></div>
              <div className="goal-list">
                <article className="goal">
                  <span className="goal-icon coding-logo" aria-hidden="true"><svg viewBox="0 0 48 48" role="img"><rect className="code-window" x="5" y="7" width="38" height="34" rx="6"/><path className="code-bar" d="M5 15h38"/><circle className="code-dot dot-one" cx="11" cy="11" r="1.5"/><circle className="code-dot dot-two" cx="16" cy="11" r="1.5"/><circle className="code-dot dot-three" cx="21" cy="11" r="1.5"/><path className="code-symbol" d="m19 23-5 5 5 5m10-10 5 5-5 5m-3-13-4 16"/></svg></span>
                  <div><p className="goal-kicker">Creating</p><h3>Learning to code &amp; building this website</h3><p>Turning ideas into something real, one line at a time.</p></div>
                </article>
                <article className="goal">
                  <span className="goal-icon goal-logo"><img src="assets/biology-olympiad-nz.png" alt="International Biology Olympiad New Zealand logo"/></span>
                  <div><p className="goal-kicker">Preparing</p><h3>NZIBO Tutorial Programme</h3><p>Strengthening my biology knowledge and taking on a new challenge.</p></div>
                </article>
              </div>
            </div>
          </section>

          <section className="quote section reveal" aria-label="Personal motto">
            <SpaceObjectLayer section="quote" objects={spaceObjects} onFind={handleSpaceObjectClick} />
            <span className="quote-mark" aria-hidden="true">“</span>
            <blockquote>Music can make you escape, or it can make a situation more manageable somehow.</blockquote>
            <p>— Chris Martin</p>
          </section>
        </main>

        <footer><Brand footer/><a className="back-top" href="#top">Back to top ↑</a></footer>
      </div>

      {ripple && <span className={`theme-ripple${ripple.fading ? ' is-fading' : ''}`} style={{ left: ripple.originX, top: ripple.originY, width: ripple.size, height: ripple.size }}/>} 
      {meteors.length > 0 && <div className="meteor-shower" aria-hidden="true">{meteors.map((meteor) => <span key={meteor.id} className={`meteor${meteor.golden ? ' meteor-gold' : ''}`} style={{ left: meteor.left, top: meteor.top, '--meteor-delay': meteor.delay, '--meteor-duration': meteor.duration, '--meteor-length': meteor.length, '--meteor-scale': meteor.scale }}/>)}</div>}
    </>
  );
}
