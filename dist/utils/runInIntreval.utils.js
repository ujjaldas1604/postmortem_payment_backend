"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runInInterval = void 0;
const winston_logger_1 = __importDefault(require("../config/winston_logger"));
const runInInterval = (id, callback, interval, maxRuns = 30) => {
    let runCount = 0;
    const intervalId = setInterval(async () => {
        winston_logger_1.default.warn(`Running callback function ${runCount + 1} / ${maxRuns} time for ${id}`);
        const result = await callback();
        if (result.break) {
            clearInterval(intervalId);
            winston_logger_1.default.info(`Interval stopped for ${id}, because it resolved in success or failure`);
        }
        runCount++;
        if (runCount >= maxRuns) {
            clearInterval(intervalId);
            winston_logger_1.default.info(`Interval stopped after ${maxRuns} executions for ${id}`);
        }
    }, interval);
};
exports.runInInterval = runInInterval;
//# sourceMappingURL=runInIntreval.utils.js.map