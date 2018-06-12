module.exports = function (RED) {
    function Frame(config) {

        RED.nodes.createNode(this, config);
        var node = this;
        var context = this.context().flow;
        node.name = config.name;

        this.on("input", function (msg) {

            var frame = {};

            if (node.name)
                var name = node.name;
            else
                var name = 1;

            if (context.get("frame") == null) {
                frame[name] = {
                    Query: {},
                    UserData: {},
                    Result: {}
                };
                context.set("frame", frame);
            }

            frame = context.get("frame");

            if (!frame[name])
                frame[name] = {
                    Query: {},
                    UserData: {},
                    Result: {}
                };

            if (msg.query != null) {
                Object.keys(msg.query).map(function (objectKey, index) {
                    var value = msg.query[objectKey];
                    frame[name].Query[objectKey] = value;
                });
            }
            if (msg.userData != null) {
                Object.keys(msg.userData).map(function (objectKey, index) {
                    var value = msg.userData[objectKey];
                    frame[name].UserData[objectKey] = value;
                });
            }
            if (msg.result != null) {
                Object.keys(msg.result).map(function (objectKey, index) {
                    var value = msg.result[objectKey];
                    frame[name].Result[objectKey] = value;
                });
            }
            context.set("frame", frame);
            msg.frame = context.get("frame")[name];
            node.send(msg);
        });
    }
    RED.nodes.registerType("FCF-Frame", Frame);
};