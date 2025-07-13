import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from '../common/jwt/jwt.payload';
import generateTokens from '../common/jwt/generateTokens';
import * as bcrypt from 'bcrypt';

type UserData = {
  email: string;
  firstName: string;
  lastName: string;
  picture: string;
};

function generatePassword(length: number = 12): string {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  const all = upper + lower + numbers + symbols;

  let password = '';
  password += upper[Math.floor(Math.random() * upper.length)];
  password += lower[Math.floor(Math.random() * lower.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  for (let i = 4; i < length; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }

  // Shuffle the password to avoid predictable character positions
  return password
    .split('')
    .sort(() => 0.5 - Math.random())
    .join('');
}

@Injectable()
export class OauthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  public async validateUser(userData: UserData): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email: userData.email },
    });
    if (!user) {
      // If user does not exist, create a new user
      const hashedPassword = bcrypt.hashSync(
        generatePassword(),
        10, // bcrypt salt rounds
      );

      const newUser = await this.prisma.user.create({
        data: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          picture: userData.picture,
          password: hashedPassword,
        },
      });

      const payload: JwtPayload = {
        id: newUser.id,
        email: newUser.email,
      };
      const tokens = generateTokens(this.jwtService, payload);

      return {
        message: 'User created successfully',
        user: newUser,
        ...tokens,
      };
    }

    // If user exists, generate tokens
    const payload: JwtPayload = {
      id: user.id,
      email: user.email,
    };
    const tokens = generateTokens(this.jwtService, payload);
    return {
      message: 'User signed in successfully',
      user,
      ...tokens,
    };
  }
}
