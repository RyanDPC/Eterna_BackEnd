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
exports.CreateMessageDto = exports.MessageType = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
var MessageType;
(function (MessageType) {
    MessageType["TEXT"] = "TEXT";
    MessageType["IMAGE"] = "IMAGE";
    MessageType["FILE"] = "FILE";
    MessageType["AUDIO"] = "AUDIO";
    MessageType["VIDEO"] = "VIDEO";
})(MessageType || (exports.MessageType = MessageType = {}));
class CreateMessageDto {
    constructor() {
        this.type = MessageType.TEXT;
    }
}
exports.CreateMessageDto = CreateMessageDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Contenu du message',
        example: 'Salut tout le monde ! 👋',
        maxLength: 1000,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], CreateMessageDto.prototype, "content", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID du salon',
        example: 'room_123',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateMessageDto.prototype, "roomId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Type de message',
        enum: MessageType,
        default: MessageType.TEXT,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(MessageType),
    __metadata("design:type", String)
], CreateMessageDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'URL de la pièce jointe (pour les images, fichiers, etc.)',
        example: 'https://example.com/file.jpg',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMessageDto.prototype, "attachmentUrl", void 0);
