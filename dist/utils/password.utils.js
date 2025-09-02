"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.passwordUtils = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const saltRounds = 12;
async function hashPassword(password) {
    try {
        const salt = await bcrypt_1.default.genSalt(saltRounds);
        const hash = await bcrypt_1.default.hash(password, salt);
        return hash;
    }
    catch (err) {
        console.error('Error hashing password:', err);
        throw err;
    }
}
async function verifyPassword(plainPassword, hashedPassword) {
    try {
        const match = await bcrypt_1.default.compare(plainPassword, hashedPassword);
        return match;
    }
    catch (err) {
        console.error('Error verifying password:', err);
        return false;
    }
}
exports.passwordUtils = {
    hashPassword,
    verifyPassword
};
//# sourceMappingURL=password.utils.js.map