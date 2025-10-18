let audioContext: AudioContext | null = null;
let isPlaying = false;
let intervalId: number | null = null;

export const initAudioContext = async () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }
  return audioContext;
};

const playBeep = () => {
  if (!audioContext) {
    initAudioContext();
  }

  if (!audioContext) return;

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = 800;
  oscillator.type = 'sine';

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.3);
};

export const playNotificationSound = async () => {
  if (isPlaying) return;

  try {
    await initAudioContext();
    if (!audioContext) {
      console.error('AudioContext not available');
      return;
    }

    console.log('Starting notification sound...');
    isPlaying = true;

    const playTripleBeep = () => {
      if (!isPlaying) return;

      playBeep();
      setTimeout(() => {
        if (!isPlaying) return;
        playBeep();
        setTimeout(() => {
          if (!isPlaying) return;
          playBeep();
        }, 200);
      }, 200);
    };

    playTripleBeep();

    intervalId = window.setInterval(() => {
      if (isPlaying) {
        playTripleBeep();
      }
    }, 3000);
  } catch (error) {
    console.error('Error playing notification sound:', error);
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
