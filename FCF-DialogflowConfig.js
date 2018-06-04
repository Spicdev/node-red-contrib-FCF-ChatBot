module.exports = function (RED) {
    function DialogflowConfig(config) {
        RED.nodes.createNode(this, config);
    }
    RED.nodes.registerType("FCF-DialogflowConfig", DialogflowConfig, {
        credentials: {
            projectID: {
                type: "text"
            },
            email: {
                type: "text"
            },
            privateKey: {
                type: "text"
            }
        }
    });
};
