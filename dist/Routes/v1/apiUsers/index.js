"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const apiUsers_controller_1 = require("../../../Controllers/apiUsers/apiUsers.controller");
const apiUser_validators_1 = require("../../../validators/apiUser.validators");
const validation_middleware_1 = __importDefault(require("../../../middleware/validation.middleware"));
const adminAuthorization_middleware_1 = __importDefault(require("../../../middleware/adminAuthorization.middleware"));
const router = express_1.default.Router();
router.post('/get-all-api-users', adminAuthorization_middleware_1.default, apiUsers_controller_1.apiUsersController.getAllApiUsers);
router.post('/update-settings', adminAuthorization_middleware_1.default, apiUser_validators_1.apiUserValidators.updateApiUserSettingsValidator, validation_middleware_1.default, apiUsers_controller_1.apiUsersController.updateApiUserSettingsController);
exports.default = router;
//# sourceMappingURL=index.js.map