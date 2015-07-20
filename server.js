var assert = require('assert');
var bodyParser = require('body-parser');
var express = require('express');
var request = require('request');
var util = require('util')
var webpush = require('node-web-push');

assert(process.env.GCM_API_KEY, "GCM_API_KEY environment variable not found");
assert(process.env.GCM_SENDER_ID, "GCM_SENDER_ID environment variable not found");

var app = express();

var jsonParser = bodyParser.json();

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

app.get('/manifest.json', function(req, res) {
    res.send({
        'gcm_sender_id': process.env.GCM_SENDER_ID
    });
});

app.post('/send', jsonParser, function(req, res) {
    if (!req.body) return res.sendStatus(400);
    for (var prop of ['endpoint', 'curve25519dh', 'title', 'body']) {
        if (!req.body.hasOwnProperty(prop))
            return res.status(400).send("Missing " + prop);
    }
    var encrypted = webpush.encrypt({
        peerPublic: new Buffer(req.body.curve25519dh, 'base64'),
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
                                      encrypted.salt.toString('base64'),
                                      encrypted.rs),
            'Encryption-Key': util.format('dh="%s"',
                                          encrypted.localPublic.toString(
                                                  'base64')),
        },
        body: encrypted.ciphertext
    };
    // Google Cloud Messaging requires proof that the sender is authorized to
    // use the endpoint (i.e. that they hold the secret API key that corresponds
    // to the Sender ID given when subscribing on the client).
    if (endpoint.indexOf(GCM_WEBPUSH_PREFIX) === 0) {
        requestOptions.headers.Authorization = 'key=' + process.env.GCM_API_KEY;
    }
    request.post(requestOptions, function(error, response, body) {
        if (!error && 200 <= response.statusCode && response.statusCode < 300) {
            res.sendStatus(202);
        } else {
            // TODO: This is useful for debugging, but should make sure this
            // doesn't leak sensitive data like the GCM_API_KEY to users.
            res.status(500).send(util.format(error, response, body));
        }
    });
});

app.listen(app.get('port'), function() {
    console.log("Node server is running on port", app.get('port'));
});
