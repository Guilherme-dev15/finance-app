import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    console.log('JwtStrategy foi carregado!'); // 🚀 Debug

    const secret = configService.get<string>('JWT_SECRET');

    if (!secret) {
      throw new Error('JWT_SECRET não está definido no arquivo .env'); // Erro mais claro
    }
    
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: secret, // Agora temos certeza de que não é undefined
    });
  }

  async validate(payload: any) {
    console.log('Payload recebido no JwtStrategy:', payload); // 🚀 Debug
    if (!payload?.sub) {
      throw new UnauthorizedException('Token inválido');
    }
    return { userId: payload.sub, email: payload.email };
  }
}
