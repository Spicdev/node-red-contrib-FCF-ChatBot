var express = require("express");
var request = require("request");
var bodyParser = require("body-parser");

module.exports = function(RED) {
    //可參考這裡http://bit.ly/2u0eSD4的21-httpin.js程式
    function PushService(config) {

        RED.nodes.createNode(this, config);
        var node = this;
        var msg = {};
        node.URL = config.URL;
        var app = express();

        app.use(bodyParser.json());
        app.post(node.URL, function(req, res) {
            res.sendStatus(200);
            msg.userID = req.body.UserID;
            msg.payload = req.body.Message;
            node.send(msg);
        });
        app.listen(1881); //因此方法會再創一個1881的server，因此重新部署的時候會crash
    } //這支程式很重要，是從外部呼叫觸發nodered來做後續處理
    RED.nodes.registerType('FCF-PushService', PushService);
};