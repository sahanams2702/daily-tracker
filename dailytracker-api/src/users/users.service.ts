import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './users.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly users: Repository<User>) {}

  findByEmail(email: string) {
    return this.users.findOneBy({ email: email.trim().toLowerCase() });
  }

  findById(id: number) {
    return this.users.findOneBy({ id: String(id) });
  }

  create(name: string, email: string, password_hash: string) {
    return this.users.save(
      this.users.create({ name: name.trim(), email: email.trim().toLowerCase(), password_hash }),
    );
  }
}