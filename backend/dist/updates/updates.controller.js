"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdatesController = void 0;
const common_1 = require("@nestjs/common");
const updates_service_1 = require("./updates.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const create_update_dto_1 = require("./dto/create-update.dto");
let UpdatesController = class UpdatesController {
    constructor(updatesService) {
        this.updatesService = updatesService;
    }
    async checkForUpdates(currentVersion) {
        return this.updatesService.checkForUpdates(currentVersion);
    }
    async getLatestVersion() {
        return this.updatesService.getLatestVersion();
    }
    async getAllVersions() {
        return this.updatesService.getAllVersions();
    }
    async getReleaseNotes(version) {
        return this.updatesService.getReleaseNotes(version);
    }
    async createUpdate(createUpdateDto) {
        return this.updatesService.createUpdate(createUpdateDto);
    }
    async getUpdateStats() {
        return this.updatesService.getUpdateStats();
    }
    async markAsDownloaded(version) {
        return this.updatesService.markAsDownloaded(version);
    }
    async markAsInstalled(version) {
        return this.updatesService.markAsInstalled(version);
    }
};
exports.UpdatesController = UpdatesController;
__decorate([
    (0, common_1.Get)('check/:currentVersion'),
    __param(0, (0, common_1.Param)('currentVersion')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UpdatesController.prototype, "checkForUpdates", null);
__decorate([
    (0, common_1.Get)('latest'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UpdatesController.prototype, "getLatestVersion", null);
__decorate([
    (0, common_1.Get)('versions'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UpdatesController.prototype, "getAllVersions", null);
__decorate([
    (0, common_1.Get)('release-notes/:version'),
    __param(0, (0, common_1.Param)('version')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UpdatesController.prototype, "getReleaseNotes", null);
__decorate([
    (0, common_1.Post)('create'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_update_dto_1.CreateUpdateDto]),
    __metadata("design:returntype", Promise)
], UpdatesController.prototype, "createUpdate", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UpdatesController.prototype, "getUpdateStats", null);
__decorate([
    (0, common_1.Post)('download/:version'),
    __param(0, (0, common_1.Param)('version')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UpdatesController.prototype, "markAsDownloaded", null);
__decorate([
    (0, common_1.Post)('install/:version'),
    __param(0, (0, common_1.Param)('version')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UpdatesController.prototype, "markAsInstalled", null);
exports.UpdatesController = UpdatesController = __decorate([
    (0, common_1.Controller)('api/updates'),
    __metadata("design:paramtypes", [updates_service_1.UpdatesService])
], UpdatesController);
