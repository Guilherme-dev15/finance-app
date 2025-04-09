import { Controller, Post, Get, Body, Request, UseGuards, Put, Param, Delete, HttpException, HttpStatus, Query, Patch } from '@nestjs/common';
import { DebtsService } from './debts.service';
import { AuthGuard } from '@nestjs/passport';
import { CreateDebtDto } from './dto/create-debt.dto';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { PayDebtDto } from '../debts/dto/pay.debt.dto'
import { JwtAuthGuard } from './guards/user.guard';
import { Logger } from '@nestjs/common';  // Importe o Logger
import { SimulatePaymentDto } from './dto/simulate-payment.dto';

// Função auxiliar para validar o userId
function validateUserId(req: any): string {
    const userId = req.user?.userId;
    if (!userId) {
        throw new HttpException('User ID is required', HttpStatus.BAD_REQUEST);
    }
    return userId;
}

@ApiTags('Dívidas')
@ApiBearerAuth()
@Controller('debts')
@UseGuards(AuthGuard('jwt')) // Protege todas as rotas com JWT

export class DebtsController {
    private readonly logger = new Logger(DebtsController.name);
    constructor(private readonly debtsService: DebtsService) { }

    @Post()
    @ApiOperation({ summary: 'Criar uma nova dívida' })
    @ApiResponse({ status: 201, description: 'Dívida criada com sucesso' })
    @ApiResponse({ status: 400, description: 'Erro ao criar dívida' })
    async createDebt(@Request() req, @Body() debtData: CreateDebtDto) {
        const userId = req.user.userId;
        this.logger.log(`Iniciando criação de dívida para o usuário ${userId}`);  // Log de início da criação
        try {
            const result = await this.debtsService.createDebt(userId, debtData);
            this.logger.log('Dívida criada com sucesso');  // Log de sucesso
            return result;
        } catch (error) {
            this.logger.error('Erro ao criar dívida', error.stack);  // Log de erro
            throw new HttpException(error.message || 'Failed to create debt', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Get()
    @ApiOperation({ summary: 'Listar dívidas' })
    @ApiResponse({ status: 200, description: 'Listagem de dívidas' })
    @ApiResponse({ status: 500, description: 'Erro ao listar dívidas' })
    async listDebts(@Request() req, @Query('status') status?: string) {
        const userId = validateUserId(req);
        try {
            return await this.debtsService.listDebts(userId, status);
        } catch (error) {
            throw new HttpException(error.message || 'Failed to list debts', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Put(':id')
    @ApiParam({ name: 'id', description: 'ID da dívida' })
    @ApiBody({ type: CreateDebtDto })
    @ApiOperation({ summary: 'Editar uma dívida' })
    async editDebt(@Request() req, @Param('id') debtId: string, @Body() debtData: CreateDebtDto) {
        const userId = validateUserId(req);
        try {
            return await this.debtsService.editDebt(userId, debtId, debtData);
        } catch (error) {
            throw new HttpException(error.message || 'Failed to edit debt', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Delete(':id')
    @ApiParam({ name: 'id', description: 'ID da dívida' })
    @ApiOperation({ summary: 'Deletar uma dívida' })
    async deleteDebt(@Request() req, @Param('id') debtId: string) {
        const userId = validateUserId(req);
        try {
            return await this.debtsService.deleteDebt(userId, debtId);
        } catch (error) {
            throw new HttpException(error.message || 'Failed to delete debt', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Patch(':id/pay')
    @ApiOperation({ summary: 'Realizar pagamento de dívida' })
    @ApiBody({ type: PayDebtDto })
    @ApiResponse({ status: 200, description: 'Pagamento realizado com sucesso' })
    @ApiResponse({ status: 400, description: 'Valor de pagamento inválido' })
    async payDebt(
        @Request() req,
        @Param('id') debtId: string,
        @Body() paymentData: PayDebtDto,
    ) {
        const userId = validateUserId(req);
        if (paymentData.paymentAmount <= 0) {
            throw new HttpException('O valor do pagamento deve ser maior que zero', HttpStatus.BAD_REQUEST);
        }

        try {
            const result = await this.debtsService.payDebt(userId, debtId, paymentData.paymentAmount);
            if (!result) {
                throw new HttpException('Pagamento não realizado', HttpStatus.INTERNAL_SERVER_ERROR);
            }
            return {

                message: 'Pagamento realizado com sucesso!',
                data: result,
            };

        } catch (error) {
            throw new HttpException(
                error?.message || 'Falha ao processar o pagamento',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Post(':id/simulate-payment')
    @ApiOperation({ summary: 'Simular pagamento da dívida' })
    @ApiResponse({
        status: 200,
        description: 'Simulação de pagamento realizada com sucesso.',
    })
    @ApiResponse({
        status: 400,
        description: 'Valor de pagamento inválido.',
    })
    @ApiResponse({
        status: 500,
        description: 'Falha interna ao simular o pagamento.',
    })
    async simulatePayment(
        @Request() req,
        @Param('id') debtId: string,
        @Body() { paymentAmount }: SimulatePaymentDto // Agora estamos usando o DTO correto
    ) {
        const userId = req.user.userId;

        // Validação do paymentAmount
        if (paymentAmount <= 0) {
            throw new HttpException(
                'O valor do pagamento deve ser maior que zero',
                HttpStatus.BAD_REQUEST
            );
        }

        try {
            // Chama o serviço de simulação de pagamento
            const simulation = await this.debtsService.simulatePayment(userId, debtId, paymentAmount);
            return { message: 'Simulação realizada com sucesso!', data: simulation };
        } catch (error) {
            // Log de erro para o caso de falha na simulação
            throw new HttpException(error?.message || 'Falha ao simular o pagamento', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


    @Get(':id/evolution')
    @ApiParam({ name: 'id', description: 'ID da dívida' })
    @ApiOperation({ summary: 'Obter evolução da dívida' })
    async getDebtEvolution(@Request() req, @Param('id') debtId: string) {
        const userId = validateUserId(req);

        try {
            const evolution = await this.debtsService.getDebtEvolution(userId, debtId);
            return evolution;
        } catch (error) {
            throw new HttpException(error.message || 'Failed to retrieve debt evolution', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Get('report')
    @ApiOperation({ summary: 'Gerar relatório de dívidas' })
    @ApiQuery({ name: 'startDate', required: true, type: String, description: 'Data de início (formato: yyyy-mm-dd)' })
    @ApiQuery({ name: 'endDate', required: true, type: String, description: 'Data de término (formato: yyyy-mm-dd)' })
    async generateReport(
        @Request() req,
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string
    ) {
        const userId = req.user.userId;

        try {
            const report = await this.debtsService.generateDebtReport(
                userId,
                new Date(startDate),
                new Date(endDate)
            );
            return report;
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


    @Patch(':id/project-payment')
    @ApiParam({ name: 'id', type: String, description: 'ID da dívida' })
    @ApiBody({
        description: 'Projeção de pagamento da dívida',
        type: Object,
        schema: {
            type: 'object',
            properties: {
                newPaymentAmount: { type: 'number', example: 150, description: 'Novo valor de pagamento' },
                newInterestRate: { type: 'number', example: 5, description: 'Nova taxa de juros' },
            },
        },
    })

    @ApiOperation({ summary: 'Simular projeção de pagamento de dívida' })
    async simulatePaymentProjection(
        @Request() req,
        @Param('id') debtId: string,
        @Body() projectionData: { newPaymentAmount: number, newInterestRate: number }
    ) {
        const userId = validateUserId(req);

        try {
            const projection = await this.debtsService.simulatePaymentProjection(
                userId,
                debtId,
                projectionData.newPaymentAmount,
                projectionData.newInterestRate
            );
            return projection;
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
