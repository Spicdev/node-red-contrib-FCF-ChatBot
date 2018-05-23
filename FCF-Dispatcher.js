var request = require("request");

module.exports = function(RED) {
    function Dispatcher(config) {

        RED.nodes.createNode(this, config);
        var node = this;
        node.token = config.token;
        node.rules = config.rules;

        this.on("input", function(msg) {
            var rules = node.rules;
            var token = encodeURIComponent(node.token);
            var output = [];
            var matched = false;

            var headers = {
                "Content-Type": "application/json;charset=utf-8",
                "Authorization": "Bearer " + token,
            }

            var options = {
                url: "https://dialogflow.googleapis.com/v2/projects/parkingbot-c50be/agent/sessions/2gfrroqdqwvf2a2:detectIntent",
                method: "POST",
                headers: headers,
                body: JSON.stringify({
                    "queryInput": {
                        "text": {
                            "text": msg.payload.content,
                            "languageCode": "zh-TW"
                        }
                    }
                })
            }

            request(options, function(error, response, body) {
                var body = JSON.parse(body);
                var intent = body.queryResult.intent.displayName;
                rules.forEach(function(rule){
                    if(intent == (rule.topic).toString()){
                        matched = true;
                        if(intent == "Default Fallback Intent" ){
                            msg.payload = body.queryResult.queryText;
                        }
                        output.push(msg);
                    }
                    else{
                        output.push(null);
                    }
                });
                node.send(output);
            });
        });
    }
    RED.nodes.registerType("FCF-Dispatcher", Dispatcher);
};