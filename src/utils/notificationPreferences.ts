const NOTIFICATIONS_ENABLED_KEY = 'notifications_enabled';
const SOUND_ENABLED_KEY = 'sound_enabled';

export const getNotificationsEnabled = (): boolean => {
  const stored = localStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
  return stored !== null ? stored === 'true' : true;
};

export const setNotificationsEnabled = (enabled: boolean): void => {
  localStorage.setItem(NOTIFICATIONS_ENABLED_KEY, String(enabled));
};

export const getSoundEnabled = (): boolean => {
  const stored = localStorage.getItem(SOUND_ENABLED_KEY);
  return stored !== null ? stored === 'true' : true;
};

export const setSoundEnabled = (enabled: boolean): void => {
  localStorage.setItem(SOUND_ENABLED_KEY, String(enabled));
};
