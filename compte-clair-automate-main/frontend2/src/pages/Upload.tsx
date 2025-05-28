import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { documentsService, Document, DocumentType } from '@/services/documents.service';
import UploadZone from '@/components/UploadZone';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const Upload = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadedDocument, setUploadedDocument] = useState<Document | null>(null);
  const navigate = useNavigate();

  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;

    setUploading(true);
    try {
      const file = files[0];
      const document = await documentsService.uploadDocument(file, {
        description: '',
        type: DocumentType.OTHER,
        filename: file.name,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        path: ''
      });
      
      setUploadedDocument(document);
      toast.success('Document téléchargé avec succès');
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Erreur lors du téléchargement du document');
    } finally {
      setUploading(false);
    }
  };

  const formatConfidence = (confidence: number) => {
    if (confidence === undefined || confidence === null) return 0;
    const numConfidence = typeof confidence === 'string' ? parseFloat(confidence) : confidence;
    const percentage = isNaN(numConfidence) ? 0 : Math.round(numConfidence * 100);
    return percentage;
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Import de documents</h1>
            <p className="text-gray-500">Téléchargez vos documents pour une analyse automatique</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upload Section */}
            <div>
              <Card className="p-6">
            <UploadZone onFilesSelected={handleFilesSelected} />
                
                {uploading && (
                  <div className="mt-4 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600">Analyse en cours...</span>
                </div>
                )}
              </Card>

              <div className="mt-6">
                <h2 className="text-lg font-semibold mb-4">Types de documents acceptés</h2>
                <ul className="space-y-2 text-gray-600">
                  <li>• Factures</li>
                  <li>• Devis</li>
                  <li>• Bons de commande</li>
                  <li>• Relevés bancaires</li>
                  <li>• Documents fiscaux</li>
                </ul>
              </div>
            </div>

            {/* Analysis Results Section */}
            <div>
              {uploadedDocument && (
                <Card className="p-6">
                  <h2 className="text-lg font-semibold mb-4">Résultats de l'analyse</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <span className="text-gray-500">Nom du document : </span>
                      <span className="font-medium">{uploadedDocument.originalName}</span>
                </div>

                    {uploadedDocument.modelPrediction && (
                      <div>
                        <span className="text-gray-500">Prédiction du modèle : </span>
                        <span className="font-medium">{uploadedDocument.modelPrediction}</span>
                  </div>
                    )}

                    {uploadedDocument.finalPrediction && (
                      <div>
                        <span className="text-gray-500">Prédiction finale : </span>
                        <span className="font-medium">{uploadedDocument.finalPrediction}</span>
                </div>
                    )}

                    {uploadedDocument.textExcerpt && (
                      <div>
                        <span className="text-gray-500">Extrait du texte : </span>
                        <p className="mt-1 bg-gray-50 p-3 rounded text-gray-700">{uploadedDocument.textExcerpt}</p>
              </div>
                    )}

                    <div>
                      <span className="text-gray-500">Niveau de confiance : </span>
                      <span className="font-medium">{formatConfidence(uploadedDocument.modelConfidence || 0)}%</span>
            </div>
            
                    <div className="pt-4">
                      <Button 
                        onClick={() => navigate('/documents')}
                        className="w-full"
                      >
                        Voir dans Documents
                </Button>
              </div>
                  </div>
                </Card>
              )}

              {!uploadedDocument && (
                <Card className="p-6">
                  <h2 className="text-lg font-semibold mb-4">Comment ça marche ?</h2>
                  <p className="text-gray-600">
                    Notre système analyse automatiquement vos documents grâce à l'intelligence artificielle.
                    Il détecte le type de document, extrait les informations importantes et vous présente
                    les résultats en temps réel.
                  </p>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Upload;
