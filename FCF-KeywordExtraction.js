var request = require("request");
module.exports = function (RED) {

    function Dispatcher(config) {//函數名稱應該改成KeywordExtraction
        RED.nodes.createNode(this, config);

        var node = this;
        var context = this.context();//Node context使用起手式，請見http://bit.ly/2u8Sysx。沒有被用到？？？
        node.token = config.token;

        this.on('input', function (msg) {
            var rules = node.rules;
            var token = encodeURIComponent(node.token);
            var output = [];
            var matched = false;//沒被用到？
            console.log("KeywordExtraction：使用者的query＝"+msg.payload.content);
            request({//再送一次？？
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
                var parameters = JSON.parse(body);//左邊取的新名稱應該也叫body
                msg.query = parameters.result.parameters;//msg.query沒有被用到？？？

                console.log("KeywordExtraction：API.AI回應的Body=");
                console.log(parameters);

                node.send(msg);

            });


        });
    }

    RED.nodes.registerType('FCF-KeywordExtraction', Dispatcher);//函數名稱應該改成KeywordExtraction
};