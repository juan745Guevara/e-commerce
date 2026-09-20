import { User, UserRole } from '../entities/user.entity.js';

export const USER_REPOSITORY = 'IUserRepository';

export type CreateUserData = {
  email: string;
  passwordHash: string;
  role: UserRole;
  phone?: string | null;
};

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(data: CreateUserData): Promise<User>;
}
