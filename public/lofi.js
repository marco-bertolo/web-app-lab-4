(() => {
  let ctx = null;
  let master = null;
  let vinylSource = null;
  let playing = false;
  let schedulerTimer = null;
  let nextNoteTime = 0;
  let barIndex = 0;

  const bpm = 72;
  const beatDur = 60 / bpm;
  const barDur = beatDur * 4;

  // Classic lofi progression: Fmaj7 → Em7 → Am7 → Dm7
  const chords = [
    [174.61, 220.00, 261.63, 329.63],
    [164.81, 196.00, 246.94, 293.66],
    [220.00, 261.63, 329.63, 392.00],
    [146.83, 174.61, 220.00, 261.63]
  ];

  function initAudio() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();

    master = ctx.createGain();
    master.gain.value = 0.45;

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 2400;
    lowpass.Q.value = 0.6;

    master.connect(lowpass);
    lowpass.connect(ctx.destination);
  }

  function startVinyl() {
    const size = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, size, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < size; i++) {
      data[i] = (Math.random() * 2 - 1) * (Math.random() > 0.98 ? 1 : 0.2);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 4500;
    const gain = ctx.createGain();
    gain.gain.value = 0.035;
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    noise.start();
    return noise;
  }

  function playPiano(freq, t, dur, vel = 0.18) {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    osc1.type = 'sine';
    osc2.type = 'triangle';
    osc1.frequency.value = freq;
    osc2.frequency.value = freq * 2.01;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vel, t + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0005, t + dur);
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(master);
    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + dur);
    osc2.stop(t + dur);
  }

  function playKick(t) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(38, t + 0.18);
    gain.gain.setValueAtTime(0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
    osc.connect(gain);
    gain.connect(master);
    osc.start(t);
    osc.stop(t + 0.33);
  }

  function playSnare(t) {
    const size = ctx.sampleRate * 0.18;
    const buffer = ctx.createBuffer(1, size, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < size; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1800;
    filter.Q.value = 0.5;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    noise.start(t);
    noise.stop(t + 0.2);
  }

  function playHat(t, vel = 0.08) {
    const size = ctx.sampleRate * 0.05;
    const buffer = ctx.createBuffer(1, size, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < size; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 7500;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vel, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    noise.start(t);
    noise.stop(t + 0.07);
  }

  function scheduleBar(idx, t) {
    const chord = chords[idx];

    // Sustained chord on beat 1 (slight arpeggio stagger = that lofi "mwah" feel)
    chord.forEach((f, i) => {
      playPiano(f, t + i * 0.012, beatDur * 3.6, 0.13);
    });

    // Drums — lazy boom-bap
    for (let b = 0; b < 4; b++) {
      const bt = t + b * beatDur;
      if (b === 0) playKick(bt);
      if (b === 2) playKick(bt + beatDur * 0.25); // slightly behind the beat
      if (b === 1 || b === 3) playSnare(bt);
      playHat(bt, 0.07);
      playHat(bt + beatDur / 2, 0.05);
    }

    // Simple melody pulled from upper chord tones
    const mel = [chord[2] * 2, chord[3] * 2, chord[2] * 2, chord[1] * 2];
    mel.forEach((f, i) => {
      playPiano(f, t + i * beatDur + beatDur * 0.5, beatDur * 0.55, 0.07);
    });
  }

  function scheduler() {
    while (nextNoteTime < ctx.currentTime + 0.12) {
      scheduleBar(barIndex, nextNoteTime);
      nextNoteTime += barDur;
      barIndex = (barIndex + 1) % chords.length;
    }
    if (playing) schedulerTimer = setTimeout(scheduler, 25);
  }

  async function start() {
    initAudio();
    if (ctx.state === 'suspended') await ctx.resume();
    if (playing) return;
    playing = true;
    vinylSource = startVinyl();
    nextNoteTime = ctx.currentTime + 0.15;
    barIndex = 0;
    scheduler();
  }

  function stop() {
    playing = false;
    if (schedulerTimer) { clearTimeout(schedulerTimer); schedulerTimer = null; }
    if (vinylSource) {
      try { vinylSource.stop(); } catch (e) {}
      vinylSource = null;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('lofiToggle');
    if (!btn) return;
    btn.addEventListener('click', async () => {
      if (playing) {
        stop();
        btn.textContent = '▶ play lofi';
        btn.classList.remove('playing');
        document.body.classList.remove('music-on');
      } else {
        await start();
        btn.textContent = '⏸ pause lofi';
        btn.classList.add('playing');
        document.body.classList.add('music-on');
      }
    });
  });
})();
