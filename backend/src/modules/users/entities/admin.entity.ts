import { ChildEntity } from 'typeorm';
import { User } from './user.entity';

@ChildEntity('admin')
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