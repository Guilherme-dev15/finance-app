import { DebtAssistantService } from '../debts.assistant.service';
import { Types } from 'mongoose';

describe('DebtAssistantService', () => {
    let service: DebtAssistantService;

    const debts = [
        {
            _id: new Types.ObjectId(),
            description: 'Cartão de Crédito',
            originalAmount: 1000,
            currentAmount: 1200,
            interestRate: 10,
            remainingInstallments: 12,
            dueDate: new Date('2025-06-01'),
            toObject: function () { return this; },
        },
        {
            _id: new Types.ObjectId(),
            description: 'Empréstimo Pessoal',
            originalAmount: 5000,
            currentAmount: 5200,
            interestRate: 5,
            remainingInstallments: 24,
            dueDate: new Date('2025-08-01'),
            toObject: function () { return this; },
        },
    ] as any[];

    const mockDebtModel = {
        find: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(debts), // devolve os dados simulados
    };

    beforeEach(() => {
        service = new DebtAssistantService(mockDebtModel as any);
    });

    it('deve priorizar corretamente as dívidas com base nos juros', async () => {
        const availableMonthlyAmount = 1000;
        const userId = new Types.ObjectId().toString(); 

        const result = await service.analyzeDebts(userId, availableMonthlyAmount);

        expect(result.prioritizedDebts[0].name).toBe('Cartão de Crédito');
        expect(result.prioritizedDebts[1].name).toBe('Empréstimo Pessoal');
    });
});
