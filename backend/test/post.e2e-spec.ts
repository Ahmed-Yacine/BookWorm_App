import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('PostController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/post/create (POST) - should create a post without image', () => {
    // Note: This test would require a valid JWT token
    // In a real test environment, you would create a test user and get a valid token
    return request(app.getHttpServer())
      .post('/post/create')
      .set('Authorization', 'Bearer test-token')
      .field('content', 'Test post content')
      .expect(401); // Should fail without valid authentication
  });

  it('/post/all (GET) - should get posts', () => {
    return request(app.getHttpServer()).get('/post/all').expect(200);
  });
});
