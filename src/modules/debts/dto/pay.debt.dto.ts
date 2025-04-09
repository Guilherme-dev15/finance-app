import { IsNotEmpty, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PayDebtDto {
    @ApiProperty({ example: 500, description: 'Valor do pagamento' })
    @IsNotEmpty()
    @IsNumber()
    @Min(1, { message: 'O valor de pagamento deve ser maior que zero' })
    paymentAmount: number;
}
