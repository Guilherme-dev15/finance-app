import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional, IsDateString } from 'class-validator';

export class SimulatePaymentDto {
    @ApiProperty({
        description: 'Valor total da dívida',
        example: 1000,
    })
    @IsNumber()
    originalAmount: number;

    @ApiProperty({
        description: 'Data de vencimento da dívida',
        example: '2025-12-31',
    })
    @IsDateString()
    dueDate: string;

    @ApiProperty({
        description: 'Descrição do pagamento',
        example: 'Pagamento parcial',
        required: false,
    })
    @IsString()
    @IsOptional()
    description: string;

    @ApiProperty({
        description: 'Valor pago até o momento',
        example: 500,
    })
    @IsNumber()
    paidAmount: number;

    @ApiProperty({
        description: 'Número de parcelas restantes',
        example: 12,
    })
    @IsNumber()
    remainingInstallments: number;

    paymentAmount: number; // Campo principal para o valor do pagamento
}
