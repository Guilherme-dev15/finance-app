import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const user = request.user;  // JWT já validado aqui

    if (!user) {
      throw new UnauthorizedException('User ID is missing');
    }
    return super.canActivate(context);
  }
}
// Não consegui fazer funcionar no debts.controller pois da erro de autenticação 401 no swagger