"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
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
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var dotenv = require("dotenv");
var dropbox_v2_api_1 = require("dropbox-v2-api");
var store_1 = require("./store");
var fs_1 = require("fs");
var promises_1 = require("node:fs/promises");
var node_path_1 = require("node:path");
var authMiddleware_1 = require("./middleware/authMiddleware");
var dropbox_1 = require("dropbox");
var image_1 = require("./service/image");
dotenv.config();
var router = express_1.default.Router();
var dropbox = dropbox_v2_api_1.default.authenticate({
    client_id: process.env.DROPBOX_CLIENT_ID,
    client_secret: process.env.DROPBOX_CLIENT_SECRET,
    redirect_uri: process.env.DROPBOX_REDIRECT_URI,
    token_access_type: 'offline',
    state: 'OPTIONAL_STATE_VALUE'
});
// const dbx = new Dropbox({
//   clientId: process.env.CLIENT_ID
// })
var dbxAuth = new dropbox_1.DropboxAuth({
    clientId: process.env.DROPBOX_CLIENT_ID,
    clientSecret: process.env.DROPBOX_CLIENT_SECRET,
});
// console.log('dbxAuth',  dbxAuth)
// router.get('/', (_req: Request, res: Response) => {
//   return res.send('<a href="/login">Login</html>')
// })
router.get('/login', function (_req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authUrl, err_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, dbxAuth.getAuthenticationUrl(process.env.DROPBOX_REDIRECT_URI, null, 'code', 'offline', null, 'none', false)];
            case 1:
                authUrl = _a.sent();
                console.log('authUrl', authUrl);
                res.writeHead(302, { Location: authUrl.toString() });
                res.end();
                return [3 /*break*/, 3];
            case 2:
                err_1 = _a.sent();
                console.log(err_1);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
router.get('/refresh-token', function (req, res) {
    dropbox.refreshToken(store_1.default.refreshToken, function (err, result) {
        store_1.default.accessToken = result.access_token;
        console.log('refresh token result', result);
    });
});
router.get('/auth', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var code, response, err_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.log('/auth');
                code = req.query.code;
                console.log('code', code);
                console.log('process.env.DROPBOX_REDIRECT_URI', process.env.DROPBOX_REDIRECT_URI);
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, dbxAuth.getAccessTokenFromCode(process.env.DROPBOX_REDIRECT_URI, code)];
            case 2:
                response = _a.sent();
                console.log('result', response);
                store_1.default.accessToken = response.result.access_token;
                store_1.default.refreshToken = response.result.refresh_token;
                return [2 /*return*/, res.redirect('/?auth=1')];
            case 3:
                err_2 = _a.sent();
                console.log(err_2);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
router.get('/reset', function () { return __awaiter(void 0, void 0, void 0, function () {
    var directory, _i, _a, file;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                store_1.default.accessToken = null;
                store_1.default.refreshToken = null;
                directory = "images";
                _i = 0;
                return [4 /*yield*/, promises_1.default.readdir(directory)];
            case 1:
                _a = _b.sent();
                _b.label = 2;
            case 2:
                if (!(_i < _a.length)) return [3 /*break*/, 5];
                file = _a[_i];
                return [4 /*yield*/, promises_1.default.unlink(node_path_1.default.join(directory, file))];
            case 3:
                _b.sent();
                _b.label = 4;
            case 4:
                _i++;
                return [3 /*break*/, 2];
            case 5: return [2 /*return*/];
        }
    });
}); });
router.get('/get-tokens', function (req, res) {
    res.send('Access token is ' + store_1.default.accessToken +
        '. Refresh token is ' + store_1.default.refreshToken);
});
function getImages(req, res) {
    var results = [];
    var dir = './images/';
    try {
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir);
        }
        var files = fs_1.default.readdirSync(dir);
        files.forEach(function (file) {
            results.push(file);
        });
        res.json(results);
    }
    catch (err) {
        console.log('getImages error', err);
    }
}
router.get('/get-images', getImages);
function syncImages(req, res, next) {
    return __awaiter(this, void 0, void 0, function () {
        var dbx, result, cursor, dropboxConfig;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, image_1.syncImagesService)()];
                case 1:
                    _a.sent();
                    return [2 /*return*/, res.json({ "message": "done" })];
                case 2:
                    result = _a.sent();
                    console.log('result', result);
                    cursor = store_1.default.cursor;
                    if (!cursor) {
                        dropboxConfig = {
                            resource: 'files/list_folder',
                            parameters: {
                                path: '/samples',
                                limit: 2
                            }
                        };
                    }
                    else {
                        dropboxConfig = {
                            resource: 'files/list_folder/continue',
                            parameters: {
                                cursor: cursor
                            }
                        };
                    }
                    dropbox(dropboxConfig, function (err, result, response) {
                        // console.log('[files/list_folder] error', err)
                        if (result.has_more) {
                            store_1.default.cursor = result.cursor;
                        }
                        else {
                            store_1.default.cursor = null;
                        }
                        var files = result.entries;
                        var i = 0;
                        for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
                            var file = files_1[_i];
                            // console.log('file', file)
                            /**
                              file {
                                '.tag': 'file',
                                name: 'image-1.jpg',
                                path_lower: '/samples/image-1.jpg',
                                path_display: '/samples/image-1.jpg',
                                id: 'id:hiWNdCyIIa0AAAAAAAAAHg',
                                client_modified: '2023-05-05T08:40:07Z',
                                server_modified: '2023-05-05T08:40:07Z',
                                rev: '5faee3c7d24d40df7edef',
                                size: 187741,
                                is_downloadable: true,
                                content_hash: 'efba51e9db838068f3c59fe7cc77a8f726d93bfdfcfb492df5518756a526c7cc'
                              }
                            */
                            var imagePath = node_path_1.default.join('images/', file.name);
                            dropbox({
                                resource: 'files/download',
                                parameters: {
                                    path: file.id,
                                },
                            }, function (err, result, response) {
                                // console.log('backend sync error', err)
                                console.log('file downloaded');
                                // console.log('file downloaded result', result)
                                // console.log('file downloaded response', response)
                                i++;
                                if (i === files.length && store_1.default.cursor) {
                                    // redirect to get-images with cursor
                                    console.log('here we need to redirect to get-images with cursor', store_1.default.cursor);
                                    res.redirect('/sync-images');
                                }
                                else {
                                    // everything is downloaded
                                }
                            })
                                .pipe(fs_1.default.createWriteStream(imagePath, { flags: 'a+' }));
                            // console.log('after download ?')
                        }
                    });
                    return [2 /*return*/];
            }
        });
    });
}
router.get('/sync-images', authMiddleware_1.authMiddleware, syncImages);
exports.default = router;
