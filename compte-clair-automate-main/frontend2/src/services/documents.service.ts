import api from '@/lib/axios';

export interface Document {
  id: string;
  originalName: string;
  filename: string;
  type: string;
  size: number;
  mimeType: string;
  createdAt: string;
  updatedAt: string;
  description?: string;
  isOwner: boolean;
  isPublic: boolean;
  hasSharedUsers: boolean;
  temporaryUrl?: string;
  modelConfidence?: number;
  modelPrediction?: string;
  finalPrediction?: string;
  textExcerpt?: string;
  aiRawResponse?: any;
}

export enum DocumentType {
  INVOICE = 'invoice',
  RECEIPT = 'receipt',
  BANK_STATEMENT = 'bank_statement',
  TAX_DOCUMENT = 'tax_document',
  PURCHASE_ORDER = 'purchase_order',
  QUOTE = 'quote',
  DELIVERY_NOTE = 'delivery_note',
  EXPENSE_REPORT = 'expense_report',
  PAYSLIP = 'payslip',
  OTHER = 'other'
}

export interface CreateDocumentDto {
  description?: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path?: string;
  type?: string;
  clientId?: string;
}

export interface SharedUser {
  id: string;
  name: string;
  email: string;
  type: string;
}

class DocumentsService {
  async getAllDocuments(): Promise<Document[]> {
    const response = await api.get('/documents');
    return response.data;
  }

  async getDocument(id: string): Promise<Document> {
    const response = await api.get(`/documents/${id}`);
    return response.data;
  }

  async uploadDocument(file: File, data: CreateDocumentDto): Promise<Document> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('description', data.description || '');
    formData.append('filename', data.filename);
    formData.append('originalName', data.originalName);
    formData.append('mimeType', data.mimeType);
    formData.append('size', data.size.toString());
    formData.append('path', data.path);
    formData.append('type', data.type);
    if (data.clientId) formData.append('clientId', data.clientId);

    const response = await api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async deleteDocument(id: string): Promise<void> {
    await api.delete(`/documents/${id}`);
  }

  async getDocumentContent(id: string): Promise<{ url: string }> {
    const response = await api.get(`/documents/${id}/content`);
    return response.data;
  }

  async searchUserByEmail(email: string): Promise<SharedUser> {
    const response = await api.get(`/users/search`, {
      params: { email },
    });
    return response.data;
  }

  async shareDocument(id: string, userIds: string[], isPublic: boolean): Promise<{
    success: boolean;
    message: string;
    sharedWithCount: number;
    isPublic: boolean;
  }> {
    const response = await api.post(`/documents/${id}/share`, {
      userIds,
      isPublic,
    });
    return response.data;
  }

  async unshareDocument(id: string, userId: string): Promise<{
    success: boolean;
    message: string;
    sharedWithCount: number;
  }> {
    const response = await api.delete(`/documents/${id}/share/${userId}`);
    return response.data;
  }

  async getSharedUsers(id: string): Promise<SharedUser[]> {
    const response = await api.get(`/documents/${id}/shared-users`);
    return response.data;
  }

  async searchDocuments(query: string): Promise<Document[]> {
    const response = await api.get('/documents/search', {
      params: { query },
    });
    return response.data;
  }
}

export const documentsService = new DocumentsService(); 