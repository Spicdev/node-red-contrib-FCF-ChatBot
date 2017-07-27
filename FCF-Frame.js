module.exports = function (RED) {//把所有資料存起來，並作格式化，以便傳給其他服務

    function Frame(config) {
        RED.nodes.createNode(this, config);

        var node = this;
        var context = this.context().flow;//context起手式，http://bit.ly/2u8Sysx
        node.name = config.name;//config.name是自己取的這個Frame的名稱

        this.on('input', function (msg) {
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












            console.log("Frame：msg.query=");
            console.log(msg.query);


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

            console.log(msg.frame);
            node.send(msg);

        });
    }

    RED.nodes.registerType('FCF-Frame', Frame);
};