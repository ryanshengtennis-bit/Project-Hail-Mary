'use client';

import { useEffect, useRef, useState } from 'react';

const starColors = ['#ffffff', '#d9e5ff', '#c8bfff', '#ffe4a3'];

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

function InterestCard({ number, className, title, subtitle, description, href, children }) {
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
        <p>{description}</p>
        {href && (
          <a className="card-link" href={href} target="_blank" rel="noopener noreferrer" onClick={(event) => event.stopPropagation()}>
            Visit fencing arena <span aria-hidden="true">↗</span>
          </a>
        )}
      </div>
      <span className="card-line" />
    </article>
  );
}

export default function Home() {
  const [stars, setStars] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [ripple, setRipple] = useState(null);
  const [meteors, setMeteors] = useState([]);
  const crownClicks = useRef(0);
  const crownClickTimer = useRef(null);
  const meteorTimer = useRef(null);
  const rippleTimers = useRef([]);

  useEffect(() => {
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
      <div className="page-shell">
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
            <div className="about-side reveal">
              <div className="section-label">01 · About me</div>
              <div className="earth-wrap" aria-hidden="true">
                <span className="earth-star earth-star-one">✦</span><span className="earth-star earth-star-two">✧</span>
                <span className="solar-orbit-track"/><span className="solar-sun"/>
                <div className="planet-orbiter">
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
              </div>
            </div>
            <div className="about-content reveal">
              <h2 id="about-title">Learning how the world works, one question at a time.</h2>
              <p>I’m Ryan, a student with a big curiosity for science and creativity. Whether I’m exploring how cells work, getting lost in a book, or building something with code, I love following ideas and seeing where they lead. I also enjoy the focus, strategy, and movement of tennis and fencing.</p>
            </div>
          </section>

          <section className="interests section" id="interests" aria-labelledby="interests-title">
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
                <div className="card-icon card-icon-tennis" aria-hidden="true"><svg viewBox="0 0 48 48"><g className="tennis-racket" transform="rotate(-34 22 23)"><ellipse cx="19" cy="16" rx="10" ry="13"/><ellipse className="racket-inner" cx="19" cy="16" rx="7.2" ry="10.2"/><path className="racket-strings" d="M13 8v16M17 6v20M21 6v20M25 9v14M11 11h16M10 16h18M12 21h14"/><path className="racket-shaft" d="m19 29 1 12M16.5 41h7"/><path className="racket-grip" d="m17.5 33 4.5 2m-4.2 2 4.5 2"/></g><circle className="tennis-ball" cx="38" cy="10" r="5"/><path className="tennis-seam" d="M35 6.1c2.6 2 3.6 5.5 1.4 8.4M41 5.8c-2.5 2.2-3.2 5.7-.9 8.5"/></svg></div>
              </InterestCard>
              <InterestCard number="06" className="card-fencing" title="Fencing" subtitle="Click for a game" description="Combining quick decisions, precise movement, and tactical thinking." href="https://en-garde-fencing-arena.echristina-wang.chatgpt.site">
                <div className="card-icon card-icon-fencing" aria-hidden="true"><svg viewBox="0 0 48 48"><path d="M8 38 38 8M10 31l7 7M6 42l5-5M40 6l2 2"/><path d="m10 8 30 30M31 38l7-7M6 6l5 5M38 40l2 2"/><path className="icon-detail" d="M13 34c-3 3-3 7-1 9M34 13c3-3 7-3 9-1"/></svg></div>
              </InterestCard>
              <InterestCard number="07" className="card-creativity" title="Creativity" description="Imagining new possibilities and turning ideas into something of my own. Click the website icon five times for a little magic.">
                <div className="card-icon card-icon-creativity" aria-hidden="true"><svg viewBox="0 0 48 48"><path d="m13 35 20-20 5 5-20 20-5-5Z"/><path className="icon-detail" d="m30 9 1.5-4M36 14l4-1.5M25 8l-1-4M39 25l4 1M19 18l-3-3"/><path d="m12 8 .7 2.3L15 11l-2.3.7L12 14l-.7-2.3L9 11l2.3-.7L12 8Z"/></svg></div>
              </InterestCard>
            </div>
          </section>

          <section className="now section" id="now" aria-labelledby="now-title">
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
