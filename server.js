var assert = require('assert');
var express = require('express');

assert(process.env.GCM_SENDER_ID, "GCM_SENDER_ID environment variable not found");

var app = express();

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

app.get('/manifest.json', function(req, res) {
    res.send({
        'gcm_sender_id': process.env.GCM_SENDER_ID
    });
});

app.listen(app.get('port'), function() {
    console.log("Node server is running on port", app.get('port'));
});
