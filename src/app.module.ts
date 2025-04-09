import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { ProtectedModule } from './protected/protected.module'; 
import { DebtsModule } from './modules/debts/debts.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI', 'mongodb://localhost:27017/finance-app'),
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    DebtsModule,
    ProtectedModule,  // Agora adicionando o ProtectedModule ao AppModule
  ],
})
export class AppModule {}
