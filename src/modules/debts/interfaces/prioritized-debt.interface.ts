export interface PrioritizedDebt {
    id: string; // ID da dívida
    name: string; // Nome da dívida
    interestRate: number; // Taxa de juros
    remainingInstallments: number; // Parcelas restantes
    dueDate: Date; // Data de vencimento
    monthlyInstallment: number; // Valor da parcela mensal
}