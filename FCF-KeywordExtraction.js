/**
 * Dialogflow API的scope https://developers.google.com/identity/protocols/googlescopes#dialogflowv2
 * gtoken模組的Github https://github.com/google/node-gtoken
 * googleapis模組的npm https://www.npmjs.com/package/googleapis#service-to-service-authentication
 * 私鑰跳脫字元的問題 https://www.extreg.com/blog/2017/12/gcs-service-account-private-key-not-working-env/
 */
var request = require("request");
var crypto = require("crypto"); //引用可以產生亂數字串的模組
const { GoogleToken } = require("gtoken");

module.exports = function (RED) {
    function KeywordExtraction(config) {

        RED.nodes.createNode(this, config);
        var node = this;
        node.email = config.email;
        node.privateKey = config.privateKey;

        this.on("input", function (msg) {

            var buf = crypto.randomBytes(25); //產生一個30byte的亂數資料，來當作請求網址的session ID

            const gtoken = new GoogleToken({
                email: node.email,
                scope: ["https://www.googleapis.com/auth/cloud-platform"], // or space-delimited string of scopes
                key: node.privateKey.replace(/\\n/g, "\n")
            });

            var sendRequest = function (token) {

                var headers = {
                    "Content-Type": "application/json;charset=utf-8",
                    "Authorization": "Bearer " + token,
                }

                var options = {
                    url: `https://dialogflow.googleapis.com/v2/projects/parkingbot-c50be/agent/sessions/${buf.toString("hex")}:detectIntent`,
                    method: "POST",
                    headers: headers,
                    body: JSON.stringify({
                        "queryInput": {
                            "text": {
                                "text": msg.payload.content,
                                "languageCode": "zh-TW"
                            }
                        }
                    })
                }

                request(options, function (error, response, body) {
                    var body = JSON.parse(body);
                    msg.payload.keyword = body.queryResult.parameters;
                    node.send(msg);
                });
            }

            var gt = function () {
                gtoken.getToken().then(function (token) {
                    return sendRequest(token);
                }).catch(function (error) {
                    console.log(error)
                });
            }
            gt();
        });
    }
    RED.nodes.registerType("FCF-KeywordExtraction", KeywordExtraction);
};