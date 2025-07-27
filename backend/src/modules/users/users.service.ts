import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from './entities/user.entity';
import { Admin } from './entities/admin.entity';
import { Accountant } from './entities/accountant.entity';
import { Finance } from './entities/finance.entity';
import { FinanceDirector } from './entities/finance-director.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UserType } from './user-type.enum';
import { EmailService } from '../email/email.service';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { plainToClass } from 'class-transformer';

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
    private readonly emailService: EmailService,
  ) { }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { email, password, type, name } = createUserDto;

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

    // Save the user
    const savedUser = await this.usersRepository.save(user);

    // Send welcome email with password
    try {
      await this.emailService.sendUserCreationEmail(email, name || email, password);
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      // We don't throw here to prevent user creation from failing if email sending fails
    }

    // Return the saved user
    return savedUser;
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async findOne(id: string): Promise<User> {
    if (!id) {
      throw new NotFoundException('User ID is required');
    }

    try {
      // First try in the base repository
      const user = await this.usersRepository.findOne({
        where: { id },
      });

      if (!user) {
        throw new NotFoundException(`User with ID "${id}" not found`);
      }

      // If found, check which type it is and load it from the specific repository
      const type = (user as any).type;

      // Load from specific repository based on type
      let specificUser: User;
      try {
        switch (type) {
          case 'admin':
            specificUser = await this.adminRepository.findOne({ where: { id } });
            break;
          case 'accountant':
            specificUser = await this.accountantRepository.findOne({ where: { id } });
            break;
          case 'finance':
            specificUser = await this.financeRepository.findOne({ where: { id } });
            break;
          case 'finance_director':
            specificUser = await this.financeDirectorRepository.findOne({ where: { id } });
            break;
          default:
            return user; // Return base user if type not recognized
        }

        return specificUser || user; // Fallback to base user if specific type not found
      } catch (error) {
        console.error('Error loading specific user type:', error);
        return user; // Fallback to base user
      }
    } catch (error) {
      console.error(`Error finding user with ID ${id}:`, error);
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

  async remove(id: string): Promise<boolean> {
    const user = await this.findOne(id);

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    // Delete the user
    await this.usersRepository.remove(user);

    return true;
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  // Add a new method to find user by token
  async findByToken(token: string): Promise<User> {
    // In a real implementation, we'd have a token store or lookup mechanism
    // For now, we'll use the ID in the token directly if we can parse it

    try {
      // For simplicity, if we have a raw token that's the Authentication cookie value
      // we're just going to use it directly as a user ID.
      // In a real implementation, you'd want to validate this token properly.

      // First check if any users match this ID directly
      try {
        const user = await this.findOne(token);
        if (user) {
          return user;
        }
      } catch (e) {
        // Token is not a valid user ID
      }

      // If not found, we could have additional lookup mechanisms here

      throw new NotFoundException('No user found for the provided token');
    } catch (error) {
      console.error('Error finding user by token:', error);
      throw new NotFoundException('Invalid authentication token');
    }
  }

  async getDetailedProfile(userId: string): Promise<ProfileResponseDto> {
    const user = await this.findOne(userId);

    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    // Get additional fields based on user type if needed
    // For now, we'll just return the basic profile data
    // This can be extended to include type-specific fields later

    return plainToClass(ProfileResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    const { email } = forgotPasswordDto;

    const user = await this.findByEmail(email);
    if (!user) {
      // Don't reveal if email exists or not for security
      return { message: 'If an account with that email exists, a password reset link has been sent.' };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date();
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1); // Token expires in 1 hour

    // Save reset token to user
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpiry;
    await this.usersRepository.save(user);

    // Send reset email
    try {
      await this.emailService.sendPasswordResetEmail(user.email, user.name, resetToken);
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      // Clear the reset token if email fails
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await this.usersRepository.save(user);
      throw new BadRequestException('Failed to send password reset email. Please try again.');
    }

    return { message: 'If an account with that email exists, a password reset link has been sent.' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    const { token, newPassword } = resetPasswordDto;

    // Find user by reset token
    const user = await this.usersRepository.findOne({
      where: {
        resetPasswordToken: token,
      }
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Check if token is expired
    if (!user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      // Clear expired token
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await this.usersRepository.save(user);
      throw new BadRequestException('Reset token has expired. Please request a new password reset.');
    }

    // Hash new password
    const hashedPassword = await this.hashPassword(newPassword);

    // Update user password and clear reset token
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await this.usersRepository.save(user);

    return { message: 'Password has been reset successfully' };
  }

  async validateResetToken(token: string): Promise<{ valid: boolean; message?: string }> {
    if (!token) {
      return { valid: false, message: 'Reset token is required' };
    }

    const user = await this.usersRepository.findOne({
      where: { resetPasswordToken: token }
    });

    if (!user) {
      return { valid: false, message: 'Invalid reset token' };
    }

    if (!user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      // Clear expired token
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await this.usersRepository.save(user);
      return { valid: false, message: 'Reset token has expired' };
    }

    return { valid: true };
  }
}