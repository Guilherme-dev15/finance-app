import { IsNotEmpty, IsNumber, IsDateString, Min, IsOptional, IsEnum, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum DebtStatus {
    PENDING = 'pendente',
    PAID = 'pago',
    NEGOTIATED = 'em negociação',
}

export enum DebtType {
    LOAN = 'LOAN',
    CREDIT_CARD = 'CREDIT_CARD',
    PERSONAL = 'PERSONAL',
  }
  

export class CreateDebtDto {
    @ApiProperty({ example: 1000, description: 'Valor original da dívida', minimum: 0 })
    @IsNotEmpty({ message: 'O valor original da dívida é obrigatório.' })
    @IsNumber()
    @Min(0, { message: 'O valor original da dívida não pode ser negativo.' })
    originalAmount: number;

    @ApiProperty({ example: '2025-12-31', description: 'Data de vencimento da dívida', format: 'date' })
    @IsNotEmpty({ message: 'A data de vencimento é obrigatória.' })
    @IsDateString({}, { message: 'A data de vencimento deve estar no formato correto (YYYY-MM-DD).' })
    dueDate: Date;

    @ApiProperty({ example: 'Dívida do cartão', description: 'Descrição da dívida' })
    @IsNotEmpty({ message: 'A descrição da dívida é obrigatória.' })
    @IsString()
    description: string;

    @ApiProperty({ example: 500, description: 'Valor atual da dívida', minimum: 0 })
    @IsNotEmpty({ message: 'O valor atual da dívida é obrigatório.' })
    @IsNumber()
    @Min(0, { message: 'O valor atual da dívida não pode ser negativo.' })
    currentAmount: number;

    @ApiProperty({ example: 12, description: 'Número de parcelas restantes', minimum: 1 })
    @IsNotEmpty({ message: 'O número de parcelas restantes é obrigatório.' })
    @IsNumber()
    @Min(1, { message: 'O número de parcelas restantes deve ser pelo menos 1.' })
    remainingInstallments: number;

    @ApiProperty({ example: 2.5, description: 'Taxa de juros ao mês', required: false })
    @IsOptional()
    @IsNumber()
    interestRate?: number;

    @ApiProperty({ example: DebtStatus.PENDING, enum: DebtStatus, description: 'Status da dívida', required: false })
    @IsOptional()
    @IsEnum(DebtStatus, { message: 'Status deve ser um dos seguintes: pendente, pago, em negociação.' })
    status?: DebtStatus;

    @ApiProperty({ example: DebtType.CREDIT_CARD, enum: DebtType, description: 'Tipo da dívida', required: false })
    @IsOptional()
    @IsEnum(DebtType, { message: 'Tipo de dívida deve ser "LOAN", "CREDIT_CARD" ou "PERSONAL"' })
    debtType?: DebtType;

}
