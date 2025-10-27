"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateApplicationUsecases = generateApplicationUsecases;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const generate_create_usecase_1 = require("./create-usecase/generate-create-usecase");
const generate_delete_usecases_1 = require("./delete-usecase/generate-delete-usecases");
const generate_edit_usecases_1 = require("./edit-usecase/generate-edit-usecases");
const generate_find_all_usecases_1 = require("./find-all-usecase/generate-find-all-usecases");
const generate_find_by_id_usecases_1 = require("./find-by-id-usecase/generate-find-by-id-usecases");
async function generateApplicationUsecases(props) {
    const usecasesPath = path.join(props.modulePath, 'application', 'usecases');
    await fs.mkdir(usecasesPath);
    await Promise.all([
        (0, generate_create_usecase_1.generateCreateUsecase)(props),
        (0, generate_delete_usecases_1.generateDeleteUsecase)(props),
        (0, generate_edit_usecases_1.generateEditUsecase)(props),
        (0, generate_find_all_usecases_1.generateFindAllUsecase)(props),
        (0, generate_find_by_id_usecases_1.generateFindByIdUsecase)(props),
    ]);
}
//# sourceMappingURL=generate-usecases.js.map