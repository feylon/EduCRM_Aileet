import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { EntityManager, Repository } from 'typeorm';
import { Role } from '../../common/enums/role.enum';
import { Paginated } from '../../common/interfaces/paginated.interface';
import { likePattern, paginate } from '../../common/utils/paginate';
import { RedisService } from '../../redis/redis.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

const BCRYPT_ROUNDS = 10;
const USER_CACHE_TTL = 300;

export interface CreateUserData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  password: string;
  role: Role;
  isActive?: boolean;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    private readonly redis: RedisService,
  ) {}

  static cacheKey(id: string) {
    return `cache:user:${id}`;
  }

  hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
  }

  comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async findAll(query: QueryUsersDto): Promise<Paginated<User>> {
    const qb = this.usersRepository.createQueryBuilder('user');
    if (query.role) qb.andWhere('user.role = :role', { role: query.role });
    if (query.isActive !== undefined) qb.andWhere('user.isActive = :isActive', { isActive: query.isActive });
    if (query.search) {
      qb.andWhere(
        "(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search OR CONCAT(user.firstName, ' ', user.lastName) ILIKE :search)",
        { search: likePattern(query.search) },
      );
    }
    return paginate(
      qb,
      query,
      {
        createdAt: 'user.createdAt',
        firstName: 'user.firstName',
        lastName: 'user.lastName',
        email: 'user.email',
        role: 'user.role',
        lastLoginAt: 'user.lastLoginAt',
      },
      'createdAt',
    );
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException({ code: 'USER_NOT_FOUND', message: 'User not found' });
    return user;
  }

  /** Cached lookup used on every authenticated request (JWT strategy). */
  async findActiveCached(id: string): Promise<User | null> {
    const cached = await this.redis.get<User>(UsersService.cacheKey(id));
    if (cached) return cached;
    const user = await this.usersRepository.findOne({ where: { id } });
    if (user) await this.redis.set(UsersService.cacheKey(id), user, USER_CACHE_TTL);
    return user;
  }

  findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('LOWER(user.email) = LOWER(:email)', { email })
      .getOne();
  }

  async ensureEmailAvailable(email: string, exceptId?: string, manager?: EntityManager) {
    const repo = manager ? manager.getRepository(User) : this.usersRepository;
    const qb = repo.createQueryBuilder('user').where('LOWER(user.email) = LOWER(:email)', { email });
    if (exceptId) qb.andWhere('user.id != :exceptId', { exceptId });
    if (await qb.getExists()) {
      throw new ConflictException({ code: 'EMAIL_TAKEN', message: 'Email is already in use' });
    }
  }

  /** Creates a user. Accepts an optional transaction manager so profiles can be created atomically. */
  async createUser(data: CreateUserData, manager?: EntityManager): Promise<User> {
    const repo = manager ? manager.getRepository(User) : this.usersRepository;
    await this.ensureEmailAvailable(data.email, undefined, manager);
    const user = repo.create({
      ...data,
      phone: data.phone || null,
      password: await this.hashPassword(data.password),
    });
    const saved = await repo.save(user);
    delete (saved as Partial<User>).password;
    return saved;
  }

  /** Updates base user fields (also used by student/teacher profile updates). */
  async updateUser(
    id: string,
    data: Partial<CreateUserData>,
    manager?: EntityManager,
  ): Promise<User> {
    const repo = manager ? manager.getRepository(User) : this.usersRepository;
    const user = await repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException({ code: 'USER_NOT_FOUND', message: 'User not found' });
    if (data.email && data.email !== user.email) {
      await this.ensureEmailAvailable(data.email, id, manager);
    }
    const { password, ...rest } = data;
    Object.assign(user, rest);
    if (password) user.password = await this.hashPassword(password);
    const saved = await repo.save(user);
    delete (saved as Partial<User>).password;
    await this.redis.del(UsersService.cacheKey(id));
    return saved;
  }

  create(dto: CreateUserDto): Promise<User> {
    return this.createUser(dto);
  }

  async update(id: string, dto: UpdateUserDto, currentUserId?: string): Promise<User> {
    if (id === currentUserId && (dto.isActive === false || (dto.role && dto.role !== Role.SUPER_ADMIN))) {
      throw new BadRequestException({
        code: 'CANNOT_MODIFY_SELF',
        message: 'You cannot deactivate yourself or change your own role',
      });
    }
    const user = await this.findOne(id);
    if (![Role.ADMIN, Role.SUPER_ADMIN].includes(user.role) && dto.role) {
      throw new BadRequestException({
        code: 'ROLE_CHANGE_NOT_ALLOWED',
        message: 'Role of teacher/student accounts cannot be changed here',
      });
    }
    return this.updateUser(id, dto);
  }

  async remove(id: string, currentUserId?: string): Promise<void> {
    if (id === currentUserId) {
      throw new BadRequestException({ code: 'CANNOT_DELETE_SELF', message: 'You cannot delete yourself' });
    }
    const user = await this.findOne(id);
    await this.usersRepository.softRemove(user);
    await this.redis.del(UsersService.cacheKey(id));
  }

  updateProfile(id: string, dto: UpdateProfileDto): Promise<User> {
    return this.updateUser(id, dto);
  }

  async changePassword(id: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.id = :id', { id })
      .getOne();
    if (!user || !(await this.comparePassword(dto.currentPassword, user.password))) {
      throw new BadRequestException({
        code: 'INVALID_CURRENT_PASSWORD',
        message: 'Current password is incorrect',
      });
    }
    user.password = await this.hashPassword(dto.newPassword);
    await this.usersRepository.save(user);
  }

  async touchLastLogin(id: string): Promise<void> {
    await this.usersRepository.update(id, { lastLoginAt: new Date() });
  }
}
