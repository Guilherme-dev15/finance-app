import { DebtType } from '../dto/create-debt.dto';

export class DebtCalculationService {
  static calculateByDebtType(debtType: DebtType, debtData: any): number {
    switch (debtType) {
      case DebtType.LOAN:
        return this.calculateLoan(debtData);
      case DebtType.CREDIT_CARD:
        return this.calculateCreditCard(debtData);
      case DebtType.PERSONAL:
        return this.calculatePersonal(debtData);
      default:
        throw new Error(`Tipo de dívida inválido para cálculo: ${debtType}`);
    }
  }

  private static calculateLoan(data: any): number {
    // Exemplo: juros compostos
    const { currentAmount, interestRate, remainingInstallments } = data;
    const monthlyRate = (interestRate ?? 0) / 100;
    return currentAmount * Math.pow(1 + monthlyRate, remainingInstallments);
  }

  private static calculateCreditCard(data: any): number {
    // Exemplo: juros compostos + taxa extra
    const { currentAmount, interestRate } = data;
    const monthlyRate = (interestRate ?? 0) / 100;
    return currentAmount * (1 + monthlyRate) * 1.05;
  }

  private static calculatePersonal(data: any): number {
    // Exemplo: valor fixo + taxa administrativa
    return data.currentAmount + 20;
  }
}
