import React, { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Share2, Trash2, Eye, Download } from 'lucide-react';
import { documentsService } from '@/services/documents.service';
import { toast } from 'react-hot-toast';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Document as PDFDocument, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import ShareDocumentDialog from './ShareDocumentDialog';

// Set up the worker for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface DocumentCardProps {
  id: string;
  originalName: string;
  type: string;
  createdAt: string;
  size: number;
  isOwner: boolean;
  isPublic: boolean;
  modelConfidence: number;
  modelPrediction?: string;
  finalPrediction?: string;
  textExcerpt?: string;
  description?: string | null;
  mimeType?: string;
  hasSharedUsers: boolean;
}

const DocumentCard = ({
  id,
  originalName,
  type,
  createdAt,
  size,
  isOwner,
  isPublic,
  modelConfidence,
  modelPrediction,
  finalPrediction,
  textExcerpt,
  description,
  mimeType,
  hasSharedUsers
}: DocumentCardProps) => {
  const [isPdfViewerOpen, setIsPdfViewerOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

  const handleViewDocument = async () => {
    try {
      const response = await documentsService.getDocumentContent(id);
      if (response.url) {
        if (mimeType === 'application/pdf') {
          setPdfUrl(response.url);
          setIsPdfViewerOpen(true);
        } else {
          window.open(response.url, '_blank');
        }
      } else {
        toast.error('Impossible d\'accéder au document');
      }
    } catch (error) {
      console.error('Error viewing document:', error);
      toast.error('Erreur lors de l\'affichage du document');
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };
  
  const getTypeColor = () => {
    switch (type?.toLowerCase()) {
      case 'invoice':
        return 'bg-blue-100 text-blue-800';
      case 'quote':
        return 'bg-green-100 text-green-800';
      case 'purchase_order':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = () => {
    switch (type?.toLowerCase()) {
      case 'invoice':
        return 'Facture';
      case 'quote':
        return 'Devis';
      case 'purchase_order':
        return 'Bon de commande';
      default:
        return 'Document';
    }
  };

  const getDocumentIcon = () => {
    switch (type?.toLowerCase()) {
      case 'invoice':
        return (
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        );
      case 'quote':
        return (
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'purchase_order':
        return (
          <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        );
      default:
        return (
          <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatConfidence = (confidence: number) => {
    console.log('Raw confidence value:', confidence, 'Type:', typeof confidence);
    if (confidence === undefined || confidence === null) return 0;
    const numConfidence = typeof confidence === 'string' ? parseFloat(confidence) : confidence;
    console.log('Converted confidence:', numConfidence);
    const percentage = isNaN(numConfidence) ? 0 : Math.round(numConfidence * 100);
    console.log('Final percentage:', percentage);
    return percentage;
  };

  return (
    <>
    <Card className="card-hover overflow-hidden">
      <div className="relative p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getDocumentIcon()}
            <div>
                <h3 className="font-medium text-gray-900 truncate max-w-[200px]">{originalName}</h3>
                <p className="text-xs text-gray-500">{formatDate(createdAt)}</p>
            </div>
          </div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor()}`}>
            {getTypeLabel()}
          </span>
        </div>
        
        <div className="mt-3 space-y-2">
            {description && (
              <div className="text-sm text-gray-800 truncate">
                <span className="text-gray-500">Description : </span>
                <span className="font-medium">{description}</span>
            </div>
          )}
          
            <div className="text-sm">
              <span className="text-gray-500">N°Facture : </span>
              <span className="font-medium">N/A</span>
            </div>
          
            <div className="text-sm">
              <span className="text-gray-500">Fournisseur : </span>
              <span className="font-medium">N/A</span>
            </div>

            <div className="text-sm">
              <span className="text-gray-500">Statut : </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                isPublic 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {isPublic ? 'Public' : 'Privé'}
              </span>
            </div>
            
            <div className="text-sm">
              <span className="text-gray-500">Taille : </span>
              <span className="font-medium">{formatFileSize(size)}</span>
        </div>
            
            <div className="text-sm">
              <span className="text-gray-500">Type : </span>
              <span className="font-medium">{mimeType}</span>
      </div>
      
            {modelPrediction && (
              <div className="text-sm">
                <span className="text-gray-500">Prédiction du modèle : </span>
                <span className="font-medium">{modelPrediction}</span>
        </div>
      )}

            {finalPrediction && (
              <div className="text-sm">
                <span className="text-gray-500">Prédiction finale : </span>
                <span className="font-medium">{finalPrediction}</span>
              </div>
            )}
{/* 
            {textExcerpt && (
              <div className="text-sm">
                <span className="text-gray-500">Extrait du texte : </span>
                <p className="font-medium mt-1 bg-gray-50 p-2 rounded text-gray-700">{textExcerpt}</p>
              </div>
            )} */}

          
          </div>
        </div>
      
      <CardFooter className="flex justify-between bg-gray-50 py-2 px-4">
        <div className="flex items-center space-x-1">
          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
            <span className="text-xs text-gray-500">Confiance: {formatConfidence(modelConfidence)}%</span>
        </div>
        <div className="flex items-center space-x-2">
          {isOwner && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsShareDialogOpen(true)}
            >
              <Share2 className="w-4 h-4 mr-1" />
              Partager
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={handleViewDocument}>
            <Eye className="w-4 h-4 mr-1" />
            Voir
          </Button>
        </div>
      </CardFooter>
    </Card>

      <Dialog open={isPdfViewerOpen} onOpenChange={setIsPdfViewerOpen}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogTitle className="sr-only">Aperçu du document</DialogTitle>
          <div className="w-full h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Aperçu du document</h3>
              <div className="flex items-center gap-2">
                {numPages && (
                  <div className="text-sm text-gray-500">
                    Page {pageNumber} sur {numPages}
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(pdfUrl, '_blank')}
                >
                  Ouvrir dans un nouvel onglet
                </Button>
              </div>
            </div>
            <div className="flex-1 bg-gray-50 rounded-lg overflow-auto">
              {pdfUrl && (
                <div className="flex justify-center p-4">
                  <PDFDocument
                    file={pdfUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading={
                      <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    }
                    error={
                      <div className="text-center p-4">
                        <p className="text-red-500 mb-2">Erreur lors du chargement du PDF</p>
                        <Button
                          variant="link"
                          onClick={() => window.open(pdfUrl, '_blank')}
                        >
                          Ouvrir dans un nouvel onglet
                        </Button>
                      </div>
                    }
                  >
                    <Page 
                      pageNumber={pageNumber} 
                      width={800}
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                    />
                  </PDFDocument>
                </div>
              )}
            </div>
            {numPages && numPages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPageNumber(prev => Math.max(prev - 1, 1))}
                  disabled={pageNumber <= 1}
                >
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPageNumber(prev => Math.min(prev + 1, numPages))}
                  disabled={pageNumber >= numPages}
                >
                  Suivant
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ShareDocumentDialog
        documentId={id}
        isOpen={isShareDialogOpen}
        onClose={() => setIsShareDialogOpen(false)}
        onShareSuccess={() => {
          setIsShareDialogOpen(false);
          // Optionally refresh the document list
        }}
      />
    </>
  );
};

export default DocumentCard;
