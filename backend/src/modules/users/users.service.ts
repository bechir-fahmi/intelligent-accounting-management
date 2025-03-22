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
    
    // Create common user data with type explicitly included
    const userData = {
      ...createUserDto,
      password: hashedPassword,
      type: type, // Explicitly set the type field
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
    
    console.log('Creating user with data:', {
      ...userData,
      password: '[REDACTED]'
    });
    
    // Save the user and return it
    return this.usersRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async findOne(id: string): Promise<User> {
    try {
      // First try in the base repository
      const user = await this.usersRepository.findOneOrFail({
        where: { id },
      });
      
      // If found, check which type it is and load it from the specific repository
      if (user) {
        const type = (user as any).type;
        console.log(`User found with type: ${type}`);
        
        // Load from specific repository based on type
        let specificUser: User;
        switch (type) {
          case 'admin':
            specificUser = await this.adminRepository.findOneOrFail({ where: { id } });
            break;
          case 'accountant':
            specificUser = await this.accountantRepository.findOneOrFail({ where: { id } });
            break;
          case 'finance':
            specificUser = await this.financeRepository.findOneOrFail({ where: { id } });
            break;
          case 'finance_director':
            specificUser = await this.financeDirectorRepository.findOneOrFail({ where: { id } });
            break;
          default:
            return user; // Return base user if type not recognized
        }
        
        return specificUser;
      }
      
      return user;
    } catch (error) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    // First try to find in base repository
    const user = await this.usersRepository.findOne({
      where: { email },
    });
    
    if (!user) return null;
    
    // Get the user type
    const type = (user as any).type;
    console.log(`User found by email with type: ${type}`);
    
    // Load from specific repository based on type
    let specificUser: User;
    try {
      switch (type) {
        case 'admin':
          specificUser = await this.adminRepository.findOneOrFail({ where: { id: user.id } });
          break;
        case 'accountant':
          specificUser = await this.accountantRepository.findOneOrFail({ where: { id: user.id } });
          break;
        case 'finance':
          specificUser = await this.financeRepository.findOneOrFail({ where: { id: user.id } });
          break;
        case 'finance_director':
          specificUser = await this.financeDirectorRepository.findOneOrFail({ where: { id: user.id } });
          break;
        default:
          return user; // Return base user if type not recognized
      }
      
      return specificUser;
    } catch (error) {
      console.error('Error loading specific user:', error);
      return user; // Fallback to base user
    }
  }

  async update(id: string, updateData: Partial<User>): Promise<User> {
    const user = await this.findOne(id);
    
    // Update fields
    Object.assign(user, updateData);
    
    // Save changes
    return this.usersRepository.save(user);
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }
} 