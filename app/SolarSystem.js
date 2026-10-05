const planets = [
  { name: 'Mercury', orbit: 10, size: 2, duration: 14, phase: -2 },
  { name: 'Venus', orbit: 15, size: 3.2, duration: 20, phase: -11 },
  { name: 'Earth', orbit: 20, size: 3.6, duration: 28, phase: -20 },
  { name: 'Mars', orbit: 25, size: 2.8, duration: 36, phase: -3 },
  { name: 'Jupiter', orbit: 30, size: 7.5, duration: 52, phase: -30 },
  { name: 'Saturn', orbit: 35, size: 6.4, duration: 68, phase: -6 },
  { name: 'Uranus', orbit: 40, size: 4.5, duration: 84, phase: -57 },
  { name: 'Neptune', orbit: 45, size: 4.3, duration: 104, phase: -41 },
];

export default function SolarSystem({ saturnVisible, saturnExploding, onSaturnClick }) {
  return (
    <figure className="about-solar-system" aria-label="Illustrated solar system with all eight planetary orbits">
      <div className="solar-system-scene">
        <div className="system-sun" role="img" aria-label="Sun" />
        {planets.map((planet) => {
          const name = planet.name.toLowerCase();
          const style = {
            '--orbit-x': `${planet.orbit}%`, '--orbit-y': `${planet.orbit * .8}%`,
            '--planet-size': `${planet.size}%`, '--orbit-duration': `${planet.duration}s`,
            '--orbit-delay': `${planet.phase}s`, '--orbit-start': `${-planet.phase / planet.duration * 100}%`,
          };
          return (
            <div className="system-orbit-layer" key={name} style={style}>
              <span className="system-orbit-track" aria-hidden="true" />
              {name === 'saturn' ? saturnVisible && (
                <button className={`system-planet system-${name}${saturnExploding ? ' is-exploding' : ''}`} type="button" aria-label="Click Saturn" title="Saturn" disabled={saturnExploding} onClick={onSaturnClick}>
                  <span className="planet-surface" />
                </button>
              ) : (
                <span className={`system-planet system-${name}`} role="img" aria-label={planet.name} title={planet.name}><span className="planet-surface" /></span>
              )}
            </div>
          );
        })}
      </div>
      <figcaption>
        <span className="system-caption">Our solar neighbourhood <small>Illustration · not to scale</small></span>
        <span className="system-legend">{planets.map((planet) => <span key={planet.name}><i className={`legend-${planet.name.toLowerCase()}`} />{planet.name}</span>)}</span>
      </figcaption>
    </figure>
  );
}
