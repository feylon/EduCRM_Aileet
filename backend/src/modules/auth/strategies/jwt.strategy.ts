import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthUser } from '../../../common/interfaces/auth-user.interface';
import { RedisService } from '../../../redis/redis.service';
import { UsersService } from '../../users/users.service';
import { AuthService, JwtPayload } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly usersService: UsersService,
    private readonly redis: RedisService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('jwt.accessSecret'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    if (payload.type !== 'access') {
      throw new UnauthorizedException({ code: 'INVALID_TOKEN', message: 'Invalid token' });
    }
    if (await this.redis.exists(AuthService.blacklistKey(payload.jti))) {
      throw new UnauthorizedException({ code: 'TOKEN_REVOKED', message: 'Token has been revoked' });
    }
    const user = await this.usersService.findActiveCached(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException({ code: 'ACCOUNT_DISABLED', message: 'Account is not active' });
    }
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      jti: payload.jti,
      exp: payload.exp as number,
    };
  }
}
