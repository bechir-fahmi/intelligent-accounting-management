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
        // First try to get token from cookie
        (request: Request) => {
          return request?.cookies?.Authentication;
        },
        // Then try to get token from Authorization header
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        // Finally, if the Authorization header contains a userId instead of a token
        (request: Request) => {
          const auth = request.headers.authorization;
          if (auth && auth.startsWith('Bearer ')) {
            const token = auth.substring(7).trim();
            // If it's not a JWT token (doesn't have dots), treat it as a userId
            if (token && !token.includes('.')) {
              return { sub: token }; // Create a simple payload with the user ID
            }
          }
          return null;
        }
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'testSecret',
      passReqToCallback: true,
    });
  }

  async validate(request: Request, payload: any) {
    try {
      const userId = payload.sub;
      if (!userId) {
        throw new UnauthorizedException('Invalid token - no user ID');
      }
      
      const user = await this.usersService.findOne(userId);
      
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      
      // Validate user type
      const userType = user.type;
      const validTypes = Object.values(UserType);
      
      if (!validTypes.includes(userType as UserType)) {
        throw new UnauthorizedException('Invalid user type');
      }
      
      return user;
    } catch (error) {
      console.error('Error validating JWT token or user ID:', error);
      throw new UnauthorizedException('Authentication failed');
    }
  }
}