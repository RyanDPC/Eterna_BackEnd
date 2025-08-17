"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const platform_socket_io_1 = require("@nestjs/platform-socket.io");
const compression = require("compression");
const helmet_1 = require("helmet");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.use((0, helmet_1.default)());
    app.use(compression());
    app.enableCors({
        origin: process.env.CORS_ORIGIN || 'http://localhost:1420',
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.setGlobalPrefix('api');
    app.useWebSocketAdapter(new platform_socket_io_1.IoAdapter(app));
    const config = new swagger_1.DocumentBuilder()
        .setTitle('🌸 Eterna API')
        .setDescription('API de communication temps réel pour Eterna')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api', app, document);
    const port = process.env.PORT || 8080;
    await app.listen(port);
    console.log(`🌸 Eterna Backend démarré sur le port ${port}`);
    console.log(`📚 Documentation: http://localhost:${port}/api`);
    console.log(`🔌 WebSocket: ws://localhost:${port}`);
}
bootstrap().catch((error) => {
    console.error('❌ Erreur lors du démarrage:', error);
    process.exit(1);
});
