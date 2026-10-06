'use client';

import { useEffect, useRef, useState } from 'react';

// Original ambient score: overlapping broken chords and gently evolving melodies.
const chords = [[48, 55, 62, 64], [45, 52, 59, 60], [41, 48, 55, 57], [43, 50, 57, 59], [48, 55, 59, 62], [41, 48, 52, 59]];
const transitions = [[1, 2, 4], [2, 3, 5], [0, 3, 4], [0, 1, 4], [1, 2, 5], [0, 3, 4]];
const rhythms = [[.9, 1.1, .8, 1.2], [1.1, .85, 1.05, 1], [.8, 1, 1.2, .95]];

function makeSoundtrack() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;
  const context = new AudioContext();
  const master = context.createGain();
  master.gain.value = .3;
  const limiter = context.createDynamicsCompressor();
  limiter.threshold.value = -18;
  limiter.ratio.value = 4;
  master.connect(limiter).connect(context.destination);
  const tone = context.createBiquadFilter();
  tone.type = 'lowpass';
  tone.frequency.value = 1900;
  tone.Q.value = .3;
  tone.connect(master);
  const reverb = context.createConvolver();
  const impulse = context.createBuffer(2, Math.ceil(context.sampleRate * 2.1), context.sampleRate);
  for (let channel = 0; channel < 2; channel += 1) {
    const samples = impulse.getChannelData(channel);
    for (let i = 0; i < samples.length; i += 1) samples[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / samples.length, 3);
  }
  reverb.buffer = impulse;
  const wet = context.createGain();
  wet.gain.value = .42;
  tone.connect(reverb).connect(wet).connect(master);
  const wave = context.createPeriodicWave(new Float32Array(6), new Float32Array([0, 1, .3, .1, .12, .035]));
  const voices = new Set();
  function note(midi, time, duration, level, organ = true) {
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    if (organ) oscillator.setPeriodicWave(wave);
    else oscillator.type = 'sine';
    oscillator.frequency.value = 440 * Math.pow(2, (midi - 69) / 12);
    envelope.gain.setValueAtTime(0, time);
    envelope.gain.linearRampToValueAtTime(level, time + Math.min(organ ? .65 : .35, duration * .25));
    envelope.gain.linearRampToValueAtTime(level * .7, time + duration * .5);
    envelope.gain.linearRampToValueAtTime(0, time + duration);
    oscillator.connect(envelope).connect(tone);
    voices.add(oscillator);
    oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); voices.delete(oscillator); };
    oscillator.start(time);
    oscillator.stop(time + duration + .02);
  }
  let next = 0;
  let step = 0;
  let chordIndex = 0;
  let phraseRemaining = 8;
  let rhythm = rhythms[0];
  let previousMid = 60;
  let previousLead = 74;
  let leadAt = 2;
  function nearbyPitch(chord, previous, low, high) {
    const choices = [...new Set(chord.flatMap((pitch) => [pitch, pitch + 12, pitch + 24]))]
      .filter((pitch) => pitch >= low && pitch <= high && pitch !== previous)
      .sort((a, b) => Math.abs(a - previous) - Math.abs(b - previous));
    return choices[Math.floor(Math.random() * Math.min(3, choices.length))] ?? previous;
  }
  function schedule() {
    if (context.state !== 'running') return;
    if (next < context.currentTime) next = context.currentTime + .1;
    while (next < context.currentTime + 3) {
      if (phraseRemaining === 0) {
        const choices = transitions[chordIndex];
        chordIndex = choices[Math.floor(Math.random() * choices.length)];
        phraseRemaining = 6 + Math.floor(Math.random() * 5);
        rhythm = rhythms[Math.floor(Math.random() * rhythms.length)];
        tone.frequency.setTargetAtTime(1600 + Math.random() * 600, next, 2);
      }
      const chord = chords[chordIndex];
      // Let separate voices overlap instead of striking the whole chord together.
      previousMid = nearbyPitch(chord, previousMid, 52, 72);
      note(previousMid, next, 2.8 + Math.random() * .6, .055 + Math.random() * .012);
      if (step % 3 === 0) note(chord[0] - 12, next, 4.2, .038, false);
      if (step >= leadAt) {
        previousLead = nearbyPitch(chord, previousLead, 67, 84);
        note(previousLead, next + .18, 1.8 + Math.random() * .8, .021, false);
        leadAt = step + 2 + Math.floor(Math.random() * 3);
      }
      next += rhythm[step % rhythm.length];
      phraseRemaining -= 1;
      step += 1;
    }
  }
  const timer = window.setInterval(schedule, 400);
  return {
    context,
    start() { return context.resume().then(schedule); },
    pause() { return context.suspend(); },
    volume(value) { master.gain.setTargetAtTime(value, context.currentTime, .12); },
    dispose() { clearInterval(timer); context.onstatechange = null; voices.forEach((voice) => { try { voice.stop(); } catch {} }); return context.close(); },
  };
}

export default function SpaceMusic() {
  const engine = useRef(null);
  const enabled = useRef(true);
  const [wanted, setWanted] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(30);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let soundtrack;
    try { soundtrack = makeSoundtrack(); } catch { setUnavailable(true); return; }
    if (!soundtrack) { setUnavailable(true); return; }
    engine.current = soundtrack;
    soundtrack.context.onstatechange = () => setPlaying(soundtrack.context.state === 'running');
    const start = () => { if (enabled.current && !document.hidden) soundtrack.start().catch(() => setPlaying(false)); };
    const visibility = () => { if (!document.hidden) start(); };
    document.addEventListener('pointerdown', start);
    document.addEventListener('keydown', start);
    document.addEventListener('visibilitychange', visibility);
    start();
    return () => {
      document.removeEventListener('pointerdown', start);
      document.removeEventListener('keydown', start);
      document.removeEventListener('visibilitychange', visibility);
      engine.current = null;
      soundtrack.dispose().catch(() => {});
    };
  }, []);

  function toggle() {
    const next = !enabled.current;
    enabled.current = next;
    setWanted(next);
    if (!engine.current) return;
    (next ? engine.current.start() : engine.current.pause()).catch(() => setPlaying(false));
  }

  return (
    <aside className="space-music-control" aria-label="Background music">
      <div className="space-music-buttons">
        <button type="button" onClick={toggle} disabled={unavailable} aria-pressed={wanted && !unavailable} aria-label={wanted ? 'Turn background music off' : 'Turn background music on'}>
          <span className="music-icon" aria-hidden="true">♫</span>
          <span>{unavailable ? 'Audio unavailable' : !wanted ? 'Music off' : playing ? 'Music on' : 'Music ready'}<small>{!unavailable && wanted && !playing ? 'Starts on your first tap' : 'Space radio'}</small></span>
        </button>
        <details>
          <summary aria-label="Music volume" title="Music volume">☷</summary>
          <label className="music-volume">Volume <output>{volume}%</output><input type="range" min="0" max="100" value={volume} aria-label="Music volume" onChange={(event) => { const value = Number(event.target.value); setVolume(value); engine.current?.volume(value / 100); }} /></label>
        </details>
      </div>
    </aside>
  );
}
