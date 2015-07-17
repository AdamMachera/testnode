"use strict";

this.addEventListener("install", function(evt) {
    console.log("SW oninstall");
});

this.addEventListener("activate", function(evt) {
    console.log("SW onactivate");
    if (clients.claim)
        evt.waitUntil(clients.claim());
});

this.addEventListener('push', function(evt) {
    var data = evt.data.json();
    console.log("SW onpush", data);
    evt.waitUntil(self.registration.showNotification(data.title, {
        body: data.body
    }));
});

this.addEventListener('notificationclick', function(evt) {
    console.log("SW notificationclick");
    evt.notification.close();
    evt.waitUntil(clients.openWindow("/"));
});

console.log('Logged from inside SW');
