import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../../app.module';
import { Debt } from '../../schemas/debts.model';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';

describe('Debts Module (e2e)', () => {
  let app: INestApplication;
  let debtModel: Model<Debt>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    
    debtModel = moduleFixture.get<Model<Debt>>(getModelToken('Debt'));
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create a debt successfully', async () => {
    const response = await request(app.getHttpServer())
      .post('/debts')
      .send({
        userId: '12345',
        amount: 500,
        description: 'Test Debt',
      })
      .expect(201);

    expect(response.body).toHaveProperty('_id');
    expect(response.body.amount).toBe(500);
  });
});
