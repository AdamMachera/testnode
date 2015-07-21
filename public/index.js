$ = document.querySelector.bind(document);

var pushSubscription = null;

function error(str) {
    str = "Error: " + str;
    $('#error').textContent = str;
    $('#error').style.display = 'block';
    console.error(str);
}

if (!navigator.serviceWorker) {
    error("Your browser doesn't support Service Workers.");
} else if (!window.PushManager) {
    error("Your browser doesn't support Push.");
} else if (!window.ServiceWorkerRegistration ||
           !ServiceWorkerRegistration.prototype.showNotification) {
    error("Your browser doesn't support Notifications (from Service Workers).");
} else {
    $('#subscribe > button').addEventListener('click', onClickSubscribe);
    $('#subscribe > button').disabled = false;
    navigator.serviceWorker.register('sw.js').catch(function(reason) {
        error("Failed to register Service Worker: " + reason);
        $('#subscribe > button').disabled = true; // Unrecoverable error.
    });
    lookForExistingSubscription();
}

function onClickSubscribe() {
    $('#error').style.display = 'none';
    $('#subscribe > button').disabled = true;
    Notification.requestPermission(function(permission) {
        if (permission == 'granted') {
            subscribeForPush();
            return;
        }
        error("Notifications permission prompt was " +
              permission.replace("default", "dismissed") + ".");
        $('#subscribe > button').disabled = false;
    });
}

function subscribeForPush() {
    navigator.serviceWorker.ready.then(function(swr) {
        swr.pushManager.subscribe({userVisibleOnly: true}).then(function(ps) {
            console.log("Subscribed successfully");
            setPushSubscription(ps);
        }, function(reason) {
            error("Failed to subscribe for Push: " + reason);
            $('#subscribe > button').disabled = false;
        });
    });
}

function lookForExistingSubscription() {
    if (Notification.permission != 'granted')
        return;
    navigator.serviceWorker.ready.then(function(swr) {
        swr.pushManager.getSubscription().then(function(ps) {
            if (!ps) return;
            setPushSubscription(ps);
        });
    });
}

function setPushSubscription(ps) {
    // If both subscribeForPush and lookForExistingSubscription call this,
    // ignore the second call.
    if (pushSubscription) return;
    pushSubscription = ps;
    console.log(ps);
    $('#subscribe').style.display = 'none';
    $('#send').style.display = 'block';
}

function postNotificationTo(url, callback) {
    var data = {
        endpoint: pushSubscription.endpoint,
        curve25519dh: btoa(String.fromCharCode.apply(
                null, new Uint8Array(pushSubscription.curve25519dh))),
        title: $('#notification-title').value,
        body: $('#notification-body').value
    };

    var xhr = new XMLHttpRequest();
    xhr.onload = function() {
        if (('' + xhr.status)[0] != '2') {
            error("Server error " + xhr.status + ": " + xhr.statusText);
        } else {
            callback(xhr);
        }
    };
    xhr.onerror = xhr.onabort = function() {
        error("Failed to communicate with server!");
    };
    xhr.open('POST', url);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify(data));
}

$('#send > form').addEventListener('submit', function(event) {
    event.preventDefault();
    console.log("Sending message to " + location.hostname + "...");
    $('#error').style.display = 'none';
    $('#curl').style.display = 'none';

    postNotificationTo('/send', function(xhr) {
        console.log("Sent successfully :)");
    });
});

$('#curl-button').addEventListener('click', function(event) {
    $('#error').style.display = 'none';
    $('#curl').style.display = 'none';

    postNotificationTo('/curl', function(xhr) {
        $('#curl > pre > code').textContent = xhr.responseText;
        $('#curl').style.display = 'block';
    });
});

$('button#unsubscribe').addEventListener('click', function(event) {
    if (!pushSubscription)
        return;
    pushSubscription.unsubscribe().then(function() {
        console.log("Unsubscribed successfully");
        pushSubscription = null;
        $('#send').style.display = 'none';
        $('#subscribe').style.display = 'block';
        $('#subscribe > button').disabled = false;
    });
});
