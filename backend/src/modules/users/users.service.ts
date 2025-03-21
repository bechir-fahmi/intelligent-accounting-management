import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { Admin } from './entities/admin.entity';
import { Accountant } from './entities/accountant.entity';
import { Finance } from './entities/finance.entity';
import { FinanceDirector } from './entities/finance-director.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UserType } from './user-type.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
    @InjectRepository(Accountant)
    private readonly accountantRepository: Repository<Accountant>,
    @InjectRepository(Finance)
    private readonly financeRepository: Repository<Finance>,
    @InjectRepository(FinanceDirector)
    private readonly financeDirectorRepository: Repository<FinanceDirector>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { email, password, type } = createUserDto;
    
    // Check if user already exists
    const existingUser = await this.findByEmail(email);
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }
    
    // Hash password
    const hashedPassword = await this.hashPassword(password);
    
    // Create common user data
    const userData = {
      ...createUserDto,
      password: hashedPassword,
    };
    
    // Create specific user type
    let user: User;
    
    switch (type) {
      case UserType.ADMIN:
        user = this.adminRepository.create(userData);
        break;
      case UserType.ACCOUNTANT:
        user = this.accountantRepository.create(userData);
        break;
      case UserType.FINANCE:
        user = this.financeRepository.create(userData);
        break;
      case UserType.FINANCE_DIRECTOR:
        user = this.financeDirectorRepository.create(userData);
        break;
      default:
        throw new BadRequestException('Invalid user type');
    }
    
    return this.usersRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }
} 