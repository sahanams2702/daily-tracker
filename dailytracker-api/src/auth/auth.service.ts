import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import { IsNull, MoreThan, Repository } from 'typeorm';
import { User } from 'src/users/users.entity';
import { UsersService } from 'src/users/users.service';
import { ForgotPasswordDto, LoginDto, RegisterDto, ResetPasswordDto } from './auth.dto';
import { MailService } from './mail.service';
import { PasswordResetToken } from './password-reset-token.entity';

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const sha256 = (v: string) => createHash('sha256').update(v).digest('hex');

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
    @InjectRepository(PasswordResetToken)
    private readonly tokens: Repository<PasswordResetToken>,
  ) {}

  private publicUser(u: User) {
    return { id: Number(u.id), name: u.name, email: u.email };
  }

  private async session(u: User) {
    const access_token = await this.jwt.signAsync({ sub: Number(u.id), email: u.email });
    return { access_token, user: this.publicUser(u) };
  }

  async register(dto: RegisterDto) {
    if (await this.users.findByEmail(dto.email)) {
      throw new ConflictException('That email is already registered');
    }
    const hash = await bcrypt.hash(dto.password, 10);
    return this.session(await this.users.create(dto.name, dto.email, hash));
  }

  async login(dto: LoginDto) {
    const user = await this.users.findByEmail(dto.email);
    // same message for "no such user" and "wrong password" so emails can't be probed
    if (!user || !user.is_active || !(await bcrypt.compare(dto.password, user.password_hash))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.session(user);
  }

  async me(id: number) {
    const user = await this.users.findById(id);
    if (!user || !user.is_active) throw new UnauthorizedException();
    return this.publicUser(user);
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    // always the same response, so emails can't be probed
    const message = 'If that email is registered, a reset link has been sent';

    const user = await this.users.findByEmail(dto.email);
    if (!user || !user.is_active) return { message };

    const userId = String(user.id);
    // only the newest link works
    await this.tokens.delete({ user_id: userId, used_at: IsNull() });

    const token = randomBytes(32).toString('hex');
    await this.tokens.save(
      this.tokens.create({
        user_id: userId,
        token_hash: sha256(token),
        expires_at: new Date(Date.now() + RESET_TOKEN_TTL_MS),
        used_at: null,
      }),
    );

    const frontend = this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
    const link = `${frontend}/reset-password?token=${token}`;
    try {
      await this.mail.sendPasswordReset(user.email, link);
    } catch (err) {
      // don't leak mail failures to the caller
      this.logger.error('Failed to send reset email', err as Error);
    }
    return { message };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const record = await this.tokens.findOne({
      where: {
        token_hash: sha256(dto.token),
        used_at: IsNull(),
        expires_at: MoreThan(new Date()),
      },
    });
    if (!record) throw new BadRequestException('This reset link is invalid or has expired');

    const hash = await bcrypt.hash(dto.password, 10);
    await this.tokens.manager.transaction(async (m) => {
      await m
        .createQueryBuilder()
        .update(User)
        .set({ password_hash: hash })
        .where('id = :id', { id: record.user_id })
        .execute();
      await m.update(
        PasswordResetToken,
        { user_id: record.user_id, used_at: IsNull() },
        { used_at: new Date() },
      );
    });
    return { message: 'Password updated. You can sign in now.' };
  }
}