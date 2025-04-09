import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
export class User extends Document {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: false })
  isBanned: boolean;

  @Prop({ type: [String], default: ['user'] })
  roles: string[];
}

export type UserDocument = User & Document;
export const UserSchema = SchemaFactory.createForClass(User);