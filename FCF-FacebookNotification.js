var request = require("request");

module.exports = function (RED) {

    function FacebookNotification(config) {

        RED.nodes.createNode(this, config);
        var node = this;

        this.on("input", function (msg) {
            var headers = {
                "Content-Type": "application/json;charset=utf-8"
            };
            var options = {
                url: `https://graph.facebook.com/v2.6/me/messages?access_token=${node.credentials.pageAccessToken}`,
                method: "POST",
                headers: headers,
                body: JSON.stringify({
                    "recipient": {
                        "id": msg.payload.userID
                    },
                    "message": {
                        "text": msg.payload.content
                    }
                })
            };
            request(options, function (error, response, body) {
                console.log(options);
                if (error) {
                    console.log(error);
                }
            });
        });
    }
    RED.nodes.registerType("FCF-FacebookNotification", FacebookNotification, {
        credentials: {
            pageAccessToken: {
                type: "text"
            }
        }
    });
};