$ = document.querySelector.bind(document);

function error(str) {
    str = "Error: " + str;
    $('#error').textContent = str;
    $('#error').style.display = 'block';
    console.error(str);
}

if (!navigator.serviceWorker) {
    error("Your browser doesn't support Service Workers.");
} else {
    $('#subscribe > button').disabled = false;
    navigator.serviceWorker.register('sw.js').catch(function(reason) {
        $('#subscribe > button').disabled = true;
        error("Failed to register Service Worker: " + reason);
    });
}
