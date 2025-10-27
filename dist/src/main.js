"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const compression_1 = __importDefault(require("compression"));
const fs_1 = __importDefault(require("fs"));
const helmet_1 = __importDefault(require("helmet"));
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
const environment_enum_1 = require("./core/config/environment.enum");
const config_1 = require("./infra/validators/class-*/config");
async function bootstrap() {
    const app = process.env.NODE_ENV !== environment_enum_1.Environment.Production
        ? await core_1.NestFactory.create(app_module_1.AppModule)
        : await core_1.NestFactory.create(app_module_1.AppModule, {
            httpsOptions: {
                key: fs_1.default.readFileSync(process.env.SSL_KEY),
                cert: fs_1.default.readFileSync(process.env.SSL_CERT),
                ca: fs_1.default.readFileSync(process.env.SSL_CA),
            },
        });
    const config = new swagger_1.DocumentBuilder()
        .setTitle('DPASIS REST API')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config, { autoTagControllers: false });
    swagger_1.SwaggerModule.setup('swagger', app, document);
    app.useGlobalPipes(new common_1.ValidationPipe(config_1.pipeOptions));
    app.use((0, helmet_1.default)());
    app.use((0, compression_1.default)());
    app.enableCors();
    await app.listen(process.env.PORT);
}
bootstrap();
//# sourceMappingURL=main.js.map