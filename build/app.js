"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var axios_1 = __importDefault(require("axios"));
var app = express();
var DataPost = /** @class */ (function () {
    function DataPost() {
    }
    DataPost.postFromMap = function (posts) {
        return posts.map(function (post) {
            return {
                id: post['id'],
                title: post['title']['rendered'],
                media_image: (post['media_image'] ? post['media_image'] : "Vazio"),
                date: post['date'],
                content: post['content']['rendered'],
                description: post['excerpt']['rendered'],
                category: 'Geral',
                link: post['guid']['rendered'],
                origin: 'Imperatriz Notícias',
                autor: 'Indefinido'
            };
        }).filter(function (post) {
            if (post.content != "") {
                post.title = post.title.replace(/&#8221;/g, '”').replace(/&#8220;/g, '“');
                return post;
            }
        });
    };
    DataPost.parseJSON = function (text) {
        var aux = text.replace(/\ufeff/g, '');
        return JSON.parse(aux);
    };
    DataPost.getPromiseArrayUriImg = function (posts) {
        var postsFilter = posts.filter(function (post) {
            if (post && post['_links'] && post['_links']['wp:featuredmedia']
                && post['_links']['wp:featuredmedia'][0]
                && post['_links']['wp:featuredmedia'][0]['href']) {
                return post;
            }
        });
        var postsAxios = postsFilter.map(function (post) {
            var uriMediaImage = post['_links']['wp:featuredmedia'][0]['href'];
            return axios_1.default.get(uriMediaImage);
        });
        return { postsFilter: postsFilter, postsAxios: postsAxios };
    };
    DataPost.executeAllRequests = function (requests, posts) {
        return new Promise(function (resolve, reject) {
            axios_1.default.all(requests).then(function (dataMedia) {
                var postPopulate = dataMedia.map(function (media) {
                    var mediaDetail = DataPost.parseJSON(media.data);
                    return mediaDetail;
                }).map(function (mediaDetails, index) {
                    var mediaDetail = {
                        title: mediaDetails['title']['rendered'],
                        sizes: mediaDetails['media_details']['sizes']
                    };
                    posts[index]['media_image'] = mediaDetail;
                    return posts[index];
                });
                resolve(postPopulate);
            }).catch(function (error) {
                reject({});
            });
        });
    };
    return DataPost;
}());
var getHome = function (req, res) {
    var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    res.json({
        self: fullUrl,
        posts: {
            posts: {
                url: fullUrl + "posts",
                description: "Retorna as 10 últimas notícias."
            },
            posts_params: [
                {
                    url: fullUrl + "posts?search=futebol",
                    description: "Retorna até as 10 últimas notícias com o termo pesquisado."
                },
                {
                    url: fullUrl + "posts?per_page=5",
                    description: "Retorna as 5 (quantidade informada) últimas notícias. O padrão é 10."
                },
                {
                    url: fullUrl + "posts?page=5",
                    description: "Retorna a paginação de notícias informada."
                },
                {
                    url: fullUrl + "posts?categories=40",
                    description: "Retorna até as 10 últimas notícias da categoria informada."
                }
            ],
        },
        posts_recents: {
            url: fullUrl + "posts/recents",
            description: "Retorna as 5 últimas notícias."
        },
    });
};
var getPosts = function (req, res) {
    var uri = [];
    if (req.query.categories)
        uri.push("categories=" + req.query.categories);
    if (req.query.search)
        uri.push("search=" + req.query.search);
    if (req.query.per_page)
        uri.push("per_page=" + req.query.per_page);
    if (req.query.page)
        uri.push("page=" + req.query.page);
    var params = uri.join('&');
    axios_1.default.get("https://imperatriznoticias.ufma.br/wp-json/wp/v2/posts?" + params)
        .then(function (result) { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
        return [2 /*return*/, resultSucess(res, result)];
    }); }); })
        .catch(function (error) { return resultError(res, error); });
};
var getPostsRecents = function (req, res) {
    axios_1.default.get('https://imperatriznoticias.ufma.br/wp-json/wp/v2/posts?per_page=5')
        .then(function (result) { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
        return [2 /*return*/, resultSucess(res, result)];
    }); }); })
        .catch(function (error) { return resultError(res, error); });
};
var resultSucess = function (response, result) { return __awaiter(_this, void 0, void 0, function () {
    var posts, promiseArray, postsConstruct, msg_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                posts = DataPost.parseJSON(result.data);
                promiseArray = DataPost.getPromiseArrayUriImg(posts);
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, DataPost.executeAllRequests(promiseArray.postsAxios, promiseArray.postsFilter)];
            case 2:
                postsConstruct = _a.sent();
                response.json(DataPost.postFromMap(postsConstruct));
                return [3 /*break*/, 4];
            case 3:
                msg_1 = _a.sent();
                console.log(msg_1);
                response.json(DataPost.postFromMap(posts));
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
var resultError = function (response, error) {
    console.log(error);
    response.sendStatus(500);
};
// ----------------------------------------------------------------- //
// Routers
app.get('/', getHome);
app.get('/posts', getPosts);
app.get('/posts/recents', getPostsRecents);
// ----------------------------------------------------------------- //
// Server Config
var port = process.env.PORT || 3000;
app.listen(port, function () {
    console.log('Server running at http://127.0.0.1:' + port + '/');
});
