import { ChildEntity } from 'typeorm';
import { User } from './user.entity';
import { UserType } from '../user-type.enum';

@ChildEntity(UserType.FINANCE_DIRECTOR)
export class FinanceDirector extends User {
  // Finance Director-specific methods
  approveBudgets() {
    // Implementation
    return 'Approving budgets';
  }

  manageFinancialRisk() {
    // Implementation
    return 'Managing financial risk';
  }
} 