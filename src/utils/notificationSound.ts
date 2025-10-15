let audioContext: AudioContext | null = null;
let oscillator: OscillatorNode | null = null;
let gainNode: GainNode | null = null;
let isPlaying = false;

export const initAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
};

export const playNotificationSound = () => {
  if (isPlaying) return;

  initAudioContext();
  if (!audioContext) return;

  isPlaying = true;

  const beep = () => {
    oscillator = audioContext!.createOscillator();
    gainNode = audioContext!.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext!.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext!.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext!.currentTime + 0.5);

    oscillator.start(audioContext!.currentTime);
    oscillator.stop(audioContext!.currentTime + 0.5);
  };

  const playSequence = () => {
    beep();
    setTimeout(() => {
      beep();
      setTimeout(() => {
        beep();
        setTimeout(() => {
          if (isPlaying) {
            setTimeout(playSequence, 2000);
          }
        }, 200);
      }, 200);
    }, 200);
  };

  playSequence();
};

export const stopNotificationSound = () => {
  isPlaying = false;
  if (oscillator) {
    try {
      oscillator.stop();
      oscillator.disconnect();
    } catch (e) {
      // Oscillator already stopped
    }
    oscillator = null;
  }
  if (gainNode) {
    gainNode.disconnect();
    gainNode = null;
  }
};

export const isNotificationPlaying = () => isPlaying;
