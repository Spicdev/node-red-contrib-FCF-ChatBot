var express = require("express");
var request = require("request");
var bodyParser = require("body-parser");
module.exports = function (RED) {

    function PushService(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.URL = config.URL;
        var msg = {};

        var app = express();
        app.use(bodyParser.json());
        app.post(node.URL, function (req, res) {
            res.sendStatus(200);

            msg.userID = req.body.UserID
            msg.payload = req.body.Message;
            node.send(msg);

            //console.log(msg);

        });
        app.listen(1881);


    }

    RED.nodes.registerType('FCF-PushService', PushService);
};