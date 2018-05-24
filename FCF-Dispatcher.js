var request = require("request");
var crypto = require("crypto");//引用可以產生亂數字串的模組

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
            var buf = crypto.randomBytes(30);//產生一個30byte的亂數資料，來當作請求網址的session ID

            var headers = {
                "Content-Type": "application/json;charset=utf-8",
                "Authorization": "Bearer " + token,
            }

            var options = {
                url: `https://dialogflow.googleapis.com/v2/projects/parkingbot-c50be/agent/sessions/${buf.toString("base64")}:detectIntent`,
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