import { ChildEntity } from 'typeorm';
import { User } from './user.entity';
import { UserType } from '../user-type.enum';

@ChildEntity(UserType.FINANCE)
export class Finance extends User {
  // Finance-specific methods
  uploadDocument(doc: any) {
    // Implementation
    return 'Uploading document';
  }

  validateDocument(data: any) {
    // Implementation
    return 'Validating document';
  }

  generateReport() {
    // Implementation
    return 'Generating report';
  }

  processPayments() {
    // Implementation
    return 'Processing payments';
  }

  reviewFinancials() {
    // Implementation
    return 'Reviewing financials';
  }
} 