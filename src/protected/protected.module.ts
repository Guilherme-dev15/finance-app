import { Module } from '@nestjs/common';
import { ProtectedController } from './protected.controller'; // Importando o controller
import { AuthModule } from '../modules/auth/auth.module'; // Importando o módulo de autenticação

@Module({
  imports: [AuthModule],  // Importando o módulo de autenticação para usar o AuthGuard
  controllers: [ProtectedController],  // Registrando o ProtectedController
})
export class ProtectedModule {}
