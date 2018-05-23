var request = require("request");

module.exports = function(RED) {
    function DataCollection(config) {

        RED.nodes.createNode(this, config);
        var node = this;
        var context = this.context();
        node.rules = config.rules;
        node.collect = config.collect;

        this.on('input', function(msg) {

            var rules = node.rules;
            var collect = node.collect;
            var output = [];

            if (collect == "query")
                if (context.get("dataCount") == null) {

                    rules.reverse();
                    context.set("dataCount", rules.length - 1);

                    output[0] = msg;
                    output[1] = null;

                    var query = {};
                    context.set("query", query);

                    msg.payload = rules[context.get("dataCount")].topic;
                    context.set("dataCount", context.get("dataCount") - 1);
                    node.send(output);
                }
                else if (context.get("dataCount") > -1) {
                    output[0] = msg;
                    output[1] = null;
                    var query = context.get("query");
                    query[rules[context.get("dataCount") + 1].topic2] = msg.payload.content;
                    context.set("query", query);

                    msg.payload = rules[context.get("dataCount")].topic;
                    context.set("dataCount", context.get("dataCount") - 1);
                    node.send(output);
                }
            else {
                output[0] = null;
                output[1] = msg;
                var query = context.get("query");
                query[rules[context.get("dataCount") + 1].topic2] = msg.payload.content;
                context.set("query", query);
                msg.query = context.get("query");
                context.set("dataCount", null);
                node.send(output);
            }

            if (collect == "userData")
                if (context.get("dataCount") == null) {

                    rules.reverse();
                    context.set("dataCount", rules.length - 1);

                    output[0] = msg;
                    output[1] = null;

                    var userData = {};
                    userData.UserID = msg.payload.chatId;
                    context.set("userData", userData);

                    msg.payload = rules[context.get("dataCount")].topic;
                    context.set("dataCount", context.get("dataCount") - 1);
                    node.send(output);
                }
                else if (context.get("dataCount") > -1) {
                    output[0] = msg;
                    output[1] = null;
                    var userData = context.get("userData");
                    userData[rules[context.get("dataCount") + 1].topic2] = msg.payload.content;
                    context.set("userData", userData);

                    msg.payload = rules[context.get("dataCount")].topic;
                    context.set("dataCount", context.get("dataCount") - 1);

                    node.send(output);
                }
            else {
                output[0] = null;
                output[1] = msg;
                var userData = context.get("userData");
                userData[rules[context.get("dataCount") + 1].topic2] = msg.payload.content;
                context.set("userData", userData);
                msg.userData = context.get("userData");
                context.set("dataCount", null);
                node.send(output);
            }
        });
    }
    RED.nodes.registerType('FCF-DataCollection', DataCollection);
};