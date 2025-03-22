export enum UserType {
  ADMIN = 'admin',
  ACCOUNTANT = 'accountant',
  FINANCE = 'finance',
  FINANCE_DIRECTOR = 'finance_director',
}

export const getUserTypeLabel = (type: string): string => {
  switch(type) {
    case UserType.ADMIN:
      return 'Admin';
    case UserType.ACCOUNTANT:
      return 'Accountant';  
    case UserType.FINANCE:
      return 'Finance';
    case UserType.FINANCE_DIRECTOR:
      return 'Finance Director';
    default:
      return 'Unknown';
  }
};

export const isAdmin = (userType: string | null): boolean => {
  return userType === UserType.ADMIN;
};

export const isAccountant = (userType: string | null): boolean => {
  return userType === UserType.ACCOUNTANT;
};

export const isFinance = (userType: string | null): boolean => {
  return userType === UserType.FINANCE;
};

export const isFinanceDirector = (userType: string | null): boolean => {
  return userType === UserType.FINANCE_DIRECTOR;
}; 