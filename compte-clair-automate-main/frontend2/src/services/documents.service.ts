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

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface SearchFilters {
  query?: string;
  clientName?: string;
  documentType?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface SemanticFieldSearchParams {
  clientName?: string;
  date?: string; // Actually contains year value, but backend expects 'date' parameter
}

// Alias for backward compatibility
export interface SimpleSearchParams extends SemanticFieldSearchParams { }

export interface SemanticSearchParams {
  query: string;
  similarityThreshold?: number;
  maxResults?: number;
}

class DocumentsService {
  async getAllDocuments(
    page: number = 1,
    limit: number = 10,
    sortBy: string = 'createdAt',
    sortOrder: 'ASC' | 'DESC' = 'DESC'
  ): Promise<PaginatedResponse<Document>> {
    const params = { page, limit, sortBy, sortOrder };
    const response = await api.get('/documents', { params });
    return response.data;
  }

  // Check if advanced search features are available
  async checkSearchCapabilities(): Promise<{
    semantic: boolean;
    hybrid: boolean;
    advanced: boolean;
    semanticFields: boolean;
  }> {
    const capabilities = {
      semantic: false,
      hybrid: false,
      advanced: false,
      semanticFields: true // Semantic field search (simple-search) is working
    };

    // Currently available: Semantic field search in extracted document data
    // This searches in embeddings/extracted information like client names and dates
    console.log('Using semantic field search (searches in extracted document data)');

    return capabilities;
  }

  async getDocument(id: string): Promise<Document> {
    const response = await api.get(`/documents/${id}`);
    return response.data;
  }

  // Note: This endpoint is not available on the backend yet
  async searchDocuments(query: string, page: number = 1, limit: number = 10): Promise<PaginatedResponse<Document>> {
    console.warn('Text search endpoint not available, falling back to semantic field search');
    // Fallback to semantic field search using the query as client name
    return this.semanticFieldSearch({ clientName: query }, page, limit);
  }

  // Semantic search in extracted document information (embeddings)
  async semanticFieldSearch(
    params: SimpleSearchParams,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResponse<Document>> {
    const searchParams = { ...params, page, limit };
    const response = await api.get('/documents/simple-search', { params: searchParams });
    return response.data;
  }

  // Alias for backward compatibility
  async simpleSearch(
    params: SimpleSearchParams,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResponse<Document>> {
    return this.semanticFieldSearch(params, page, limit);
  }

  async advancedSearch(filters: SearchFilters, page: number = 1, limit: number = 10): Promise<PaginatedResponse<Document>> {
    const params = { ...filters, page, limit };
    const response = await api.get('/documents/advanced-search', { params });
    return response.data;
  }

  async semanticSearch(
    params: SemanticSearchParams,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResponse<Document>> {
    try {
      const searchParams = { ...params, page, limit };
      const response = await api.get('/documents/semantic-search', { params: searchParams });
      return response.data;
    } catch (error) {
      console.warn('Semantic search not available, falling back to text search');
      // Fallback to regular text search if semantic search is not available
      return this.searchDocuments(params.query, page, limit);
    }
  }

  async hybridSearch(
    query: string,
    filters?: Partial<SearchFilters>,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResponse<Document>> {
    try {
      const params = { query, ...filters, page, limit };
      const response = await api.get('/documents/hybrid-search', { params });
      return response.data;
    } catch (error) {
      console.warn('Hybrid search not available, falling back to advanced search');
      // Fallback to advanced search if hybrid search is not available
      return this.advancedSearch({ query, ...filters }, page, limit);
    }
  }

  async uploadDocument(file: File, data: CreateDocumentDto): Promise<Document> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('description', data.description || '');
    formData.append('filename', data.filename);
    formData.append('originalName', data.originalName);
    formData.append('mimeType', data.mimeType);
    formData.append('size', data.size.toString());
    if (data.path) formData.append('path', data.path);
    if (data.type) formData.append('type', data.type);
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


}

export const documentsService = new DocumentsService(); 