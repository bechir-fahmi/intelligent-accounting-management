import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { Response } from 'express';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && await this.comparePasswords(password, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: User, response: Response) {
    const payload = { 
      email: user.email, 
      sub: user.id, 
      type: (user as any).type // Access the discriminator column
    };
    
    const token = this.jwtService.sign(payload);
    
    // Set JWT as HTTP-only cookie
    response.cookie('Authentication', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development', // true in production
      sameSite: 'strict',
      maxAge: 3600 * 1000, // match your JWT expiration (1 hour)
      path: '/',
    });
    
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        type: (user as any).type,
      }
      // No longer returning token in response body
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