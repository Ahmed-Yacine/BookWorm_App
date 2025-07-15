import { Strategy } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile } from 'passport';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: ['email', 'profile'],
    });
  }

  public async validate(
    accessToken: string,
    refreshToken: string | undefined,
    profile: Profile,
  ): Promise<any> {
    const { name, emails, photos } = profile;

    const googleUser = {
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
      picture: photos[0].value,
      // Only include accessToken if needed, omit refreshToken if undefined
      ...(accessToken && { accessToken }),
      ...(refreshToken && { refreshToken }),
    };
    console.log('Google User:', googleUser);
    return googleUser;
  }
}
