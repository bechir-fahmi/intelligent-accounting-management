import { ChildEntity } from 'typeorm';
import { User } from './user.entity';
import { UserType } from '../user-type.enum';

@ChildEntity(UserType.ACCOUNTANT)
export class Accountant extends User {
  // Accountant-specific methods
  processAccounting() {
    // Implementation
    return 'Processing accounting';
  }

  generateReport() {
    // Implementation
    return 'Generating report';
  }

  validateDocument(data: any) {
    // Implementation
    return 'Validating document';
  }
} 