// Utility to map DocumentType enum values to user-friendly labels
import { DocumentType } from './document-type.enum';

export const DocumentTypeLabels: Record<DocumentType, string> = {
  [DocumentType.INVOICE]: 'Invoice',
  [DocumentType.RECEIPT]: 'Receipt',
  [DocumentType.BANK_STATEMENT]: 'Bank Statement',
  [DocumentType.TAX_DOCUMENT]: 'Tax Document',
  [DocumentType.PURCHASE_ORDER]: 'Purchase Order',
  [DocumentType.QUOTE]: 'Quote',
  [DocumentType.DELIVERY_NOTE]: 'Delivery Note',
  [DocumentType.EXPENSE_REPORT]: 'Expense Report',
  [DocumentType.PAYSLIP]: 'Payslip',
  [DocumentType.OTHER]: 'Other',
};

export function getDocumentTypeLabel(type: DocumentType | string): string {
  return DocumentTypeLabels[type as DocumentType] || 'Other';
}
