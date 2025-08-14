import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Document, documentsService } from '@/services/documents.service';
import { Search, FileText, Calendar, User, HardDrive, CheckCircle2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'react-hot-toast';

interface DocumentSelectorProps {
  selectedDocuments: string[];
  onSelectionChange: (documentIds: string[]) => void;
  onDocumentsLoad: (documents: Document[]) => void;
}

const DocumentSelector: React.FC<DocumentSelectorProps> = ({
  selectedDocuments,
  onSelectionChange,
  onDocumentsLoad
}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  // Filters
  const [filters, setFilters] = useState({
    searchQuery: '',
    documentType: 'all',
    dateFrom: '',
    dateTo: '',
    clientName: ''
  });

  const documentTypes = [
    { value: 'invoice', label: 'Facture', financial: true },
    { value: 'receipt', label: 'Reçu', financial: true },
    { value: 'purchase_order', label: 'Bon de commande', financial: true },
    { value: 'bank_statement', label: 'Relevé bancaire', financial: true },
    { value: 'quote', label: 'Devis', financial: false },
    { value: 'delivery_note', label: 'Bon de livraison', financial: false },
    { value: 'expense_report', label: 'Note de frais', financial: true },
    { value: 'payslip', label: 'Fiche de paie', financial: true },
    { value: 'other', label: 'Autre', financial: false }
  ];

  useEffect(() => {
    loadDocuments();
  }, [currentPage]);

  useEffect(() => {
    onDocumentsLoad(documents);
  }, [documents, onDocumentsLoad]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await documentsService.getAllDocuments(
        currentPage,
        itemsPerPage,
        'createdAt',
        'DESC'
      );

      if (response && response.data) {
        setDocuments(response.data);
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
      toast.error('Erreur lors du chargement des documents');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!filters.searchQuery.trim() && !filters.clientName.trim()) {
      loadDocuments();
      return;
    }

    try {
      setLoading(true);
      setCurrentPage(1);

      let response;
      if (filters.clientName.trim()) {
        // Use semantic field search for client name
        response = await documentsService.semanticFieldSearch(
          { clientName: filters.clientName },
          1,
          itemsPerPage
        );
      } else {
        // Use advanced search for other filters
        response = await documentsService.advancedSearch(
          {
            query: filters.searchQuery,
            documentType: filters.documentType === 'all' ? '' : filters.documentType,
            dateFrom: filters.dateFrom,
            dateTo: filters.dateTo
          },
          1,
          itemsPerPage
        );
      }

      if (response && response.data) {
        setDocuments(response.data);
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error('Error searching documents:', error);
      toast.error('Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedDocuments.length === documents.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(documents.map(doc => doc.id));
    }
  };

  const handleSelectDocument = (documentId: string) => {
    if (selectedDocuments.includes(documentId)) {
      onSelectionChange(selectedDocuments.filter(id => id !== documentId));
    } else {
      onSelectionChange([...selectedDocuments, documentId]);
    }
  };

  const getDocumentTypeInfo = (type: string) => {
    const typeInfo = documentTypes.find(t => t.value === type?.toLowerCase());
    return typeInfo || { value: type, label: type, financial: false };
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const financialDocumentsCount = documents.filter(doc => 
    getDocumentTypeInfo(doc.type).financial
  ).length;

  const selectedFinancialCount = selectedDocuments.filter(id => {
    const doc = documents.find(d => d.id === id);
    return doc && getDocumentTypeInfo(doc.type).financial;
  }).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Sélection des documents</span>
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <Badge variant="outline">
              {selectedDocuments.length} sélectionné{selectedDocuments.length > 1 ? 's' : ''}
            </Badge>
            <Badge variant={selectedFinancialCount > 0 ? "default" : "destructive"}>
              {selectedFinancialCount} financier{selectedFinancialCount > 1 ? 's' : ''}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher par nom de fichier..."
              className="pl-10"
              value={filters.searchQuery}
              onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          
          <Input
            placeholder="Nom du client"
            value={filters.clientName}
            onChange={(e) => setFilters(prev => ({ ...prev, clientName: e.target.value }))}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />

          <Select 
            value={filters.documentType} 
            onValueChange={(value) => setFilters(prev => ({ ...prev, documentType: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Type de document" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              {documentTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label} {type.financial && '💰'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-between items-center">
          <Button onClick={handleSearch} disabled={loading}>
            <Search className="h-4 w-4 mr-2" />
            Rechercher
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleSelectAll}
            disabled={documents.length === 0}
          >
            {selectedDocuments.length === documents.length ? 'Tout désélectionner' : 'Tout sélectionner'}
          </Button>
        </div>

        {/* Validation Messages */}
        {selectedDocuments.length > 0 && (
          <div className="p-3 rounded-md border">
            {selectedFinancialCount === 0 ? (
              <div className="flex items-center space-x-2 text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">Aucun document financier sélectionné. Veuillez sélectionner au moins une facture, un reçu, un bon de commande ou un relevé bancaire.</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm">
                  {selectedFinancialCount} document{selectedFinancialCount > 1 ? 's' : ''} financier{selectedFinancialCount > 1 ? 's' : ''} sélectionné{selectedFinancialCount > 1 ? 's' : ''} - Prêt pour la génération du bilan
                </span>
              </div>
            )}
          </div>
        )}

        {/* Documents Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((document) => {
                const typeInfo = getDocumentTypeInfo(document.type);
                const isSelected = selectedDocuments.includes(document.id);
                
                return (
                  <Card 
                    key={document.id} 
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                    }`}
                    onClick={() => handleSelectDocument(document.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <Checkbox 
                          checked={isSelected}
                          onChange={() => handleSelectDocument(document.id)}
                          className="mt-1"
                        />
                        <div className="flex items-center space-x-1">
                          <Badge variant={typeInfo.financial ? "default" : "secondary"}>
                            {typeInfo.label}
                          </Badge>
                          {typeInfo.financial && <span className="text-xs">💰</span>}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium text-sm truncate" title={document.originalName}>
                          {document.originalName}
                        </h4>
                        
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <Calendar className="h-3 w-3" />
                          <span>{format(new Date(document.createdAt), 'dd/MM/yyyy', { locale: fr })}</span>
                        </div>

                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <HardDrive className="h-3 w-3" />
                          <span>{formatFileSize(document.size)}</span>
                        </div>

                        {document.modelConfidence && (
                          <div className="flex items-center space-x-2 text-xs">
                            <span className="text-gray-500">Confiance:</span>
                            <span className={getConfidenceColor(document.modelConfidence)}>
                              {Math.round(document.modelConfidence * 100)}%
                            </span>
                          </div>
                        )}

                        {document.textExcerpt && (
                          <p className="text-xs text-gray-600 line-clamp-2">
                            {document.textExcerpt}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center mt-6">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        className={!pagination.hasPrev ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>

                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      const page = i + Math.max(1, currentPage - 2);
                      if (page <= pagination.totalPages) {
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => setCurrentPage(page)}
                              isActive={currentPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      }
                      return null;
                    })}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                        className={!pagination.hasNext ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}

            {/* Empty State */}
            {documents.length === 0 && (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun document trouvé</h3>
                <p className="text-gray-500">Modifiez vos critères de recherche ou ajoutez des documents.</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default DocumentSelector;