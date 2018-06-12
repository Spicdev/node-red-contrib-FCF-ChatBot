module.exports = function (RED) {
    function PushService(config) {

        RED.nodes.createNode(this, config);
        var node = this;
        var postCallback = function (req, res) {
            let msg = {
                payload: {
                    userID: req.body.UserID,
                    content: req.body.Message
                }
            };
            node.send(msg);
            res.status(200).send("200");
        };
        RED.httpNode.post(config.url, postCallback);
    }
    RED.nodes.registerType("FCF-PushService", PushService);
};