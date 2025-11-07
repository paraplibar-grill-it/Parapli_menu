let audioContext: AudioContext | null = null;
let isPlaying = false;
let intervalId: number | null = null;

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

const playBeep = async () => {
  if (!audioContext) {
    await initAudioContext();
  }

  if (!audioContext) {
    console.error('AudioContext not available for beep');
    return;
  }

  try {
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

    console.log('Beep played');
  } catch (error) {
    console.error('Error playing beep:', error);
  }
};

export const playNotificationSound = async () => {
  if (isPlaying) {
    console.log('Sound already playing, ignoring request');
    return;
  }

  try {
    console.log('Initializing audio context before playing sound...');
    await initAudioContext();

    if (!audioContext) {
      console.error('AudioContext failed to initialize');
      return;
    }

    console.log('Starting notification sound...');
    isPlaying = true;

    const playTripleBeep = async () => {
      if (!isPlaying) return;

      console.log('Playing triple beep...');
      await playBeep();

      await new Promise(resolve => setTimeout(resolve, 200));

      if (!isPlaying) return;
      await playBeep();

      await new Promise(resolve => setTimeout(resolve, 200));

      if (!isPlaying) return;
      await playBeep();
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
