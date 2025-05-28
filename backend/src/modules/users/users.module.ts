import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { Admin } from './entities/admin.entity';
import { Accountant } from './entities/accountant.entity';
import { Finance } from './entities/finance.entity';
import { FinanceDirector } from './entities/finance-director.entity';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Admin,
      Accountant,
      Finance,
      FinanceDirector,
    ]),
    EmailModule,
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {} 