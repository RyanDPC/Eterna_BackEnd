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
exports.CreateRoomDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateRoomDto {
}
exports.CreateRoomDto = CreateRoomDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nom du salon',
        example: 'mon-salon',
        minLength: 3,
        maxLength: 30,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(3, 30),
    __metadata("design:type", String)
], CreateRoomDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Description du salon',
        example: 'Un salon pour discuter de...',
        maxLength: 200,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Max)(200),
    __metadata("design:type", String)
], CreateRoomDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Si le salon est privé',
        default: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateRoomDto.prototype, "isPrivate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Si le salon est vocal',
        default: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateRoomDto.prototype, "isVoice", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Nombre maximum de membres',
        example: 50,
        minimum: 2,
        maximum: 1000,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(2),
    (0, class_validator_1.Max)(1000),
    __metadata("design:type", Number)
], CreateRoomDto.prototype, "maxMembers", void 0);
