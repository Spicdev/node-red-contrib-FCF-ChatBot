/**
 * Copyright JS Foundation and other contributors, http://js.foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

module.exports = function (RED) {
    "use strict";
    var bodyParser = require("body-parser");
    var multer = require("multer");
    var cookieParser = require("cookie-parser");
    var getBody = require("raw-body");
    var cors = require("cors");
    var jsonParser = bodyParser.json();
    var urlencParser = bodyParser.urlencoded({ extended: true });
    var onHeaders = require("on-headers");
    var typer = require("media-typer");
    var isUtf8 = require("is-utf8");
    var hashSum = require("hash-sum");

    function rawBodyParser(req, res, next) {
        if (req.skipRawBodyParser) { next(); } // don"t parse this if told to skip
        if (req._body) {
            return next();
        }
        req.body = "";
        req._body = true;

        var isText = true;
        var checkUTF = false;

        if (req.headers["content-type"]) {
            var parsedType = typer.parse(req.headers["content-type"]);
            if (parsedType.type === "text") {
                isText = true;
            } else if (parsedType.subtype === "xml" || parsedType.suffix === "xml") {
                isText = true;
            } else if (parsedType.type !== "application") {
                isText = false;
            } else if (parsedType.subtype !== "octet-stream") {
                checkUTF = true;
            } else {
                // applicatino/octet-stream
                isText = false;
            }
        }

        getBody(req, {
            length: req.headers["content-length"],
            encoding: isText ? "utf8" : null
        }, function (err, buf) {
            if (err) {
                return next(err);
            }
            if (!isText && checkUTF && isUtf8(buf)) {
                buf = buf.toString();
            }
            req.body = buf;
            next();
        });
    }

    function createResponseWrapper(node, res) {
        var wrapper = {
            _res: res
        };
        var toWrap = [
            "append",
            "attachment",
            "cookie",
            "clearCookie",
            "download",
            "end",
            "format",
            "get",
            "json",
            "jsonp",
            "links",
            "location",
            "redirect",
            "render",
            "send",
            "sendfile",
            "sendFile",
            "sendStatus",
            "set",
            "status",
            "type",
            "vary"
        ];
        toWrap.forEach(function (f) {
            wrapper[f] = function () {
                node.warn(RED._("uiIn.errors.deprecated-call", {
                    method: "msg.res." + f
                }));
                var result = res[f].apply(res, arguments);
                if (result === res) {
                    return wrapper;
                } else {
                    return result;
                }
            };
        });
        return wrapper;
    }

    var corsHandler = function (req, res, next) {
        next();
    };

    if (RED.settings.httpNodeCors) {
        corsHandler = cors(RED.settings.httpNodeCors);
        RED.httpNode.options("*", corsHandler);
    }

    function uiIn(n) {
        RED.nodes.createNode(this, n);
        if (RED.settings.httpNodeRoot !== false) {

            this.method = n.method;

            var node = this;
            node.webhookConfig = RED.nodes.getNode(n.webhookConfig);

            this.errorHandler = function (err, req, res, next) {
                node.warn(err);
                res.sendStatus(500);
            };

            this.callback = function (req, res) {
                let msgid = RED.util.generateId();
                res._msgid = msgid;
                let mode = req.query["hub.mode"];
                let token = req.query["hub.verify_token"];
                let challenge = req.query["hub.challenge"];
                if (mode && token) {
                    if (mode === "subscribe" && token === node.webhookConfig.credentials.verifyToken) {
                        console.log("challenge:" + challenge);
                        res.status(200).send(challenge);
                    }
                }
            };

            var postCallback = function (req, res, next) {
                let msgid = RED.util.generateId();
                res._msgid = msgid;
                let body = req.body;
                if (body.object === "page") {
                    body.entry.forEach(function (entry) {
                        let webhook_event = entry.messaging[0];
                        console.log(webhook_event);
                        let sender_psid = webhook_event.sender.id;
                        console.log("Sender PSID: " + sender_psid);
                        if (webhook_event.message) {
                            console.log("webhook_event.message: " + webhook_event.message);
                        }
                    });
                    res.status(200).send("EVENT_RECEIVED");
                } else {
                    res.sendStatus(404);
                }
                next();
            };

            var httpMiddleware = function (req, res, next) {
                next();
            };

            if (RED.settings.httpNodeMiddleware) {
                if (typeof RED.settings.httpNodeMiddleware === "function") {
                    httpMiddleware = RED.settings.httpNodeMiddleware;
                }
            }

            var metricsHandler = function (req, res, next) {
                next();
            };

            if (this.metric()) {
                console.log("metric");
                metricsHandler = function (req, res, next) {
                    var startAt = process.hrtime();
                    onHeaders(res, function () {
                        if (res._msgid) {
                            var diff = process.hrtime(startAt);
                            var ms = diff[0] * 1e3 + diff[1] * 1e-6;
                            var metricResponseTime = ms.toFixed(3);
                            var metricContentLength = res._headers["content-length"];
                            //assuming that _id has been set for res._metrics in uiOut node!
                            node.metric("response.time.millis", { _msgid: res._msgid }, metricResponseTime);
                            node.metric("response.content-length.bytes", { _msgid: res._msgid }, metricContentLength);
                        }
                    });
                    next();
                };
            }

            RED.httpNode.get("/webhook", cookieParser(), httpMiddleware, corsHandler, metricsHandler, this.callback, this.errorHandler);
            RED.httpNode.post("/webhook", cookieParser(), httpMiddleware, corsHandler, metricsHandler, jsonParser, urlencParser, rawBodyParser, postCallback, this.errorHandler);

            this.on("close", function () {
                var node = this;
                RED.httpNode._router.stack.forEach(function (route, i, routes) {
                    if (route.route && route.route.path === node.url && route.route.methods[node.method]) {
                        routes.splice(i, 1);
                    }
                });
            });
        } else {
            this.warn(RED._("uiIn.errors.not-created"));
        }
    }
    RED.nodes.registerType("UI-In", uiIn);
};