"use strict";

this.addEventListener("install", function(evt) {
    console.log("SW oninstall");
});

this.addEventListener("activate", function(evt) {
    console.log("SW onactivate");
    if (clients.claim)
        evt.waitUntil(clients.claim());
});

console.log('Logged from inside SW');
