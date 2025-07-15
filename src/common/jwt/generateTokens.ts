import { JwtPayload } from './jwt.payload';
import { JwtService } from '@nestjs/jwt';

function generateTokens(jwtService: JwtService, payload: JwtPayload) {
  const accessToken = jwtService.sign(payload);

  // Add a unique identifier to refresh token payload to prevent reuse
  const refreshPayload = {
    ...payload,
    countEx: 5,
  };

  const refreshToken = jwtService.sign(refreshPayload, {
    secret: process.env.JWT_REFRESH_SECRET,
    expiresIn: process.env.JWT_REFRESH_EXPIRATION_TIME || '7d',
  });

  return {
    accessToken,
    refreshToken,
  };
}

export default generateTokens;
