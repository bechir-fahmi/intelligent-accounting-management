// This is a Next.js page that replicates the functionality of the original Documents.tsx React page.
"use client";
import React, { useState } from "react";
import DocumentCard from "@/components/DocumentCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const mockDocuments = [
  {
    id: 1,
    title: "Facture EDF",
    type: "facture",
    date: "2025-05-10",
    montant: 126.42,
    numDocument: "F-2023-089",
    fournisseur: "EDF",
    confidence: 98,
  },
  {
    id: 2,
    title: "Devis travaux bureau",
    type: "devis",
    date: "2025-05-08",
    montant: 3450.0,
    numDocument: "D-2023-042",
    fournisseur: "Bâti Pro",
    confidence: 95,
  },
  {
    id: 3,
    title: "Bon de commande fournitures",
    type: "bon_commande",
    date: "2025-05-05",
    montant: 289.9,
    numDocument: "BC-2023-018",
    fournisseur: "Office Depot",
    confidence: 96,
  },
  {
    id: 4,
    title: "Facture téléphone",
    type: "facture",
    date: "2025-05-01",
    montant: 54.99,
    numDocument: "F-2023-090",
    fournisseur: "Orange",
    confidence: 99,
  },
  {
    id: 5,
    title: "Devis matériel informatique",
    type: "devis",
    date: "2025-04-28",
    montant: 1899.0,
    numDocument: "D-2023-043",
    fournisseur: "LDLC",
    confidence: 97,
  },
  {
    id: 6,
    title: "Bon de commande produits entretien",
    type: "bon_commande",
    date: "2025-04-25",
    montant: 125.75,
    numDocument: "BC-2023-019",
    fournisseur: "Clean Pro",
    confidence: 93,
  },
  {
    id: 7,
    title: "Facture assurance",
    type: "facture",
    date: "2025-04-20",
    montant: 245.8,
    numDocument: "F-2023-091",
    fournisseur: "Allianz",
    confidence: 97,
  },
  {
    id: 8,
    title: "Facture internet",
    type: "facture",
    date: "2025-04-18",
    montant: 39.99,
    numDocument: "F-2023-092",
    fournisseur: "Free",
    confidence: 98,
  },
  {
    id: 9,
    title: "Devis formation",
    type: "devis",
    date: "2025-04-15",
    montant: 1200.0,
    numDocument: "D-2023-044",
    fournisseur: "Formation Pro",
    confidence: 94,
  },
];

export default function DocumentsPage() {
  const [activeFilter, setActiveFilter] = useState(
    "tous"
  );

  const filteredDocuments =
    activeFilter === "tous"
      ? mockDocuments
      : mockDocuments.filter((doc) => {
          if (activeFilter === "factures" && doc.type === "facture") return true;
          if (activeFilter === "devis" && doc.type === "devis") return true;
          if (activeFilter === "bons_commande" && doc.type === "bon_commande") return true;
          return false;
        });

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
            <p className="text-gray-500">Consultez et gérez vos documents comptables</p>
          </div>
          {/* Filters */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex gap-2">
              <Button variant={activeFilter === "tous" ? "default" : "outline"} onClick={() => setActiveFilter("tous")}>Tous</Button>
              <Button variant={activeFilter === "factures" ? "default" : "outline"} onClick={() => setActiveFilter("factures")}>Factures</Button>
              <Button variant={activeFilter === "devis" ? "default" : "outline"} onClick={() => setActiveFilter("devis")}>Devis</Button>
              <Button variant={activeFilter === "bons_commande" ? "default" : "outline"} onClick={() => setActiveFilter("bons_commande")}>Bons de commande</Button>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-500 mr-2">Trier par:</span>
              <select className="border border-gray-300 text-sm rounded-md px-3 py-1.5">
                <option>Date (récent)</option>
                <option>Date (ancien)</option>
                <option>Montant (croissant)</option>
                <option>Montant (décroissant)</option>
              </select>
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
              />
            </div>
          </div>
          {/* Documents Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocuments.map((document) => (
              <DocumentCard
                key={document.id}
                title={document.title}
                type={document.type}
                date={document.date}
                montant={document.montant}
                numDocument={document.numDocument}
                fournisseur={document.fournisseur}
                confidence={document.confidence}
              />
            ))}
          </div>
          {/* Empty State */}
          {filteredDocuments.length === 0 && (
            <Card className="flex flex-col items-center justify-center p-8 text-center">
              <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-1">Aucun document trouvé</h3>
              <p className="text-gray-500 mb-4">Il n'y a pas de documents correspondant à votre recherche.</p>
              <Button variant="outline" onClick={() => setActiveFilter("tous")}>Voir tous les documents</Button>
            </Card>
          )}
          {/* Pagination */}
          {filteredDocuments.length > 0 && (
            <div className="flex justify-between items-center mt-8">
              <p className="text-sm text-gray-700">
                Affichage de <span className="font-medium">1</span> à <span className="font-medium">{filteredDocuments.length}</span> sur <span className="font-medium">{mockDocuments.length}</span> documents
              </p>
              <div className="flex space-x-1">
                <Button variant="outline" size="sm" disabled>
                  Précédent
                </Button>
                <Button variant="default" size="sm" className="px-4">
                  1
                </Button>
                <Button variant="outline" size="sm" className="px-4">
                  2
                </Button>
                <Button variant="outline" size="sm" className="px-4">
                  3
                </Button>
                <Button variant="outline" size="sm">
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
