self.addEventListener('notificationclick', event => {

  const notification = event.notification;
  const action = event.action;

  if (action === 'close') {
    notification.close();
  } else {
    clients.openWindow('/');
    notification.close();
  }
});


self.addEventListener('push', event => {
  const options = {
    body: event.data.text(),
    icon: 'images/logo.png',
    vibrate: [100, 50, 100],
    actions: [
      { action: 'explore', title: 'Go to the site' },
      { action: 'close', title: 'Close the notification' },
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Easy Plant Tree', options)
  );
});