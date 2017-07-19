var request = require("request");//會去找node_module
module.exports = function (RED) {

    function Dispatcher(config) {//這裡開始會把使用者的query送到api.ai做intent判斷，我們根據intent的action來做處理
        RED.nodes.createNode(this, config);
        var node = this;
        node.token = config.token;
        node.rules = config.rules;
        //官方的寫法是node.on(.........
        this.on('input', function (msg) {
            var rules = node.rules;
            var token = encodeURIComponent(node.token);
            var output = [];
            var matched = false;
            var action;
            console.log("使用者的query="+msg.payload.content);//msg.payload.content是使用者輸入的語句，如：我想去香米湯湯
            request({// request  node.js才有的東西
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
            }, function (error, response, body) {//最好要去做error例外處理，要去看error是不是200，其他400就要去另外處理
                var action = JSON.parse(body);//body是api.ai回應的body？
                console.log("Dispatcher：API.AI回應的body=");
                console.log(action);
                rules.forEach(function (rule) {//？？？？？？？？？？
                    if ((action.result.action).toString() == (rule.topic).toString()) {//如果api.ai回傳的action與我在面板輸入的action值一樣
                        matched = true;//????
                        if ((action.result.action).toString() == "input.unknown")//？？？？
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

    RED.nodes.registerType('FCF-Dispatcher', Dispatcher);//第二個參數Dispatcher是要映射到這裡的參數名稱
};