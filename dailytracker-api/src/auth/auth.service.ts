import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from 'src/users/users.entity';
import { UsersService } from 'src/users/users.service';
import { LoginDto, RegisterDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
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
}