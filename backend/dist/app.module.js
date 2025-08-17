"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const terminus_1 = require("@nestjs/terminus");
const health_controller_1 = require("./health/health.controller");
const auth_module_1 = require("./auth/auth.module");
const test_rooms_controller_1 = require("./test-rooms.controller");
const test_messages_controller_1 = require("./test-messages.controller");
const dynamic_servers_controller_1 = require("./dynamic-servers.controller");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: 'config.env',
            }),
            auth_module_1.AuthModule,
            throttler_1.ThrottlerModule.forRoot([
                {
                    ttl: 60000,
                    limit: 100,
                },
            ]),
            terminus_1.TerminusModule,
        ],
        controllers: [health_controller_1.HealthController, test_rooms_controller_1.TestRoomsController, test_messages_controller_1.TestMessagesController, dynamic_servers_controller_1.DynamicServersController],
        providers: [],
    })
], AppModule);
