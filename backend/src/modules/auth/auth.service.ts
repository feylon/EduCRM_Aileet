import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { Role } from '../../common/enums/role.enum';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { durationToSeconds } from '../../common/utils/duration.util';
import { RedisService } from '../../redis/redis.service';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';

export interface JwtPayload {
  sub: string;
  role: Role;
  jti: string;
  type: 'access' | 'refresh';
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Redis keys:
 *  auth:refresh:{userId}:{jti}  — whitelist of valid refresh tokens (rotation on every refresh)
 *  auth:blacklist:{jti}         — revoked access tokens until they naturally expire
 *  auth:login-fail:{email}      — failed login counter for brute-force protection
 */
@Injectable()
export class AuthService {
  private readonly accessTtl: number;
  private readonly refreshTtl: number;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly redis: RedisService,
  ) {
    this.accessTtl = durationToSeconds(config.get<string>('jwt.accessExpiresIn', '15m'));
    this.refreshTtl = durationToSeconds(config.get<string>('jwt.refreshExpiresIn', '7d'));
  }

  static refreshKey(userId: string, jti: string) {
    return `auth:refresh:${userId}:${jti}`;
  }

  static blacklistKey(jti: string) {
    return `auth:blacklist:${jti}`;
  }

  private static loginFailKey(email: string) {
    return `auth:login-fail:${email.toLowerCase()}`;
  }

  async login(dto: LoginDto): Promise<AuthTokens & { user: User }> {
    const failKey = AuthService.loginFailKey(dto.email);
    const maxAttempts = this.config.get<number>('auth.maxLoginAttempts', 5);
    const lockout = this.config.get<number>('auth.lockoutSeconds', 900);

    const attempts = (await this.redis.get<number>(failKey)) || 0;
    if (attempts >= maxAttempts) {
      throw new HttpException(
        {
          code: 'LOGIN_LOCKED',
          message: 'Too many failed login attempts. Please try again later.',
          retryAfter: await this.redis.ttl(failKey),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const user = await this.usersService.findByEmailWithPassword(dto.email);
    const valid = user ? await this.usersService.comparePassword(dto.password, user.password) : false;
    if (!user || !valid) {
      await this.redis.increment(failKey, lockout);
      throw new UnauthorizedException({ code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' });
    }
    if (!user.isActive) {
      throw new UnauthorizedException({ code: 'ACCOUNT_DISABLED', message: 'Account is not active' });
    }

    await this.redis.del(failKey);
    await this.usersService.touchLastLogin(user.id);
    delete (user as Partial<User>).password;

    const tokens = await this.issueTokens(user.id, user.role);
    return { ...tokens, user };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.config.getOrThrow<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException({ code: 'INVALID_REFRESH_TOKEN', message: 'Invalid refresh token' });
    }
    if (payload.type !== 'refresh') {
      throw new UnauthorizedException({ code: 'INVALID_REFRESH_TOKEN', message: 'Invalid refresh token' });
    }

    const key = AuthService.refreshKey(payload.sub, payload.jti);
    if (!(await this.redis.exists(key))) {
      // Token was already used or revoked: possible theft, revoke every session of this user.
      await this.revokeAllSessions(payload.sub);
      throw new UnauthorizedException({ code: 'INVALID_REFRESH_TOKEN', message: 'Refresh token is no longer valid' });
    }
    await this.redis.del(key);

    const user = await this.usersService.findActiveCached(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException({ code: 'ACCOUNT_DISABLED', message: 'Account is not active' });
    }
    return this.issueTokens(user.id, user.role);
  }

  async logout(user: AuthUser, refreshToken?: string): Promise<void> {
    const remaining = user.exp - Math.floor(Date.now() / 1000);
    if (remaining > 0) await this.redis.set(AuthService.blacklistKey(user.jti), 1, remaining);

    if (refreshToken) {
      const payload = this.jwtService.decode(refreshToken) as JwtPayload | null;
      if (payload?.sub === user.id && payload.jti) {
        await this.redis.del(AuthService.refreshKey(user.id, payload.jti));
      }
    }
  }

  async revokeAllSessions(userId: string): Promise<void> {
    await this.redis.delByPattern(`auth:refresh:${userId}:*`);
  }

  private async issueTokens(userId: string, role: Role): Promise<AuthTokens> {
    const accessJti = randomUUID();
    const refreshJti = randomUUID();

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, role, jti: accessJti, type: 'access' },
        { secret: this.config.getOrThrow<string>('jwt.accessSecret'), expiresIn: this.accessTtl },
      ),
      this.jwtService.signAsync(
        { sub: userId, role, jti: refreshJti, type: 'refresh' },
        { secret: this.config.getOrThrow<string>('jwt.refreshSecret'), expiresIn: this.refreshTtl },
      ),
    ]);

    await this.redis.set(AuthService.refreshKey(userId, refreshJti), 1, this.refreshTtl);
    return { accessToken, refreshToken, expiresIn: this.accessTtl };
  }
}
