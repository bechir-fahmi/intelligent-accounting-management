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
        throw new UnauthorizedException('Invalid user type');
      }
      
      // Only exclude the password, keep all other properties including type
      const { password: _, ...result } = user;
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
    
    const payload = { 
      email: user.email, 
      sub: user.id,
      type: userType
    };
    
    const token = this.jwtService.sign(payload);
    
    // Set JWT as HTTP-only cookie
    response.cookie('Authentication', token, {
      httpOnly: true,
      secure: false, // false for local development (no HTTPS)
      sameSite: 'lax', // 'lax' is more permissive for cross-port localhost
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/',
      domain: 'localhost'
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

  async getCurrentUser(user: User) {
    // Return user information without sensitive data
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      type: user.type,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  private async comparePasswords(plainTextPassword: string, hashedPassword: string) {
    return bcrypt.compare(plainTextPassword, hashedPassword);
  }
}