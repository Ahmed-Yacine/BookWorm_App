import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { sessionMiddleware } from './common/middlewares/exp_ses.middleware';
import { passportSerializerMiddleware } from './common/middlewares/passport-serializer.middleware';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import * as passport from 'passport';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.use(cookieParser());
  app.use(sessionMiddleware());
  app.use(passport.initialize());
  app.use(passport.session());
  passportSerializerMiddleware(); // Configure passport serialization
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
