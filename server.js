var assert = require('assert');
var bodyParser = require('body-parser');
var express = require('express');

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
    // TODO: Send a push message to endpoint.
    res.sendStatus(202);
});

app.listen(app.get('port'), function() {
    console.log("Node server is running on port", app.get('port'));
});
