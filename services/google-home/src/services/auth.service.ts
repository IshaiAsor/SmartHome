import { OAuth2Client } from 'google-auth-library';
import config from '../config/env.config';
import { usersRepository } from '../dal/users.repository';

const googleOAuth = new OAuth2Client(
  config.google.signInClientId,
  config.google.signInClientSecret,
  'postmessage',
);

export const authService = {
  async validateUser(username: string, password: string) {
    const user = await usersRepository.findByUsername(username);
    if (!user?.password) return null;
    return (await usersRepository.validatePassword(user.password, password)) ? user : null;
  },

  async loginWithGoogle(code: string) {
    const { tokens } = await googleOAuth.getToken(code);
    googleOAuth.setCredentials(tokens);
    const { data } = await googleOAuth.request<{
      sub: string; email: string; name: string; picture: string;
    }>({ url: 'https://www.googleapis.com/oauth2/v3/userinfo' });

    let user = await usersRepository.findByGoogleId(data.sub);
    if (!user) {
      if (await usersRepository.findByEmail(data.email)) throw new Error('Email already in use');
      user = await usersRepository.createGoogleUser(data.sub, data.email, data.name, data.picture ?? '');
    }
    return user;
  },
};
