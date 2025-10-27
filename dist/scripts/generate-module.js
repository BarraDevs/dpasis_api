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
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const generate_application_1 = require("./functions/application/generate-application");
const generate_domain_1 = require("./functions/domain/generate-domain");
const generate_module_file_1 = require("./functions/generate-module-file");
const generate_infra_1 = require("./functions/infra/generate-infra");
const kebab_to_camel_1 = require("./utils/kebab-to-camel");
const kebab_to_pascal_1 = require("./utils/kebab-to-pascal");
const args = process.argv.slice(2);
if (args.length !== 1) {
    console.error('Erro. Uso correto: npx ts-node scripts/generate-module.ts <nome-do-modulo>');
    process.exit(1);
}
main(args[0]);
async function main(moduleName) {
    const props = {
        modulePath: path.join(__dirname, '..', 'src', 'app', moduleName),
        moduleName,
        moduleNamePascal: (0, kebab_to_pascal_1.kebabToPascalCase)(moduleName),
        moduleNameCamel: (0, kebab_to_camel_1.kebabToCamelCase)(moduleName),
        moduleNameUpper: moduleName.toUpperCase(),
    };
    try {
        await fs.access(props.modulePath);
        return console.error(`Erro! O módulo "${moduleName}" já existe.`);
    }
    catch (err) {
    }
    await fs.mkdir(props.modulePath);
    await fs.writeFile(path.join(props.modulePath, `${props.moduleName}.module.ts`), (0, generate_module_file_1.generateModuleFile)(props));
    await (0, generate_application_1.generateApplicationFiles)(props);
    await (0, generate_domain_1.generateDomainFiles)(props);
    await (0, generate_infra_1.generateInfraFiles)(props);
}
//# sourceMappingURL=generate-module.js.map