import { Injectable, HttpException, HttpStatus, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Debt } from './schemas/debts.model';
import { CreateDebtDto, DebtStatus, DebtType } from './dto/create-debt.dto';

// Exportando a interface
export interface EvolutionData {
  month: number;
  amount: number;
}

@Injectable()
export class DebtsService {
  private readonly logger = new Logger(DebtsService.name);
  constructor(@InjectModel(Debt.name) private debtModel: Model<Debt>) { }

  async createDebt(userId: string, debtData: CreateDebtDto): Promise<Debt> {
    this.validateDebtData(debtData);
    try {
      const newDebt = new this.debtModel({ userId, ...debtData });
      return await newDebt.save();
    } catch (error) {
      this.logger.error('Error saving debt', error.stack);
      throw new HttpException(
        'Error creating debt',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private validateDebtData(debtData: CreateDebtDto): void {
    if (debtData.originalAmount <= 0) {
      throw new HttpException('Original amount must be positive', HttpStatus.BAD_REQUEST);
    }
  }

  async listDebts(userId: string, status?: string) {
    const filter: any = { userId };
    if (status) {
      filter['status'] = status;
    }
    return this.debtModel.find(filter).exec();
  }
  async getDebtById(userId: string, debtId: string): Promise<Debt> {
    const debt = await this.debtModel.findOne({ _id: debtId, userId }).exec();
    if (!debt) {
      throw new HttpException('Debt not found', 404);
    }
    return debt;
  }

  async editDebt(userId: string, debtId: string, debtData: CreateDebtDto) {
    this.validateDebtData(debtData); // Valida os dados da dívida

    const updatedDebt = await this.debtModel.findOneAndUpdate(
      { userId, _id: debtId },
      { ...debtData },
      { new: true }
    );

    if (!updatedDebt) {
      throw new NotFoundException('Dívida não encontrada');
    }

    return updatedDebt;
  }

  async deleteDebt(userId: string, debtId: string) {
    const debt = await this.debtModel.findOneAndDelete({ userId, _id: debtId });
    if (!debt) {
      throw new NotFoundException('Dívida não encontrada');
    }
    return { message: 'Dívida deletada com sucesso' };
  }

  async payDebt(userId: string, debtId: string, paymentAmount: number) {
    const debt = await this.debtModel.findOne({ userId, _id: debtId });

    if (!debt) {
      throw new NotFoundException('Dívida não encontrada');
    }

    if (paymentAmount <= 0) {
      throw new HttpException('O valor do pagamento deve ser maior que zero', HttpStatus.BAD_REQUEST);
    }

    debt.currentAmount -= paymentAmount;

    if (debt.currentAmount <= 0) {
      debt.currentAmount = 0;
      debt.status = DebtStatus.PAID; // Use a constante correta para o status
    }

    await debt.save();
    return debt;
  }

  calculateTotalDebt(originalAmount: number, interestRate: number, periods: number, type: 'simple' | 'compound'): number {
    if (interestRate === undefined || isNaN(interestRate)) {
      throw new HttpException('A taxa de juros é obrigatória e deve ser um número', HttpStatus.BAD_REQUEST);
    }

    let totalDebt: number;

    if (type === 'simple') {
      totalDebt = originalAmount * (1 + (interestRate / 100) * periods);
    } else if (type === 'compound') {
      totalDebt = originalAmount * Math.pow(1 + (interestRate / 100), periods);
    } else {
      throw new HttpException('Tipo de cálculo de juros inválido', HttpStatus.BAD_REQUEST);
    }

    if (isNaN(totalDebt)) {
      throw new HttpException('Erro no cálculo da dívida', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return totalDebt;
  }

  async updateDebtInterest(userId: string, debtId: string, debtData: CreateDebtDto) {
    const debt = await this.debtModel.findOne({ userId, _id: debtId });

    if (!debt) {
      throw new NotFoundException('Dívida não encontrada');
    }

    const debtType: DebtType = debtData.debtType || DebtType.LOAN; // Default to loan if not specified
    const periods = debt.remainingInstallments;

    let interestRate: number = debtData.interestRate || 0;

    if (isNaN(interestRate)) {
      throw new HttpException('A taxa de juros deve ser um número válido', HttpStatus.BAD_REQUEST);
    }

    let totalDebt: number;

    if (debtType === DebtType.LOAN) {
      totalDebt = this.calculateTotalDebt(debt.originalAmount, interestRate, periods, 'compound');
    } else if (debtType === DebtType.CREDIT_CARD) {
      totalDebt = this.calculateTotalDebt(debt.originalAmount, interestRate, periods, 'simple');
    } else {
      throw new HttpException('Tipo de dívida inválido', HttpStatus.BAD_REQUEST);
    }

    debt.currentAmount = totalDebt;
    debt.status = debtData.status || debt.status;

    await debt.save();
    return debt;
  }

  async simulatePayment(userId: string, debtId: string, paymentAmount: number) {
    const debt = await this.debtModel.findOne({ userId, _id: debtId });

    if (!debt) {
      throw new NotFoundException('Dívida não encontrada');
    }

    if (paymentAmount <= 0) {
      throw new HttpException('O valor do pagamento deve ser maior que zero', HttpStatus.BAD_REQUEST);
    }

    let remainingAmount = debt.currentAmount;
    let monthsToPay = 0;
    const monthlyInterest = (debt.interestRate || 0) / 100 / 12; // Taxa mensal

    while (remainingAmount > 0) {
      remainingAmount += remainingAmount * monthlyInterest - paymentAmount;
      monthsToPay++;

      if (remainingAmount < 0) {
        remainingAmount = 0; // A dívida foi quitada
      }
    }

    return { monthsToPay, remainingAmount };
  }

  async getDebtEvolution(userId: string, debtId: string) {
    const debt = await this.debtModel.findOne({ userId, _id: debtId });

    if (!debt) {
      throw new NotFoundException('Dívida não encontrada');
    }

    let remainingAmount = debt.currentAmount;
    const evolutionData: EvolutionData[] = [];
    const months = debt.remainingInstallments;
    const monthlyInterest = (debt.interestRate || 0) / 100 / 12; // Taxa mensal

    for (let i = 0; i < months; i++) {
      remainingAmount += remainingAmount * monthlyInterest;
      evolutionData.push({ month: i + 1, amount: remainingAmount });
    }

    return evolutionData;
  }

  async sendDebtNotification(debt: Debt) {
    const currentDate = new Date();
    const dueDate = new Date(debt.dueDate);

    if (currentDate > dueDate && debt.status !== DebtStatus.PAID) {
      console.log(`ALERTA: A dívida com ID ${debt._id} está vencida!`);
    }
  }

  async generateDebtReport(userId: string, startDate: Date, endDate: Date) {
    const debts = await this.debtModel.find({
      userId,
      dueDate: { $gte: startDate, $lte: endDate },
    }).exec();

    const totalDebt = debts.reduce((sum, debt) => sum + debt.originalAmount, 0);
    const totalPaid = debts.reduce((sum, debt) => sum + (debt.originalAmount - debt.currentAmount), 0);

    return {
      totalDebt,
      totalPaid,
      debts: debts.map(debt => ({
        id: debt._id,
        description: debt.description,
        originalAmount: debt.originalAmount,
        currentAmount: debt.currentAmount,
        dueDate: debt.dueDate,
        status: debt.status,
      })),
    };
  }

  async simulatePaymentProjection(userId: string, debtId: string, newPaymentAmount: number, newInterestRate: number) {
    const debt = await this.debtModel.findOne({ userId, _id: debtId });

    if (!debt) {
      throw new NotFoundException('Dívida não encontrada');
    }

    let remainingAmount = debt.currentAmount;
    let monthsToPay = 0;
    const monthlyInterest = newInterestRate / 100 / 12;

    while (remainingAmount > 0) {
      remainingAmount += remainingAmount * monthlyInterest - newPaymentAmount;
      monthsToPay++;

      if (remainingAmount < 0) {
        remainingAmount = 0;
      }
    }

    return { monthsToPay, remainingAmount };
  }
}