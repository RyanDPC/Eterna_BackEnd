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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
let AuthService = class AuthService {
    constructor(jwtService) {
        this.jwtService = jwtService;
        this.users = [];
        this.userCounter = 1;
        this.users.push({
            id: '1',
            username: 'testuser',
            email: 'test@eterna.com',
            password: 'password123',
            status: 'En ligne',
            createdAt: new Date(),
        });
    }
    async validateUser(identifier, password) {
        console.log('🔍 Recherche utilisateur avec identifier:', identifier);
        console.log('👥 Utilisateurs disponibles:', this.users.map(u => ({ username: u.username, email: u.email })));
        const user = this.users.find(u => u.username.toLowerCase() === identifier.toLowerCase() ||
            u.email.toLowerCase() === identifier.toLowerCase());
        console.log('🎯 Utilisateur trouvé:', user ? { username: user.username, email: user.email } : 'AUCUN');
        if (user && user.password === password) {
            console.log('🔑 Mot de passe correct');
            const { password, ...result } = user;
            return result;
        }
        if (user) {
            console.log('❌ Mot de passe incorrect');
        }
        else {
            console.log('❌ Aucun utilisateur trouvé avec cet identifiant');
        }
        return null;
    }
    async login(loginDto) {
        console.log('🔐 Tentative de connexion avec:', loginDto);
        const user = await this.validateUser(loginDto.username, loginDto.password);
        console.log('👤 Utilisateur trouvé:', user ? 'OUI' : 'NON');
        if (!user) {
            console.log('❌ Identifiants invalides');
            throw new common_1.UnauthorizedException('Identifiants invalides');
        }
        const payload = { username: user.username, sub: user.id };
        console.log('✅ Connexion réussie pour:', user.username);
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                status: user.status,
            },
        };
    }
    async register(registerDto) {
        const existingUser = this.users.find(u => u.username === registerDto.username || u.email === registerDto.email);
        if (existingUser) {
            throw new common_1.UnauthorizedException('Utilisateur déjà existant');
        }
        const newUser = {
            id: (++this.userCounter).toString(),
            username: registerDto.username,
            email: registerDto.email,
            password: registerDto.password,
            status: 'En ligne',
            createdAt: new Date(),
        };
        this.users.push(newUser);
        const payload = { username: newUser.username, sub: newUser.id };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                status: newUser.status,
            },
        };
    }
    async findById(id) {
        const user = this.users.find(u => u.id === id);
        if (user) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }
    async findByUsername(username) {
        const user = this.users.find(u => u.username === username);
        if (user) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService])
], AuthService);
