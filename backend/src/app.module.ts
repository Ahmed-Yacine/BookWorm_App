import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { OauthModule } from './oauth/oauth.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MailerModule.forRoot({
      transport: {
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USERNAME,
          pass: process.env.EMAIL_PASSWORD,
        },
      },
    }),
    PrismaModule,
    AuthModule,
    OauthModule,
    CloudinaryModule,
    UserModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
