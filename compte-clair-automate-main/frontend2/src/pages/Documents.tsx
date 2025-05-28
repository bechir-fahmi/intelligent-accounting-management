import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DocumentCard from '@/components/DocumentCard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { documentsService, Document } from '@/services/documents.service';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { log } from 'console';

const Documents = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'tous' | 'factures' | 'devis' | 'bons_commande'>('tous');
  const { user } = useAuth();

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const data = await documentsService.getAllDocuments();
      console.log("data",data);
      setDocuments(data);
    } catch (error) {
      console.error('Error loading documents:', error);
      toast.error('Erreur lors du chargement des documents');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      loadDocuments();
      return;
    }

    try {
      const results = await documentsService.searchDocuments(query);
      setDocuments(results);
    } catch (error) {
      console.error('Error searching documents:', error);
      toast.error('Erreur lors de la recherche');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await documentsService.uploadDocument(file, {
        description: '',
      });
      toast.success('Document téléchargé avec succès');
      loadDocuments();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Erreur lors du téléchargement du document');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) return;

    try {
      await documentsService.deleteDocument(id);
      toast.success('Document supprimé avec succès');
      loadDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Erreur lors de la suppression du document');
    }
  };

  const filteredDocuments = documents.filter(doc => {
    if (activeFilter === 'tous') return true;
    
    // Map filter values to document types
    const typeMap: { [key: string]: string } = {
      'factures': 'invoice',
      'devis': 'quote',
      'bons_commande': 'purchase_order'
    };
    
    return doc.type.toLowerCase() === typeMap[activeFilter];
      });

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 flex justify-between items-center">
            <div>
            <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
            <p className="text-gray-500">Consultez et gérez vos documents comptables</p>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex gap-2">
              <Button 
                variant={activeFilter === 'tous' ? 'default' : 'outline'}
                onClick={() => setActiveFilter('tous')}
              >
                Tous
              </Button>
              <Button 
                variant={activeFilter === 'factures' ? 'default' : 'outline'}
                onClick={() => setActiveFilter('factures')}
              >
                Factures
              </Button>
              <Button 
                variant={activeFilter === 'devis' ? 'default' : 'outline'}
                onClick={() => setActiveFilter('devis')}
              >
                Devis
              </Button>
              <Button 
                variant={activeFilter === 'bons_commande' ? 'default' : 'outline'}
                onClick={() => setActiveFilter('bons_commande')}
              >
                Bons de commande
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-8">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Rechercher un document par nom, fournisseur, montant..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}

          {/* Documents Grid */}
          {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocuments.map((document) => (
              <DocumentCard
                key={document.id}
                  id={document.id}
                  originalName={document.originalName}
                type={document.type}
                  createdAt={document.createdAt}
                  size={document.size}
                  isOwner={document.isOwner}
                  isPublic={document.isPublic}
                  modelConfidence={document.modelConfidence || 0}
                  modelPrediction={document.modelPrediction}
                  finalPrediction={document.finalPrediction}
                  textExcerpt={document.textExcerpt}
                  description={document.description}
                  mimeType={document.mimeType}
              />
            ))}
          </div>
          )}

          {/* Empty State */}
          {!loading && filteredDocuments.length === 0 && (
            <Card className="flex flex-col items-center justify-center p-8 text-center">
              <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-1">Aucun document trouvé</h3>
              <p className="text-gray-500 mb-4">Il n'y a pas de documents correspondant à votre recherche.</p>
              <Button variant="outline" onClick={() => setActiveFilter('tous')}>Voir tous les documents</Button>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Documents;
