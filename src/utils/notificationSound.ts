let audioContext: AudioContext | null = null;
let isPlaying = false;
let intervalId: number | null = null;
let audioElement: HTMLAudioElement | null = null;

export const initAudioContext = async () => {
  try {
    if (!audioContext) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        console.error('AudioContext not supported in this browser');
        return null;
      }
      audioContext = new AudioContextClass();
      console.log('AudioContext created, state:', audioContext.state);
    }

    if (audioContext && audioContext.state === 'suspended') {
      console.log('Resuming suspended AudioContext...');
      await audioContext.resume();
      console.log('AudioContext resumed, state:', audioContext.state);
    }

    return audioContext;
  } catch (error) {
    console.error('Error initializing AudioContext:', error);
    return null;
  }
};

const playBeep = async (frequency: number = 800, duration: number = 0.3) => {
  if (!audioContext) {
    await initAudioContext();
  }

  if (!audioContext) {
    console.error('AudioContext not available for beep');
    return;
  }

  if (audioContext.state === 'suspended') {
    console.log('Resuming suspended AudioContext in playBeep...');
    await audioContext.resume();
  }

  return new Promise<void>((resolve) => {
    try {
      console.log('Playing beep at', frequency, 'Hz');
      const oscillator = audioContext!.createOscillator();
      const gainNode = audioContext!.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext!.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(1.0, audioContext!.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext!.currentTime + duration);

      oscillator.start(audioContext!.currentTime);
      oscillator.stop(audioContext!.currentTime + duration);

      setTimeout(() => {
        console.log('Beep completed at', frequency, 'Hz');
        resolve();
      }, duration * 1000 + 50);
    } catch (error) {
      console.error('Error playing beep:', error);
      resolve();
    }
  });
};

const createNotificationAudio = (): HTMLAudioElement => {
  if (audioElement) return audioElement;

  const audio = new Audio();

  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const oscillator1 = audioContext.createOscillator();
  const oscillator2 = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  const offlineContext = new OfflineAudioContext(1, audioContext.sampleRate * 2, audioContext.sampleRate);
  const offlineOscillator1 = offlineContext.createOscillator();
  const offlineOscillator2 = offlineContext.createOscillator();
  const offlineGain = offlineContext.createGain();

  offlineOscillator1.frequency.value = 800;
  offlineOscillator1.type = 'sine';
  offlineOscillator2.frequency.value = 1200;
  offlineOscillator2.type = 'sine';

  offlineOscillator1.connect(offlineGain);
  offlineOscillator2.connect(offlineGain);
  offlineGain.connect(offlineContext.destination);

  offlineGain.gain.setValueAtTime(0.8, 0);
  offlineGain.gain.exponentialRampToValueAtTime(0.01, 2);

  offlineOscillator1.start(0);
  offlineOscillator2.start(0);
  offlineOscillator1.stop(2);
  offlineOscillator2.stop(2);

  offlineContext.startRendering().then(audioBuffer => {
    const blob = audioBufferToWav(audioBuffer);
    const url = URL.createObjectURL(blob);
    audio.src = url;
  });

  audioElement = audio;
  return audio;
};

const audioBufferToWav = (audioBuffer: AudioBuffer): Blob => {
  const numberOfChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const format = 1;
  const bitDepth = 16;

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numberOfChannels * bytesPerSample;

  const channelData = [];
  for (let i = 0; i < numberOfChannels; i++) {
    channelData.push(audioBuffer.getChannelData(i));
  }

  const interleaved = new Float32Array(audioBuffer.length * numberOfChannels);
  let index = 0;
  const volume = 0.8;
  for (let i = 0; i < audioBuffer.length; i++) {
    for (let j = 0; j < numberOfChannels; j++) {
      interleaved[index++] = channelData[j][i] * volume;
    }
  }

  const dataLength = audioBuffer.length * numberOfChannels * 2;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);

  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(36, 'data');
  view.setUint32(40, dataLength, true);

  let offset = 44;
  const volume_constant = 0.8;
  for (let i = 0; i < interleaved.length; i++, offset += 2) {
    const sample = Math.max(-1, Math.min(1, interleaved[i]));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
  }

  return new Blob([buffer], { type: 'audio/wav' });
};

export const playNotificationSound = async () => {
  if (isPlaying) {
    console.log('Sound already playing, ignoring request');
    return;
  }

  try {
    console.log('Starting notification sound...');
    await initAudioContext();

    isPlaying = true;

    const playTripleBeep = async () => {
      if (!isPlaying) return;

      console.log('Playing triple beep sequence...');

      await playBeep(800, 0.2);
      if (!isPlaying) return;

      await new Promise(resolve => setTimeout(resolve, 150));

      await playBeep(1000, 0.2);
      if (!isPlaying) return;

      await new Promise(resolve => setTimeout(resolve, 150));

      await playBeep(1200, 0.2);
      console.log('Triple beep sequence completed');
    };

    await playTripleBeep();

    intervalId = window.setInterval(() => {
      if (isPlaying) {
        playTripleBeep().catch(err => console.error('Error in interval beep:', err));
      }
    }, 3000);
  } catch (error) {
    console.error('Error playing notification sound:', error);
    isPlaying = false;
  }
};

export const stopNotificationSound = () => {
  isPlaying = false;

  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
};

export const isNotificationPlaying = () => isPlaying;
