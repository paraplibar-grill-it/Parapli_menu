export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    console.log('Notification permission already granted');
    return true;
  }

  if (Notification.permission === 'denied') {
    console.log('Notification permission denied');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Workers are not supported in this browser');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/',
    });
    console.log('Service Worker registered successfully:', registration);
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
};

export const sendNotification = (title: string, options: NotificationOptions = {}): Promise<void> => {
  if (!('Notification' in window)) {
    console.log('Notifications not supported');
    return Promise.resolve();
  }

  if (Notification.permission !== 'granted') {
    console.log('Notification permission not granted');
    return Promise.resolve();
  }

  try {
    const notification = new Notification(title, {
      icon: '/parapli.png',
      badge: '/parapli.png',
      ...options,
    });

    notification.addEventListener('click', () => {
      window.focus();
      notification.close();
    });

    return Promise.resolve();
  } catch (error) {
    console.error('Error sending notification:', error);
    return Promise.resolve();
  }
};

export const getNotificationStatus = (): string => {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
};
