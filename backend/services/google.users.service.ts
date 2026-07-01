import { usersRepository } from '../dal/user.repository';
import { googleService } from './google.service';

export class GoogleLoginService {
  async handleGoogleLogin(code: string, termsAccepted?: boolean) {
    const googleUser = await googleService.getUserFromCode(code);

    let user = await usersRepository.findByGoogleId(googleUser.sub);

    if (!user) {
      const existingEmailUser = await usersRepository.findByEmail(googleUser.email);

      if (existingEmailUser) {
        // Only allow linking if this is a pre-seeded Google-type placeholder (user_type=1, no google_id).
        // A local password account (user_type=0) must never be linkable via Google OAuth.
        if (existingEmailUser.user_type !== 1 || existingEmailUser.google_id) {
          throw new Error('Email already in use');
        }
        user = await usersRepository.linkGoogleId(
          existingEmailUser.id,
          googleUser.sub,
          googleUser.name,
          googleUser.picture || '',
        );
      } else {
        if (!termsAccepted) {
          throw new Error('You must accept the Terms of Service to create an account');
        }
        user = await usersRepository.createGoogleUser(
          'user',
          googleUser.sub,
          googleUser.email,
          googleUser.name,
          googleUser.picture || '',
          new Date()
        );
      }
    }
    return user;
  }
}

export const googleLoginService = new GoogleLoginService();
