import { ChildEntity } from 'typeorm';
import { User } from './user.entity';

@ChildEntity('accountant')
export class Accountant extends User {
  // Accountant-specific methods
  generateReport() {
    // Implementation
    return 'Generating report';
  }

  validateDocument(data: any) {
    // Implementation
    return 'Validating document';
  }
} 