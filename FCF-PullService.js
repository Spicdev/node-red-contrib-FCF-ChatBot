var request = require("request");

module.exports = function (RED) {
    function PullService(config) {

        RED.nodes.createNode(this, config);
        var node = this;
        node.URL = config.URL;

        this.on("input", function (msg) {

            var headers = {
                "Content-Type": "application/json;charset=utf-8"
            };

            var options = {
                url: node.URL,
                method: "POST",
                headers: headers,
                body: JSON.stringify(msg.frame)
            };

            request(options, function (error, response, body) {
                body = JSON.parse(body);
                msg.result = body.Result;
                msg.payload = body.Message;
                node.send(msg);
            });

        });

    }
    RED.nodes.registerType("FCF-PullService", PullService);
};