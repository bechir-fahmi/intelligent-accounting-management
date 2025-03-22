import { ChildEntity } from 'typeorm';
import { User } from './user.entity';
import { UserType } from '../user-type.enum';

@ChildEntity(UserType.ADMIN)
export class Admin extends User {
  // Admin-specific methods
  manageUsers() {
    // Implementation
    return 'Managing users';
  }

  configureSystem() {
    // Implementation
    return 'Configuring system';
  }
} 