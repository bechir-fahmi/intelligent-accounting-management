import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { Request } from 'express';
import { UserType } from '../../users/user-type.enum';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.Authentication;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'testSecret',
    });
  }

  async validate(payload: any) {
    const user = await this.usersService.findOne(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }
    
    // Validate user type
    const userType = user.type;
    const validTypes = Object.values(UserType);
    
    if (!validTypes.includes(userType as UserType)) {
      console.log(`Invalid user type in token: ${userType}. Valid types are: ${validTypes.join(', ')}`);
      throw new UnauthorizedException('Invalid user type');
    }
    
    // Make sure the user type is included when returning the user
    if (!user.type && payload.type) {
      (user as any).__type = payload.type;
    }
    
    return user;
  }
} 