var request = require("request");

module.exports = function (RED) {
    function PullService(config) {

        RED.nodes.createNode(this, config);
        var node = this;
        node.URL = config.URL;

        this.on("input", function (msg) {
            console.log(JSON.stringify(msg.frame));
            request({
                uri: node.URL,
                method: "POST",
                followAllRedirects: true,
                body: JSON.stringify(msg.frame)
            }, function (error, response, body) {
                var result = JSON.parse(body);
                msg.result = result.Result;
                msg.payload = result.Message;
                node.send(msg);
            });
        });
    }
    RED.nodes.registerType("FCF-PullService", PullService);
};