"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const xlsx_1 = __importDefault(require("xlsx"));
const winston_logger_1 = __importDefault(require("../config/winston_logger"));
const createXlsxFile = (data) => {
    try {
        const workbook = xlsx_1.default.utils.book_new();
        const worksheet = xlsx_1.default.utils.aoa_to_sheet(data);
        xlsx_1.default.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
        const colWidths = data[0].map((_, colIndex) => ({
            wch: Math.max(...data.map((row) => (row[colIndex] ? row[colIndex].toString().length + 3 : 0)))
        }));
        worksheet['!cols'] = colWidths;
        const excelBuffer = xlsx_1.default.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        winston_logger_1.default.info(`Excel buffer successfully created`);
        return excelBuffer;
    }
    catch (err) {
        winston_logger_1.default.error(`Error in createXlsxFile: ${err}`);
        throw err;
    }
};
exports.default = createXlsxFile;
//# sourceMappingURL=createExcelFile.js.map