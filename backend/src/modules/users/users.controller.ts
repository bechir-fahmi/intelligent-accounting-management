import { Controller, Get, Post, UseGuards, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from './entities/user.entity';
import { UserType } from './user-type.enum';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@CurrentUser() user: User) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      type: user.type,
    };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get()
  findAll() {
    return this.usersService.findAll();
  }
  
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('fix-invalid-types')
  async fixInvalidUserTypes() {
    const users = await this.usersService.findAll();
    const validTypes = Object.values(UserType);
    const invalidUsers = users.filter(user => !validTypes.includes(user.type as UserType));
    
    if (invalidUsers.length === 0) {
      return { message: 'No users with invalid types found' };
    }
    
    const updates = await Promise.all(
      invalidUsers.map(async user => {
        // Default to admin type if invalid
        const fixedUser = { ...user, type: UserType.ADMIN };
        try {
          await this.usersService.update(user.id, fixedUser);
          return { id: user.id, email: user.email, oldType: user.type, newType: UserType.ADMIN };
        } catch (error) {
          return { id: user.id, email: user.email, error: error.message };
        }
      })
    );
    
    return {
      message: `Fixed ${updates.filter(u => !u.error).length} users with invalid types`,
      details: updates
    };
  }
} 