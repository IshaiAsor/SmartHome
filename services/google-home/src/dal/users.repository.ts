import { db } from '@lattice/prisma-client';
import bcrypt from 'bcryptjs';

export const usersRepository = {
  async findByUsername(username: string) {
    return db.user.findUnique({ where: { user_name: username } });
  },
  async findByEmail(email: string) {
    return db.user.findUnique({ where: { email } });
  },
  async findByGoogleId(googleId: string) {
    return db.user.findUnique({ where: { google_id: googleId } });
  },
  async validatePassword(hash: string, plain: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  },
  async createGoogleUser(googleId: string, email: string, fullName: string, picture: string) {
    return db.user.create({
      data: {
        user_type: 1,
        user_role: 'user',
        google_id: googleId,
        email,
        full_name: fullName,
        profile_picture_url: picture,
      },
    });
  },
};
