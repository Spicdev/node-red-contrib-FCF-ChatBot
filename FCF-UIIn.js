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
            var parsedType = typer.parse(req.headers["content-type"])
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
                buf = buf.toString()
            }
            req.body = buf;
            next();
        });
    }

    var corsSetup = false;

    function createRequestWrapper(node, req) {
        // This misses a bunch of properties (eg headers). Before we use this function
        // need to ensure it captures everything documented by Express and HTTP modules.
        var wrapper = {
            _req: req
        };
        var toWrap = [
            "param",
            "get",
            "is",
            "acceptsCharset",
            "acceptsLanguage",
            "app",
            "baseUrl",
            "body",
            "cookies",
            "fresh",
            "hostname",
            "ip",
            "ips",
            "originalUrl",
            "params",
            "path",
            "protocol",
            "query",
            "route",
            "secure",
            "signedCookies",
            "stale",
            "subdomains",
            "xhr",
            "socket" // TODO: tidy this up
        ];
        toWrap.forEach(function (f) {
            if (typeof req[f] === "function") {
                wrapper[f] = function () {
                    node.warn(RED._("uiIn.errors.deprecated-call", {
                        method: "msg.req." + f
                    }));
                    var result = req[f].apply(req, arguments);
                    if (result === req) {
                        return wrapper;
                    } else {
                        return result;
                    }
                }
            } else {
                wrapper[f] = req[f];
            }
        });


        return wrapper;
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
            }
        });
        return wrapper;
    }

    var corsHandler = function (req, res, next) {
        next();
    }

    if (RED.settings.httpNodeCors) {
        corsHandler = cors(RED.settings.httpNodeCors);
        RED.httpNode.options("*", corsHandler);
    }

    function uiIn(n) {
        RED.nodes.createNode(this, n);
        if (RED.settings.httpNodeRoot !== false) {

            if (!n.url) {
                this.warn(RED._("uiIn.errors.missing-path"));
                return;
            }
            this.url = n.url;
            if (this.url[0] !== "/") {
                this.url = "/" + this.url;
            }
            this.method = n.method;
            this.upload = n.upload;
            this.swaggerDoc = n.swaggerDoc;

            var node = this;

            this.errorHandler = function (err, req, res, next) {
                node.warn(err);
                res.sendStatus(500);
            };

            this.callback = function (req, res) {
                var msgid = RED.util.generateId();
                res._msgid = msgid;
                if (node.method.match(/^(post|delete|put|options|patch)$/)) {
                    node.send({
                        _msgid: msgid,
                        req: req,
                        res: createResponseWrapper(node, res),
                        payload: req.body//輸出在這
                    });
                } else if (node.method == "get") {
                    console.log(req.query["hub.challenge"]);
                    res.status(200).send(req.query["hub.challenge"]);//此行可直接回應給客戶端
                    // node.send({
                    //     _msgid: msgid,
                    //     req: req,
                    //     res: createResponseWrapper(node, res),
                    //     payload: req.query//get請求的網址的參數內容會包成query物件，會長下面這樣
                    //     /*
                    //     {
                    //         'hub.mode':'subscribe',
                    //         'hub.challenge':'1017775362',
                    //         'hub.verify_token':'123'
                    //     }
                    //     */
                    // });
                } else {
                    node.send({
                        _msgid: msgid,
                        req: req,
                        res: createResponseWrapper(node, res)
                    });
                }
            };

            var httpMiddleware = function (req, res, next) {
                next();
            }

            if (RED.settings.httpNodeMiddleware) {
                if (typeof RED.settings.httpNodeMiddleware === "function") {
                    httpMiddleware = RED.settings.httpNodeMiddleware;
                }
            }

            var metricsHandler = function (req, res, next) {
                next();
            }
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

            var multipartParser = function (req, res, next) { next(); }
            if (this.upload) {
                console.log("upload");
                var mp = multer({ storage: multer.memoryStorage() }).any();
                multipartParser = function (req, res, next) {
                    mp(req, res, function (err) {
                        req._body = true;
                        next(err);
                    })
                };
            }
            //當我預計此Node接收的請求為post或get或其他...會在Node的表單選擇post或get，是get就進到get的if，其他反之亦然，且表單每改一次他會重新部署一次
            if (this.method == "get") {
                RED.httpNode.get(this.url, cookieParser(), httpMiddleware, corsHandler, metricsHandler, this.callback, this.errorHandler);
            } else if (this.method == "post") {
                RED.httpNode.post(this.url, cookieParser(), httpMiddleware, corsHandler, metricsHandler, jsonParser, urlencParser, multipartParser, rawBodyParser, this.callback, this.errorHandler);
            } else if (this.method == "put") {
                RED.httpNode.put(this.url, cookieParser(), httpMiddleware, corsHandler, metricsHandler, jsonParser, urlencParser, rawBodyParser, this.callback, this.errorHandler);
            } else if (this.method == "patch") {
                RED.httpNode.patch(this.url, cookieParser(), httpMiddleware, corsHandler, metricsHandler, jsonParser, urlencParser, rawBodyParser, this.callback, this.errorHandler);
            } else if (this.method == "delete") {
                RED.httpNode.delete(this.url, cookieParser(), httpMiddleware, corsHandler, metricsHandler, jsonParser, urlencParser, rawBodyParser, this.callback, this.errorHandler);
            }

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

    function uiOut(n) {
        RED.nodes.createNode(this, n);
        var node = this;
        this.headers = n.headers || {};
        this.statusCode = n.statusCode;
        this.on("input", function (msg) {
            if (msg.res) {
                var headers = RED.util.cloneMessage(node.headers);//只印出空物件
                if (msg.headers) {//我用postman送請求，body放123或abc時，都沒有進來
                    if (msg.headers.hasOwnProperty("x-node-red-request-node")) {//我用postman送請求，body放123或abc時，都沒有進來
                        var headerHash = msg.headers["x-node-red-request-node"];
                        delete msg.headers["x-node-red-request-node"];
                        var hash = hashSum(msg.headers);
                        if (hash === headerHash) {//我用postman送請求，body放123或abc時，都沒有進來
                            delete msg.headers;
                        }
                    }
                    if (msg.headers) {//我用postman送請求，body放123或abc時，都沒有進來
                        for (var h in msg.headers) {
                            if (msg.headers.hasOwnProperty(h) && !headers.hasOwnProperty(h)) {
                                headers[h] = msg.headers[h];
                            }
                        }
                    }
                }
                if (Object.keys(headers).length > 0) {//我用postman送請求，body放123或abc時，都沒有進來
                    msg.res._res.set(headers);
                }
                if (msg.cookies) {//我用postman送請求，body放123或abc時，都沒有進來
                    for (var name in msg.cookies) {
                        if (msg.cookies.hasOwnProperty(name)) {
                            if (msg.cookies[name] === null || msg.cookies[name].value === null) {
                                if (msg.cookies[name] !== null) {
                                    msg.res._res.clearCookie(name, msg.cookies[name]);
                                } else {
                                    msg.res._res.clearCookie(name);
                                }
                            } else if (typeof msg.cookies[name] === "object") {
                                msg.res._res.cookie(name, msg.cookies[name].value, msg.cookies[name]);
                            } else {
                                msg.res._res.cookie(name, msg.cookies[name]);
                            }
                        }
                    }
                }
                var statusCode = node.statusCode || msg.statusCode || 200;//這三個看哪個存在就指定給左邊的變數，越左邊的越優先判斷
                if (typeof msg.payload == "object" && !Buffer.isBuffer(msg.payload)) {
                    msg.res._res.status(statusCode).jsonp(msg.payload);
                } else {
                    if (msg.res._res.get("content-length") == null) {//我用postman送請求，body放123或abc時，都會進到這個if
                        var len;
                        if (msg.payload == null) {
                            len = 0;
                        } else if (Buffer.isBuffer(msg.payload)) {
                            len = msg.payload.length;
                        } else if (typeof msg.payload == "number") {
                            len = Buffer.byteLength("" + msg.payload);
                        } else {
                            len = Buffer.byteLength(msg.payload);
                        }
                        msg.res._res.set("content-length", len);
                    }
                    if (typeof msg.payload === "number") {
                        msg.payload = "" + msg.payload;
                    }
                    msg.res._res.status(statusCode).send(msg.payload);//我用postman送請求，body放123或abc時，輸出else這裡
                }
            } else {
                node.warn(RED._("uiIn.errors.no-response"));
            }
        });
    }
    RED.nodes.registerType("UI-Out", uiOut);
}