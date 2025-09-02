"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_rate_limit_1 = require("express-rate-limit");
const index_1 = __importDefault(require("./Routes/index"));
const connectDB_1 = __importDefault(require("./config/connectDB"));
const winston_logger_1 = __importDefault(require("./config/winston_logger"));
const cors_1 = __importDefault(require("cors"));
const errorHandler_middleware_1 = require("./middleware/errorHandler.middleware");
const config_1 = require("./config/config");
const port = config_1.config.PORT;
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)());
app.use((0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        status: 429,
        error: "Rate limit exceeded",
        retryAfter: "Try again in a few minutes.",
    },
    handler: (_req, res) => {
        console.log("RLE");
        res.status(429).json({
            error: "Rate Limit Exceeded from this client. Please try after some time",
        });
    },
    legacyHeaders: false,
}));
app.use('/api', index_1.default);
app.use(errorHandler_middleware_1.errorHandler);
app.use('*', errorHandler_middleware_1.handle404);
app.listen(port, async () => {
    await (0, connectDB_1.default)();
    winston_logger_1.default.info(`[⚡] Server Running at http://127.0.0.1:${port} Running`);
});
//# sourceMappingURL=index.js.map