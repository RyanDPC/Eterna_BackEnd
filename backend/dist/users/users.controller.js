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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const users_service_1 = require("./users.service");
const update_user_dto_1 = require("./dto/update-user.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let UsersController = class UsersController {
    constructor(usersService) {
        this.usersService = usersService;
    }
    findAll() {
        return this.usersService.findAll();
    }
    getProfile(req) {
        return this.usersService.findOne(req.user.id);
    }
    findOne(id) {
        return this.usersService.findOne(id);
    }
    updateProfile(req, updateUserDto) {
        return this.usersService.update(req.user.id, updateUserDto);
    }
    update(id, updateUserDto) {
        return this.usersService.update(id, updateUserDto);
    }
    remove(id) {
        return this.usersService.remove(id);
    }
    updateStatus(req, body) {
        return this.usersService.updateStatus(req.user.id, body.status);
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Récupérer tous les utilisateurs' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Liste des utilisateurs récupérée' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('profile'),
    (0, swagger_1.ApiOperation)({ summary: 'Récupérer le profil de l\'utilisateur connecté' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Profil récupéré avec succès' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Récupérer un utilisateur par ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Utilisateur récupéré avec succès' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Utilisateur non trouvé' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)('profile'),
    (0, swagger_1.ApiOperation)({ summary: 'Mettre à jour le profil de l\'utilisateur connecté' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Profil mis à jour avec succès' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_user_dto_1.UpdateUserDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Mettre à jour un utilisateur par ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Utilisateur mis à jour avec succès' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Utilisateur non trouvé' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_user_dto_1.UpdateUserDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Supprimer un utilisateur par ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Utilisateur supprimé avec succès' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Utilisateur non trouvé' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "remove", null);
__decorate([
    (0, common_1.Patch)('profile/status'),
    (0, swagger_1.ApiOperation)({ summary: 'Mettre à jour le statut de l\'utilisateur connecté' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Statut mis à jour avec succès' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "updateStatus", null);
exports.UsersController = UsersController = __decorate([
    (0, swagger_1.ApiTags)('👥 Utilisateurs'),
    (0, common_1.Controller)('users'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
