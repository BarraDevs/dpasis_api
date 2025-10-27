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
exports.generateApplicationPersistence = generateApplicationPersistence;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const generate_persistence_dao_interface_file_1 = require("./dao/generate-persistence-dao-interface-file");
const generate_persistence_module_file_1 = require("./generate-persistence-module-file");
async function generateApplicationPersistence(props) {
    const persistencePath = path.join(props.modulePath, 'application', 'persistence');
    await fs.mkdir(persistencePath);
    await fs.writeFile(path.join(persistencePath, `${props.moduleName}-persistence.module.ts`), (0, generate_persistence_module_file_1.generatePersistenceModuleFile)(props));
    const daoPath = path.join(persistencePath, 'dao');
    await fs.mkdir(daoPath);
    await fs.writeFile(path.join(daoPath, `${props.moduleName}-dao.interface.ts`), (0, generate_persistence_dao_interface_file_1.generatePersistenceDaoInterfaceFile)(props));
}
//# sourceMappingURL=generate-persitence.js.map