import { ChildEntity } from 'typeorm';
import { User } from './user.entity';

@ChildEntity('finance_director')
export class FinanceDirector extends User {
  // FinanceDirector-specific methods
  approveReport(report: any) {
    // Implementation
    return 'Approving report';
  }

  rejectReport(report: any) {
    // Implementation
    return 'Rejecting report';
  }
} 