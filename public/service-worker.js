self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const options = {
      body: data.body || 'Nouvelle commande reçue',
      icon: '/parapli.png',
      badge: '/parapli.png',
      tag: 'order-notification',
      requireInteraction: true,
      vibrate: [200, 100, 200],
      actions: [
        {
          action: 'open',
          title: 'Voir la commande'
        },
        {
          action: 'close',
          title: 'Fermer'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Parapli Bar', options)
    );
  } catch (error) {
    console.error('Error handling push notification:', error);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        for (let client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/admin/orders');
        }
      })
    );
  }
});

self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed');
});
