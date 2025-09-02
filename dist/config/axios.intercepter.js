"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
axios_1.default.interceptors.request.use(request => {
    console.log('Starting Request', JSON.stringify(request, null, 2));
    return request;
});
axios_1.default.interceptors.response.use(response => {
    console.log('Response:', JSON.stringify(response, null, 2));
    return response;
});
//# sourceMappingURL=axios.intercepter.js.map