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
exports.RoomsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const rooms_service_1 = require("./rooms.service");
const create_room_dto_1 = require("./dto/create-room.dto");
const join_room_dto_1 = require("./dto/join-room.dto");
let RoomsController = class RoomsController {
    constructor(roomsService) {
        this.roomsService = roomsService;
    }
    async createRoom(createRoomDto, req) {
        const room = await this.roomsService.createRoom(createRoomDto, req.user.id);
        return {
            message: 'Salon créé avec succès',
            room,
        };
    }
    async getUserRooms(req) {
        const rooms = await this.roomsService.getUserRooms(req.user.id);
        return {
            rooms,
        };
    }
    async getAvailableRooms(req) {
        const rooms = await this.roomsService.getAvailableRooms(req.user.id);
        return {
            rooms,
        };
    }
    async getRoomById(id, req) {
        const room = await this.roomsService.getRoomById(id, req.user.id);
        return {
            room,
        };
    }
    async joinRoom(joinRoomDto, req) {
        const room = await this.roomsService.joinRoom(joinRoomDto, req.user.id);
        return {
            message: 'Salon rejoint avec succès',
            room,
        };
    }
    async leaveRoom(id, req) {
        await this.roomsService.leaveRoom(id, req.user.id);
        return {
            message: 'Salon quitté avec succès',
        };
    }
    async updateRoom(id, updates, req) {
        const room = await this.roomsService.updateRoom(id, updates, req.user.id);
        return {
            message: 'Salon mis à jour avec succès',
            room,
        };
    }
    async deleteRoom(id, req) {
        await this.roomsService.deleteRoom(id, req.user.id);
    }
};
exports.RoomsController = RoomsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Créer un nouveau salon' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Salon créé avec succès',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Données invalides',
    }),
    (0, swagger_1.ApiResponse)({
        status: 409,
        description: 'Un salon avec ce nom existe déjà',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_room_dto_1.CreateRoomDto, Object]),
    __metadata("design:returntype", Promise)
], RoomsController.prototype, "createRoom", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Récupérer les salons de l\'utilisateur' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Liste des salons récupérée',
    }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RoomsController.prototype, "getUserRooms", null);
__decorate([
    (0, common_1.Get)('available'),
    (0, swagger_1.ApiOperation)({ summary: 'Récupérer les salons disponibles' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Liste des salons disponibles récupérée',
    }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RoomsController.prototype, "getAvailableRooms", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Récupérer un salon par ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Salon récupéré',
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Salon non trouvé',
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Accès refusé',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RoomsController.prototype, "getRoomById", null);
__decorate([
    (0, common_1.Post)('join'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Rejoindre un salon' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Salon rejoint avec succès',
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Salon non trouvé',
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Accès refusé ou salon privé',
    }),
    (0, swagger_1.ApiResponse)({
        status: 409,
        description: 'Déjà membre du salon',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [join_room_dto_1.JoinRoomDto, Object]),
    __metadata("design:returntype", Promise)
], RoomsController.prototype, "joinRoom", null);
__decorate([
    (0, common_1.Post)(':id/leave'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Quitter un salon' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Salon quitté avec succès',
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Salon non trouvé ou non membre',
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Le propriétaire ne peut pas quitter',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RoomsController.prototype, "leaveRoom", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Mettre à jour un salon' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Salon mis à jour avec succès',
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Salon non trouvé',
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Permissions insuffisantes',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], RoomsController.prototype, "updateRoom", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Supprimer un salon' }),
    (0, swagger_1.ApiResponse)({
        status: 204,
        description: 'Salon supprimé avec succès',
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Salon non trouvé',
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Seul le propriétaire peut supprimer',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RoomsController.prototype, "deleteRoom", null);
exports.RoomsController = RoomsController = __decorate([
    (0, swagger_1.ApiTags)('Salons'),
    (0, common_1.Controller)('rooms'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [rooms_service_1.RoomsService])
], RoomsController);
