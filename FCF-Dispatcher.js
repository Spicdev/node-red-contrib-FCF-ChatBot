var request = require("request");
module.exports = function (RED) {

    function Dispatcher(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.token = config.token;
        node.rules = config.rules;

        this.on('input', function (msg) {


            var rules = node.rules;
            var token = encodeURIComponent(node.token);
            var output = [];
            var matched = false;
            var action;
            console.log(msg.payload.content);

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
            }, function (error, response, body) {
                var action = JSON.parse(body);
                console.log(action);
                rules.forEach(function (rule) {
                    if ((action.result.action).toString() == (rule.topic).toString()) {
                        matched = true;
                        if ((action.result.action).toString() == "input.unknown")
                            msg.payload = action.result.fulfillment.speech;
                        output.push(msg);
                    } else {
                        output.push(null);
                    }
                });
                node.send(output);

            });


        });
    }

    RED.nodes.registerType('FCF-Dispatcher', Dispatcher);
};