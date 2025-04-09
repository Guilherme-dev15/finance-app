// src/modules/debts/debt.model.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../auth/user.model';

@Schema()
export class Debt extends Document {
    @Prop({ type: Types.ObjectId, ref: User.name, required: true })
    userId: Types.ObjectId;

    @Prop({ required: true })
    description: string;

    @Prop({ required: true, min: 0 })
    originalAmount: number;

    @Prop({ required: true, min: 0, default: 0 })
    interestRate: number;

    @Prop({ required: true, min: 0 })
    currentAmount: number;

    @Prop({ required: true, min: 1 })
    remainingInstallments: number;

    @Prop({ required: true })
    dueDate: Date;

    @Prop({ default: 'Em aberto' }) // Novo campo para o status da dívida
    status: string;  // "Em aberto", "Paga", etc.

    @Prop({ default: Date.now })
    createdAt: Date;
}

export const DebtSchema = SchemaFactory.createForClass(Debt); 