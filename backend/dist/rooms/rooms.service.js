"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomsService = void 0;
const common_1 = require("@nestjs/common");
let RoomsService = class RoomsService {
    constructor() {
        this.rooms = [];
        this.roomCounter = 1;
    }
    async createRoom(createRoomDto, userId) {
        const existingRoom = this.rooms.find(room => room.name === createRoomDto.name);
        if (existingRoom) {
            throw new common_1.ConflictException('Un salon avec ce nom existe déjà');
        }
        const newRoom = {
            id: `room_${this.roomCounter++}`,
            name: createRoomDto.name,
            description: createRoomDto.description || '',
            isPrivate: createRoomDto.isPrivate || false,
            isVoice: createRoomDto.isVoice || false,
            maxMembers: createRoomDto.maxMembers || 50,
            createdBy: userId,
            createdAt: new Date(),
            updatedAt: new Date(),
            members: [
                {
                    id: `member_${Date.now()}`,
                    userId: userId,
                    role: 'OWNER',
                    joinedAt: new Date(),
                    user: {
                        id: userId,
                        username: `user_${userId}`,
                        status: 'En ligne',
                    },
                },
            ],
        };
        this.rooms.push(newRoom);
        return newRoom;
    }
    async getUserRooms(userId) {
        return this.rooms.filter(room => room.members.some(member => member.userId === userId));
    }
    async getAvailableRooms(userId) {
        return this.rooms.filter(room => !room.isPrivate &&
            !room.members.some(member => member.userId === userId));
    }
    async joinRoom(joinRoomDto, userId) {
        const room = this.rooms.find(r => r.id === joinRoomDto.roomId);
        if (!room) {
            throw new common_1.NotFoundException('Salon non trouvé');
        }
        if (room.isPrivate) {
            throw new common_1.ForbiddenException('Ce salon est privé et nécessite une invitation');
        }
        const existingMember = room.members.find(member => member.userId === userId);
        if (existingMember) {
            throw new common_1.ConflictException('Vous êtes déjà membre de ce salon');
        }
        if (room.members.length >= room.maxMembers) {
            throw new common_1.ForbiddenException('Ce salon a atteint sa limite de membres');
        }
        const newMember = {
            id: `member_${Date.now()}`,
            userId: userId,
            role: 'MEMBER',
            joinedAt: new Date(),
            user: {
                id: userId,
                username: `user_${userId}`,
                status: 'En ligne',
            },
        };
        room.members.push(newMember);
        room.updatedAt = new Date();
        return room;
    }
    async leaveRoom(roomId, userId) {
        const room = this.rooms.find(r => r.id === roomId);
        if (!room) {
            throw new common_1.NotFoundException('Salon non trouvé');
        }
        const memberIndex = room.members.findIndex(member => member.userId === userId);
        if (memberIndex === -1) {
            throw new common_1.NotFoundException('Vous n\'êtes pas membre de ce salon');
        }
        const member = room.members[memberIndex];
        if (member.role === 'OWNER' && room.members.length > 1) {
            throw new common_1.ForbiddenException('Le propriétaire ne peut pas quitter le salon tant qu\'il y a d\'autres membres');
        }
        room.members.splice(memberIndex, 1);
        room.updatedAt = new Date();
        if (room.members.length === 0) {
            const roomIndex = this.rooms.findIndex(r => r.id === roomId);
            if (roomIndex !== -1) {
                this.rooms.splice(roomIndex, 1);
            }
        }
    }
    async getRoomById(roomId, userId) {
        const room = this.rooms.find(r => r.id === roomId);
        if (!room) {
            throw new common_1.NotFoundException('Salon non trouvé');
        }
        const isMember = room.members.some(member => member.userId === userId);
        if (!isMember && room.isPrivate) {
            throw new common_1.ForbiddenException('Accès refusé à ce salon privé');
        }
        return room;
    }
    async updateRoom(roomId, updates, userId) {
        const room = this.rooms.find(r => r.id === roomId);
        if (!room) {
            throw new common_1.NotFoundException('Salon non trouvé');
        }
        const member = room.members.find(m => m.userId === userId);
        if (!member || (member.role !== 'OWNER' && member.role !== 'ADMIN')) {
            throw new common_1.ForbiddenException('Vous n\'avez pas les permissions pour modifier ce salon');
        }
        Object.assign(room, updates);
        room.updatedAt = new Date();
        return room;
    }
    async deleteRoom(roomId, userId) {
        const room = this.rooms.find(r => r.id === roomId);
        if (!room) {
            throw new common_1.NotFoundException('Salon non trouvé');
        }
        const member = room.members.find(m => m.userId === userId);
        if (!member || member.role !== 'OWNER') {
            throw new common_1.ForbiddenException('Seul le propriétaire peut supprimer le salon');
        }
        const roomIndex = this.rooms.findIndex(r => r.id === roomId);
        if (roomIndex !== -1) {
            this.rooms.splice(roomIndex, 1);
        }
    }
};
exports.RoomsService = RoomsService;
exports.RoomsService = RoomsService = __decorate([
    (0, common_1.Injectable)()
], RoomsService);
