import { ChildEntity } from 'typeorm';
import { User } from './user.entity';

@ChildEntity('finance')
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
} 