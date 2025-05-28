import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, BadRequestException, NotFoundException, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from './entities/user.entity';
import { UserType } from './user-type.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { ProfileResponseDto } from './dto/profile-response.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('search')
  async searchByEmail(@Query('email') email: string) {
    if (!email) {
      throw new BadRequestException('Email is required');
    }
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      type: user.type
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@CurrentUser() user: User): Promise<ProfileResponseDto> {
    return this.usersService.getDetailedProfile(user.id);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('profile/:id')
  async getUserProfile(@Param('id') id: string): Promise<ProfileResponseDto> {
    try {
      return await this.usersService.getDetailedProfile(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Invalid user ID or profile not found');
    }
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get()
  findAll() {
    return this.usersService.findAll();
  }
  
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      return await this.usersService.findOne(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Invalid user ID');
    }
  }
  
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    try {
      const user = await this.usersService.create(createUserDto);
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        type: user.type,
        createdAt: user.createdAt,
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'Could not create user');
    }
  }
  
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateData: Partial<User>) {
    try {
      // Remove sensitive fields from update
      if (updateData.password) {
        delete updateData.password;
      }
      
      const updatedUser = await this.usersService.update(id, updateData);
      return {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        type: updatedUser.type,
        updatedAt: updatedUser.updatedAt,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(error.message || 'Could not update user');
    }
  }
  
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      const result = await this.usersService.remove(id);
      return { success: result, message: `User with ID ${id} deleted` };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(error.message || 'Could not delete user');
    }
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