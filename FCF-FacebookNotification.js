var request = require("request");

module.exports = function(RED) {

    function FacebookNotification(config) {

        RED.nodes.createNode(this, config);
        var node = this;
        node.token = config.token;
        var context = this.context().flow;

        this.on('input', function(msg) {
            request({
                    uri: 'https://graph.facebook.com/v2.6/me/messages?access_token=' + node.token,
                    method: 'POST',
                    json: {
                        "recipient": {
                            "id": msg.userID
                        },
                        "message": {
                            "text": msg.payload
                        }
                    }
                },
                function(error, response, body) {
                    console.log(msg);
                }
            );
        });
    }

    RED.nodes.registerType('FCF-FacebookNotification', FacebookNotification);
};