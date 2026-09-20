export type UserRole = 'cliente' | 'admin';

export type PublicUser = {
  id: string;
  email: string;
  phone: string | null;
  role: UserRole;
  createdAt: Date;
};

export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly passwordHash: string,
    public readonly role: UserRole,
    public readonly phone: string | null,
    public readonly createdAt: Date,
  ) {}

  toPublic(): PublicUser {
    return {
      id: this.id,
      email: this.email,
      phone: this.phone,
      role: this.role,
      createdAt: this.createdAt,
    };
  }
}
