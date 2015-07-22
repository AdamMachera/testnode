var assert = require('assert');
var base64url = require('base64-url');
var bodyParser = require('body-parser');
var express = require('express');
var request = require('request');
var util = require('util')
var webpush = require('node-web-push');

assert(process.env.GCM_API_KEY, "GCM_API_KEY environment variable not found");
assert(process.env.GCM_SENDER_ID, "GCM_SENDER_ID environment variable not found");

var app = express();

var jsonParser = bodyParser.json();

// Force SSL except when running on localhost.
var localhostRegex = /^(127\.[\d.]+|\[[0:]+1\]|localhost)$/i;
app.use(function(req, res, next) {
    if (req.header('X-Forwarded-Proto') !== 'https' &&
            !localhostRegex.test(req.hostname)) {
        return res.redirect(['https://', req.header('Host'), req.url].join(''));
    }
    return next();
});

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

app.get('/manifest.json', function(req, res) {
    res.send({
        'gcm_sender_id': process.env.GCM_SENDER_ID
    });
});

function prepareWebpushRequest(req, res) {
    if (!req.body) {
        res.sendStatus(400);
        return false;
    }
    for (var prop of ['endpoint', 'curve25519dh', 'title', 'body']) {
        if (!req.body.hasOwnProperty(prop)) {
            res.status(400).send("Missing " + prop);
            return false;
        }
    }
    var curve25519dh = new Buffer(req.body.curve25519dh, 'base64');
    if (curve25519dh.length != 32) {
        res.status(400).send("Invalid curve25519dh");
        return false;
    }
    var encrypted = webpush.encrypt({
        peerPublic: curve25519dh,
        plaintext: new Buffer(JSON.stringify({
            title: req.body.title,
            body: req.body.body
        }), 'utf8')
    });
    // HACK: Chrome currently gives us the wrong endpoint for webpush.
    GCM_WEBPUSH_PREFIX = 'https://jmt17.google.com/gcm/demo-webpush-00/';
    var endpoint = req.body.endpoint.replace(
            'https://android.googleapis.com/gcm/send/', GCM_WEBPUSH_PREFIX);
    var requestOptions = {
        url: endpoint,
        headers: {
            'Encryption': util.format('salt="%s"; rs=%s',
                                      base64url.encode(encrypted.salt),
                                      encrypted.rs),
            'Encryption-Key': util.format('dh="%s"',
                                          base64url.encode(
                                                  encrypted.localPublic)),
        },
        body: encrypted.ciphertext
    };
    // Google Cloud Messaging requires proof that the sender is authorized to
    // use the endpoint (i.e. that they hold the secret API key that corresponds
    // to the Sender ID given when subscribing on the client).
    if (endpoint.indexOf(GCM_WEBPUSH_PREFIX) === 0) {
        requestOptions.headers.Authorization = 'key=' + process.env.GCM_API_KEY;
    }
    return requestOptions;
}

app.post('/send', jsonParser, function(req, res) {
    var requestOptions = prepareWebpushRequest(req, res);
    if (!requestOptions)
        return;
    request.post(requestOptions, function(error, response, body) {
        if (!error && 200 <= response.statusCode && response.statusCode < 300) {
            res.sendStatus(202);
        } else if (body && body.indexOf('InvalidTokenFormat') !== -1) {
            res.status(400).send("Invalid endpoint. Chrome users might need " +
                                 "the flag --gcm-registration-url=" +
                                 "https://jmt17.google.com/c2dm/register3");
        } else {
            res.status(500).send(util.format(error, response, body));
        }
    });
});

app.post('/curl', jsonParser, function(req, res) {
    var requestOptions = prepareWebpushRequest(req, res);
    if (!requestOptions)
        return;
    var cmd = util.format("PAYLOAD=$(echo '%s' | base64 --decode);\ncurl",
                          requestOptions.body.toString('base64'));
    Object.keys(requestOptions.headers).sort().forEach(function(headerName) {
        cmd += util.format(" -H '%s: %s'",
                           headerName, requestOptions.headers[headerName]);
    });
    cmd += util.format(" --data-binary \"$PAYLOAD\" %s", requestOptions.url);
    res.send(cmd);
});

app.listen(app.get('port'), function() {
    console.log("Node server is running on port", app.get('port'));
});
