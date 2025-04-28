import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DebtsService } from './debts.service';
import { DebtsController } from './debts.controller';
import { Debt, DebtSchema } from '../schemas/debts.model';
import { DebtAssistantService } from './debts.assistant.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Debt.name, schema: DebtSchema }])],
  providers: [DebtsService,
    DebtAssistantService
  ],
  controllers: [DebtsController],
  exports: [DebtsService, DebtAssistantService],
})
export class DebtsModule {}