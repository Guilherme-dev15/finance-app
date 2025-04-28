import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../../../app.module';

describe('DebtsController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('POST /debts - success', async () => {
    return request(app.getHttpServer())
      .post('/debts')
      .set('Authorization', 'Bearer <token>')  // Coloque o token JWT correto
      .send({
        originalAmount: 1000,
        dueDate: '2025-12-31',
        description: 'Test debt',
        paidAmount: 0,
        remainingInstallments: 12,
      })
      .expect(201);  // Espera-se que a criação da dívida seja bem-sucedida
  });

  it('POST /debts - fail (missing required fields)', async () => {
    return request(app.getHttpServer())
      .post('/debts')
      .set('Authorization', 'Bearer <token>')  // Coloque o token JWT correto
      .send({
        originalAmount: 1000,
        dueDate: '2025-12-31',
        paidAmount: 0,
        remainingInstallments: 12,
      })
      .expect(400);  // Espera-se que falhe devido à falta de campo description
  });

  afterAll(async () => {
    await app.close();
  });
});
