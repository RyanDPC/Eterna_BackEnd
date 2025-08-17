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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let UsersService = class UsersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        return this.prisma.user.findMany({
            select: {
                id: true,
                email: true,
                username: true,
                avatar: true,
                status: true,
                isOnline: true,
                lastSeen: true,
                createdAt: true,
            },
        });
    }
    async findOne(id) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                username: true,
                avatar: true,
                status: true,
                isOnline: true,
                lastSeen: true,
                createdAt: true,
                updatedAt: true,
                ownedRooms: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        isPrivate: true,
                        isVoice: true,
                        maxMembers: true,
                    },
                },
                roomMembers: {
                    select: {
                        role: true,
                        room: {
                            select: {
                                id: true,
                                name: true,
                                description: true,
                                isPrivate: true,
                                isVoice: true,
                            },
                        },
                    },
                },
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('Utilisateur non trouvé');
        }
        return user;
    }
    async findByEmail(email) {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }
    async update(id, updateUserDto) {
        const user = await this.prisma.user.update({
            where: { id },
            data: updateUserDto,
            select: {
                id: true,
                email: true,
                username: true,
                avatar: true,
                status: true,
                isOnline: true,
                lastSeen: true,
                updatedAt: true,
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('Utilisateur non trouvé');
        }
        return user;
    }
    async remove(id) {
        const user = await this.prisma.user.delete({
            where: { id },
        });
        if (!user) {
            throw new common_1.NotFoundException('Utilisateur non trouvé');
        }
        return { message: 'Utilisateur supprimé avec succès' };
    }
    async updateStatus(id, status) {
        return this.prisma.user.update({
            where: { id },
            data: { status },
            select: {
                id: true,
                status: true,
                isOnline: true,
                lastSeen: true,
            },
        });
    }
    async updateOnlineStatus(id, isOnline) {
        return this.prisma.user.update({
            where: { id },
            data: {
                isOnline,
                lastSeen: new Date(),
            },
            select: {
                id: true,
                isOnline: true,
                lastSeen: true,
            },
        });
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
