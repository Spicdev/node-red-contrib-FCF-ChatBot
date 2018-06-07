module.exports = function (RED) {
    function FacebookMessengerWebhookConfig(config) {
        RED.nodes.createNode(this, config);
    }
    RED.nodes.registerType("FCF-FacebookMessengerWebhookConfig", FacebookMessengerWebhookConfig, {
        credentials: {
            verifyToken: {
                type: "text"
            },
            pageAccessToken: {
                type: "text"
            }
        }
    });
};
