var request = require("request");
module.exports = function (RED) {
    function uiOut(config) {

        RED.nodes.createNode(this, config);
        var node = this;
        node.webhookConfig = RED.nodes.getNode(config.webhookConfig);

        this.on("input", function (msg) {

            var headers = {
                "Content-Type": "application/json;charset=utf-8"
            };

            var options = {
                url: `https://graph.facebook.com/v2.6/me/messages?access_token=${node.webhookConfig.credentials.pageAccessToken}`,
                method: "POST",
                headers: headers,
                body: JSON.stringify({
                    "recipient": {
                        "id": msg.payload.chatId
                    },
                    "message": {
                        "text": msg.payload.content
                    }
                })
            };

            request(options, function (error, response, body) {
                if (error) {
                    console.log(error);
                }
            });
            // if (config.track) {
            //     msg.originalMessage = {
            //         transport: "facebook",
            //         chat: {
            //             id: msg.payload.chatId
            //         }
            //     };
            //     node.send(msg);
            // }
        });
    }
    RED.nodes.registerType("UI-Out", uiOut);
};