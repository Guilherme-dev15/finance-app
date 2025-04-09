import { Test, TestingModule } from '@nestjs/testing';
import { DebtsService } from './debts.service';
import { Debt } from './schemas/debts.model';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { HttpException, HttpStatus } from '@nestjs/common';
import { CreateDebtDto } from './dto/create-debt.dto';

describe('DebtsService', () => {
  let service: DebtsService;
  let model: Model<Debt>;

  // Mock da instância da dívida
  const saveMock = jest.fn();
  const mockDebtInstance = {
    save: saveMock,
  };

  // Mock da Model do Mongoose
  const mockDebtModel = jest.fn().mockImplementation(() => mockDebtInstance);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DebtsService,
        {
          provide: getModelToken(Debt.name),
          useValue: mockDebtModel,
        },
      ],
    }).compile();

    service = module.get<DebtsService>(DebtsService);
    model = module.get<Model<Debt>>(getModelToken(Debt.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createDebt', () => {
    it('should create a debt and return the correct result', async () => {
      const createDebtDto: CreateDebtDto = {
        originalAmount: 1000,
        description: 'Test debt',
        dueDate: new Date(),
        currentAmount: 1000,
        remainingInstallments: 12,
      };

      const expectedResult = { ...mockDebtInstance, _id: 'mocked-id' };
      saveMock.mockResolvedValueOnce(expectedResult);

      const result = await service.createDebt('user123', createDebtDto);

      expect(saveMock).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });

    it('should throw HttpException if the save fails', async () => {
      saveMock.mockRejectedValueOnce(
        new HttpException('Error creating debt', HttpStatus.BAD_REQUEST),
      );

      const createDebtDto: CreateDebtDto = {
        originalAmount: 1000,
        description: 'Test debt',
        dueDate: new Date(),
        currentAmount: 1000,
        remainingInstallments: 12,
      };

      await expect(service.createDebt('user123', createDebtDto)).rejects.toThrowError(
        new HttpException('Error creating debt', HttpStatus.BAD_REQUEST),
      );
    });
  });
});
