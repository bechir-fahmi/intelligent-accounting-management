import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { Response } from 'express';
import { UserType } from '../users/user-type.enum';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && await this.comparePasswords(password, user.password)) {
      // Check if user type is valid
      const userType = user.type;
      const validTypes = Object.values(UserType);
      
      if (!validTypes.includes(userType as UserType)) {
        console.log(`Invalid user type: ${userType}. Valid types are: ${validTypes.join(', ')}`);
        throw new UnauthorizedException('Invalid user type');
      }
      
      // Only exclude the password, keep all other properties including type
      const { password: _, ...result } = user;
      console.log('Auth service validate user:', {
        id: result.id,
        email: result.email,
        type: result.type,
        constructor: result.constructor.name,
      });
      return result;
    }
    return null;
  }

  async login(user: User, response: Response) {
    // Ensure the user type is valid before generating a token
    const userType = user.type;
    const validTypes = Object.values(UserType);
    
    if (!validTypes.includes(userType as UserType)) {
      throw new UnauthorizedException('Invalid user type');
    }
    
    console.log('User entity:', {
      id: user.id,
      email: user.email,
      name: user.name,
      type: userType,
      constructor: user.constructor.name,
      keys: Object.keys(user)
    });
    
    const payload = { 
      email: user.email, 
      sub: user.id,
      type: userType
    };
    
    const token = this.jwtService.sign(payload);
    
    // Set JWT as HTTP-only cookie
    response.cookie('Authentication', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development', // true in production
      sameSite: 'strict',
      maxAge: parseInt(process.env.JWT_EXPIRATION || '3600') * 1000,
      path: '/',
    });
    
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        type: userType
      }
    };
  }

  async register(createUserDto: CreateUserDto, response: Response) {
    const user = await this.usersService.create(createUserDto);
    
    return this.login(user, response);
  }
  
  async logout(response: Response) {
    response.clearCookie('Authentication');
    return { message: 'Logout successful' };
  }

  private async comparePasswords(plainTextPassword: string, hashedPassword: string) {
    return bcrypt.compare(plainTextPassword, hashedPassword);
  }
} 