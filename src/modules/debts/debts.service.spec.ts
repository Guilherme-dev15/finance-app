import { Test, TestingModule } from '@nestjs/testing';
import { DebtsService } from './debts.service';
import { getModelToken } from '@nestjs/mongoose';
import { Debt } from './schemas/debts.model';
import { HttpException } from '@nestjs/common';
import { CreateDebtDto, DebtStatus, DebtType } from './dto/create-debt.dto';
import { Model } from 'mongoose';

describe('DebtsService', () => {
  let service: DebtsService;
  let debtModel: jest.Mocked<Model<Debt>>;

  const mockSave = jest.fn();
  const mockFind = jest.fn();

  const mockDebtData = {
    _id: 'mockedId',
    userId: 'user123',
    description: 'Cartão',
    originalAmount: 1000,
    currentAmount: 1000,
    dueDate: new Date(),
    interestRate: 2,
    remainingInstallments: 10,
    status: DebtStatus.PENDING,
    debtType: 'credit',
  };

  beforeEach(async () => {
    // Cria um mock do model com os métodos esperados
    const mockDebtModel: Partial<jest.Mocked<Model<Debt>>> = {
      find: mockFind,
    };

    const mockConstructor = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: mockSave,
    }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DebtsService,
        {
          provide: getModelToken(Debt.name),
          useValue: Object.assign(mockConstructor, mockDebtModel),
        },
      ],
    }).compile();

    service = module.get<DebtsService>(DebtsService);
    debtModel = module.get(getModelToken(Debt.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createDebt', () => {
    it('deve criar uma dívida com sucesso', async () => {
      const createDto: CreateDebtDto = {
        description: 'Empréstimo',
        originalAmount: 1000,
        currentAmount: 1000,
        dueDate: new Date(),
        interestRate: 1.5,
        remainingInstallments: 5,
        status: DebtStatus.PENDING,
        debtType: DebtType.LOAN,
      };

      mockSave.mockResolvedValueOnce(mockDebtData);

      const result = await service.createDebt('user123', createDto);

      expect(result).toEqual(mockDebtData);
      expect(mockSave).toHaveBeenCalled();
    });

    it('deve lançar exceção se originalAmount <= 0', async () => {
      const createDto: CreateDebtDto = {
        description: 'Dívida inválida',
        originalAmount: 0,
        currentAmount: 0,
        dueDate: new Date(),
        interestRate: 1.5,
        remainingInstallments: 3,
        status: DebtStatus.PENDING,
        debtType: DebtType.LOAN,
      };

      await expect(service.createDebt('user123', createDto)).rejects.toThrow(HttpException);
    });
  });

  describe('listDebts', () => {
    it('deve retornar todas as dívidas do usuário sem filtro de status', async () => {
      const userId = 'user123';
      const mockDebts = [
        { _id: 'debt1', userId, description: 'Cartão de crédito', originalAmount: 1000, currentAmount: 900, status: 'pending' },
        { _id: 'debt2', userId, description: 'Empréstimo pessoal', originalAmount: 2000, currentAmount: 1500, status: 'pending' },
      ];

      mockFind.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValueOnce(mockDebts),
      });

      const result = await service.listDebts(userId);

      expect(result).toEqual(mockDebts);
      expect(mockFind).toHaveBeenCalledWith({ userId });
    });
  });

  describe('getDebtById', () => {
    it('deve retornar a dívida corretamente se existir', async () => {
      const userId = 'user123';
      const debtId = 'debt456';

      const mockDebt = { ...mockDebtData, _id: debtId };

      debtModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockDebt),
      });

      const result = await service.getDebtById(userId, debtId);

      expect(result).toEqual(mockDebt);
      expect(debtModel.findOne).toHaveBeenCalledWith({ _id: debtId, userId });
    });

    it('deve lançar exceção se a dívida não for encontrada', async () => {
      const userId = 'user123';
      const debtId = 'debt999';

      debtModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.getDebtById(userId, debtId)).rejects.toThrow(HttpException);
      expect(debtModel.findOne).toHaveBeenCalledWith({ _id: debtId, userId });
    });
  });

  describe('editDebt', () => {
    it('deve atualizar a dívida corretamente quando encontrada', async () => {
      const userId = 'user123';
      const debtId = 'mockedId';
      const updateDto: CreateDebtDto = {
        description: 'Nova descrição',
        originalAmount: 5000,
        dueDate: new Date('2025-08-01'),
        currentAmount: 4500,
        remainingInstallments: 10,
        interestRate: 2,
        status: DebtStatus.PENDING,
        debtType: DebtType.LOAN,
      };

      const mockUpdatedDebt = {
        _id: debtId,
        userId,
        ...updateDto,
      };

      const mockFindOneAndUpdate = jest.fn().mockResolvedValue(mockUpdatedDebt);

      debtModel.findOneAndUpdate = mockFindOneAndUpdate;

      const result = await service.editDebt(userId, debtId, updateDto);

      expect(result.description).toBe(updateDto.description);
      expect(debtModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: debtId, userId },
        updateDto,
        { new: true }
      );
    });

    it('deve lançar exceção se a dívida não for encontrada', async () => {
      const userId = 'user123';
      const debtId = 'nonexistentId';
      const updateDto: CreateDebtDto = {
        description: 'Atualização válida',
        originalAmount: 1000,
        dueDate: new Date(),
        currentAmount: 800,
        remainingInstallments: 4,
        interestRate: 1,
        status: DebtStatus.PENDING,
        debtType: DebtType.LOAN,
      };

      const mockFindOneAndUpdate = jest.fn().mockResolvedValue(null);

      debtModel.findOneAndUpdate = mockFindOneAndUpdate;

      await expect(service.editDebt(userId, debtId, updateDto)).rejects.toThrow('Dívida não encontrada');
    });
  });

  describe('deleteDebt', () => {
    it('deve excluir a dívida quando encontrada', async () => {
      const userId = 'user123';
      const debtId = 'mockedId';

      const mockFindOneAndDelete = jest.fn().mockResolvedValue({ _id: debtId, userId });

      debtModel.findOneAndDelete = mockFindOneAndDelete;

      await service.deleteDebt(userId, debtId);

      expect(debtModel.findOneAndDelete).toHaveBeenCalledWith({ userId, _id: debtId });
    });

    it('deve lançar exceção se a dívida não for encontrada', async () => {
      const userId = 'user123';
      const debtId = 'nonexistentId';

      const mockFindOneAndDelete = jest.fn().mockResolvedValue(null);

      debtModel.findOneAndDelete = mockFindOneAndDelete;

      await expect(service.deleteDebt(userId, debtId)).rejects.toThrow('Dívida não encontrada');
    });
  });

  describe('simulatePayment', () => {
    it('deve simular corretamente o pagamento com juros', async () => {
      const userId = 'user123';
      const debtId = 'mockedDebtId';
      const paymentAmount = 200;

      const mockDebt = {
        _id: debtId,
        userId,
        currentAmount: 1000,
        interestRate: 12, // 12% ao ano → 1% ao mês
      };

      const mockFindOne = jest.fn().mockResolvedValue(mockDebt);
      debtModel.findOne = mockFindOne;

      const result = await service.simulatePayment(userId, debtId, paymentAmount);

      expect(result.monthsToPay).toBeGreaterThan(0);
      expect(result.remainingAmount).toBe(0);
      expect(debtModel.findOne).toHaveBeenCalledWith({ userId, _id: debtId });
    });

    it('deve lançar erro se a dívida não for encontrada', async () => {
      const userId = 'user123';
      const debtId = 'nonexistentId';
      const paymentAmount = 200;

      const mockFindOne = jest.fn().mockResolvedValue(null);
      debtModel.findOne = mockFindOne;

      await expect(service.simulatePayment(userId, debtId, paymentAmount)).rejects.toThrow('Dívida não encontrada');
    });

    it('deve lançar erro se o valor do pagamento for zero ou negativo', async () => {
      const userId = 'user123';
      const debtId = 'mockedDebtId';
      const paymentAmount = 0;

      const mockDebt = {
        _id: debtId,
        userId,
        currentAmount: 1000,
        interestRate: 12,
      };

      const mockFindOne = jest.fn().mockResolvedValue(mockDebt);
      debtModel.findOne = mockFindOne;

      await expect(service.simulatePayment(userId, debtId, paymentAmount)).rejects.toThrow('O valor do pagamento deve ser maior que zero');
    });

    it('deve simular corretamente pagamento com taxa de juros zero', async () => {
      const userId = 'user123';
      const debtId = 'mockedDebtId';
      const paymentAmount = 250;

      const mockDebt = {
        _id: debtId,
        userId,
        currentAmount: 1000,
        interestRate: 0, // Sem juros
      };

      const mockFindOne = jest.fn().mockResolvedValue(mockDebt);
      debtModel.findOne = mockFindOne;

      const result = await service.simulatePayment(userId, debtId, paymentAmount);

      expect(result.monthsToPay).toBe(4);
      expect(result.remainingAmount).toBe(0);
    });
  });

  describe('generateDebtReport', () => {
    it('deve gerar um relatório correto dentro do intervalo de datas', async () => {
      const userId = 'user123';
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-12-31');

      const mockDebts = [
        {
          _id: 'debt1',
          description: 'Cartão de crédito',
          originalAmount: 3000,
          currentAmount: 1000,
          dueDate: new Date('2025-06-01'),
          status: DebtStatus.PENDING,
        },
        {
          _id: 'debt2',
          description: 'Empréstimo pessoal',
          originalAmount: 5000,
          currentAmount: 3000,
          dueDate: new Date('2025-10-01'),
          status: DebtStatus.PAID,
        },
      ];

      const mockExec = jest.fn().mockResolvedValue(mockDebts);

      debtModel.find = jest.fn().mockReturnValue({ exec: mockExec });

      const result = await service.generateDebtReport(userId, startDate, endDate);

      expect(result.totalDebt).toBe(8000);
      expect(result.totalPaid).toBe(4000); // 2000 + 2000 pagos
      expect(result.debts).toHaveLength(2);
      expect(result.debts[0]).toHaveProperty('description', 'Cartão de crédito');
      expect(result.debts[1]).toHaveProperty('status', DebtStatus.PAID);

      expect(debtModel.find).toHaveBeenCalledWith({
        userId,
        dueDate: { $gte: startDate, $lte: endDate },
      });
    });

    it('deve retornar valores zerados se não houver dívidas no intervalo', async () => {
      const userId = 'user123';
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-12-31');

      const mockExec = jest.fn().mockResolvedValue([]);

      debtModel.find = jest.fn().mockReturnValue({ exec: mockExec });

      const result = await service.generateDebtReport(userId, startDate, endDate);

      expect(result.totalDebt).toBe(0);
      expect(result.totalPaid).toBe(0);
      expect(result.debts).toEqual([]);
    });
  });



});
