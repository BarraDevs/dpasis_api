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
exports.generateFindByIdUsecase = generateFindByIdUsecase;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const generate_find_by_id_usecase_file_1 = require("./generate-find-by-id-usecase-file");
const generate_find_by_id_usecase_spec_file_1 = require("./generate-find-by-id-usecase-spec-file");
async function generateFindByIdUsecase(props) {
    const usecasesPath = path.join(props.modulePath, 'application', 'usecases');
    const findByIdPath = path.join(usecasesPath, `find-${props.moduleName}-by-id`);
    await fs.mkdir(findByIdPath);
    await fs.writeFile(path.join(findByIdPath, `find-${props.moduleName}-by-id.service.ts`), (0, generate_find_by_id_usecase_file_1.generateFindByIdUsecaseFile)(props));
    await fs.writeFile(path.join(findByIdPath, `find-${props.moduleName}-by-id.service.spec.ts`), (0, generate_find_by_id_usecase_spec_file_1.generateFindByIdUsecaseSpecFile)(props));
}
//# sourceMappingURL=generate-find-by-id-usecases.js.map