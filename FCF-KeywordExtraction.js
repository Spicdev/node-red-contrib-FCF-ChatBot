var request = require("request");

module.exports = function(RED) {
    function KeywordExtraction(config) {

        RED.nodes.createNode(this, config);
        var node = this;
        var context = this.context();
        node.token = config.token;

        this.on('input', function(msg) {
            var rules = node.rules;
            var token = encodeURIComponent(node.token);
            var output = [];
            var matched = false;
            request({
                uri: "https://api.api.ai/v1/query?v=20150910",
                method: "POST",
                headers: {
                    "Authorization": "Bearer " + token,
                    "Content-Type": "application/json; charset=utf-8"
                },
                body: JSON.stringify({
                    "query": [
                        msg.payload.content
                    ],
                    "lang": "zh",
                    "sessionId": "1234567890"
                })
            }, function(error, response, body) {
                var parameters = JSON.parse(body);
                msg.query = parameters.result.parameters;
                node.send(msg);
            });
        });
    }
    RED.nodes.registerType('FCF-KeywordExtraction', KeywordExtraction);
};