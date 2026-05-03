// Firebase Cloud Messaging service worker
// Handles background push notifications

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:            self.FIREBASE_API_KEY            || 'YOUR_API_KEY',
  authDomain:        self.FIREBASE_AUTH_DOMAIN        || 'YOUR_AUTH_DOMAIN',
  projectId:         self.FIREBASE_PROJECT_ID         || 'YOUR_PROJECT_ID',
  storageBucket:     self.FIREBASE_STORAGE_BUCKET     || 'YOUR_STORAGE_BUCKET',
  messagingSenderId: self.FIREBASE_MESSAGING_SENDER_ID|| 'YOUR_SENDER_ID',
  appId:             self.FIREBASE_APP_ID             || 'YOUR_APP_ID',
});

const messaging = firebase.messaging();

// Background message handler
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background message:', payload);

  const { title, body, icon } = payload.notification || {};
  const data                  = payload.data || {};

  self.registration.showNotification(title || 'StudySync', {
    body:    body    || 'You have a new notification.',
    icon:    icon    || '/icons/logo-192.png',
    badge:   '/icons/badge-72.png',
    data,
    actions: [
      { action: 'open',    title: 'Open'    },
      { action: 'dismiss', title: 'Dismiss' },
    ],
    requireInteraction: data.priority === 'high',
  });
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const link = event.notification.data?.link || '/dashboard';
  const url  = new URL(link, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const existing = list.find((c) => c.url === url && 'focus' in c);
      if (existing) return existing.focus();
      return clients.openWindow(url);
    })
  );
});