// 🌸 Types pour les salons (mode sans base de données)

export interface SimpleUser {
  id: string;
  username: string;
  avatar?: string;
  status?: string;
}

export interface SimpleRoomMember {
  id: string;
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'MODERATOR' | 'MEMBER';
  joinedAt: Date;
  user: SimpleUser;
}

export interface SimpleRoom {
  id: string;
  name: string;
  description: string;
  isPrivate: boolean;
  isVoice: boolean;
  maxMembers: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  members: SimpleRoomMember[];
}
