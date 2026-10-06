'use client';

import { useEffect, useRef, useState } from 'react';

// Original cinematic organ score, with its own harmony and melodic patterns.
const chords = [[50, 53, 57, 64], [46, 53, 57, 62], [41, 48, 55, 57], [48, 55, 62, 65], [43, 50, 57, 58], [50, 57, 60, 65]];
const transitions = [[1, 2, 4], [2, 3, 5], [0, 3, 4], [0, 1, 4], [1, 2, 5], [0, 3, 4]];
const motifs = [[0, 2, 1, 3, 2, 1, 3, 1], [1, 0, 2, 3, 1, 2, 0, 3], [2, 1, 3, 0, 1, 3, 2, 1]];

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
  tone.frequency.value = 2400;
  tone.Q.value = .3;
  tone.connect(master);
  const reverb = context.createConvolver();
  const impulse = context.createBuffer(2, Math.ceil(context.sampleRate * 3.8), context.sampleRate);
  for (let channel = 0; channel < 2; channel += 1) {
    const samples = impulse.getChannelData(channel);
    for (let i = 0; i < samples.length; i += 1) samples[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / samples.length, 3);
  }
  reverb.buffer = impulse;
  const wet = context.createGain();
  wet.gain.value = .6;
  const preDelay = context.createDelay(.2);
  preDelay.delayTime.value = .055;
  tone.connect(preDelay).connect(reverb).connect(wet).connect(master);
  const wave = context.createPeriodicWave(new Float32Array(13), new Float32Array([0, 1, .52, .2, .28, .08, .12, .035, .08, .015, .025, .01, .015]));
  const voices = new Set();
  function note(midi, time, duration, level, organ = true, swell = false) {
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    const pan = context.createStereoPanner();
    pan.pan.value = organ ? ((midi % 12) - 5.5) * .055 : 0;
    if (organ) oscillator.setPeriodicWave(wave);
    else oscillator.type = 'sine';
    oscillator.frequency.value = 440 * Math.pow(2, (midi - 69) / 12);
    envelope.gain.setValueAtTime(0, time);
    envelope.gain.linearRampToValueAtTime(level, time + Math.min(swell ? 1.6 : organ ? .32 : .4, duration * .35));
    envelope.gain.linearRampToValueAtTime(level * .7, time + duration * .5);
    envelope.gain.linearRampToValueAtTime(0, time + duration);
    oscillator.connect(envelope).connect(pan).connect(tone);
    voices.add(oscillator);
    oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); pan.disconnect(); voices.delete(oscillator); };
    oscillator.start(time);
    oscillator.stop(time + duration + .02);
  }
  let next = 0;
  let step = 0;
  let chordIndex = 0;
  let phraseRemaining = 16;
  let motifIndex = 0;
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
      const intensity = .5 - .5 * Math.cos(step * Math.PI / 64);
      if (phraseRemaining === 0) {
        const choices = transitions[chordIndex];
        chordIndex = choices[Math.floor(Math.random() * choices.length)];
        phraseRemaining = Math.random() < .5 ? 12 : 16;
        motifIndex = (motifIndex + 1 + Math.floor(Math.random() * 2)) % motifs.length;
        tone.frequency.setTargetAtTime(1800 + intensity * 1400, next, 3);
      }
      const chord = chords[chordIndex];
      // A steady organ figure floats over quiet swells, with a gradual rise and fall.
      const pitch = chord[motifs[motifIndex][step % 8]];
      note(pitch < 55 ? pitch + 12 : pitch, next, 2.2, .036 + intensity * .018);
      if (step % 4 === 0) note(chord[0] - 12, next, 4.8, .038 + intensity * .01, false);
      if (step % 8 === 0) chord.slice(1, 3).forEach((harmony) => note(harmony, next + .12, 4.6, .015 + intensity * .012, true, true));
      if (step >= leadAt) {
        previousLead = nearbyPitch(chord, previousLead, 67, 84);
        note(previousLead, next + .18, 2.4, .012 + intensity * .009);
        leadAt = step + 4 + Math.floor(Math.random() * 4);
      }
      next += .74;
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
