import { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DocumentCard from "@/components/DocumentCard";
import AdvancedSearch from "@/components/AdvancedSearch";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import {
  documentsService,
  Document,
  SearchFilters,
  SemanticFieldSearchParams,
  PaginatedResponse,
} from "@/services/documents.service";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "react-hot-toast";
import { Search, Loader2 } from "lucide-react";
import {
  parseSearchQuery,
  createSemanticSearchParams,
  getSearchDescription,
} from "@/utils/searchParser";

const Documents = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<
    "tous" | "factures" | "devis" | "bons_commande"
  >("tous");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 9,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [isAdvancedSearch, setIsAdvancedSearch] = useState(false);
  const [currentFilters, setCurrentFilters] = useState<SearchFilters>({});
  useAuth();

  useEffect(() => {
    loadDocuments();
  }, [currentPage, itemsPerPage]);

  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await documentsService.getAllDocuments(
        currentPage,
        itemsPerPage,
        "createdAt",
        "DESC"
      );

      if (response && response.data) {
        setDocuments(response.data);
        setPagination(response.pagination);
      } else {
        setDocuments([]);
        setPagination({
          page: 1,
          limit: itemsPerPage,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        });
      }
    } catch (error) {
      console.error("Error loading documents:", error);
      toast.error("Erreur lors du chargement des documents");
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage]);

  const handleQuickSearch = async (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    setIsAdvancedSearch(true);

    if (!query.trim()) {
      loadDocuments();
      return;
    }

    try {
      setLoading(true);

      // Parse the search query to detect client name, date, or both
      const parsedSearch = parseSearchQuery(query);

      if (parsedSearch.searchType === "unknown") {
        toast.error(
          "Format de recherche non reconnu. Utilisez: nom client, année (ex: 2025), ou les deux."
        );
        setLoading(false);
        return;
      }

      // Create semantic search parameters
      const semanticParams = createSemanticSearchParams(parsedSearch);

      const response = await documentsService.semanticFieldSearch(
        semanticParams,
        1,
        itemsPerPage
      );

      if (response && response.data) {
        setDocuments(response.data);
        setPagination(response.pagination);

        // Store filters for pagination
        setCurrentFilters({
          clientName: parsedSearch.clientName,
          dateFrom: parsedSearch.year, // Store year in dateFrom for consistency
        });

        // Show descriptive success message
        const description = getSearchDescription(parsedSearch);
        toast.success(
          `${response.data.length} document(s) trouvé(s) - ${description}`
        );
      } else {
        setDocuments([]);
        const description = getSearchDescription(parsedSearch);
        toast(`Aucun document trouvé - ${description}`);
      }
    } catch (error) {
      console.error("Error searching documents:", error);
      toast.error("Erreur lors de la recherche");
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdvancedSearch = async (filters: SearchFilters) => {
    setCurrentFilters(filters);
    setCurrentPage(1);
    setIsAdvancedSearch(true);
    setSearchQuery("");

    try {
      setLoading(true);
      const response = await documentsService.advancedSearch(
        {
          ...filters,
          documentType: filters.documentType === 'all' ? '' : filters.documentType
        },
        1,
        itemsPerPage
      );

      if (response && response.data) {
        setDocuments(response.data);
        setPagination(response.pagination);
      } else {
        setDocuments([]);
      }
    } catch (error) {
      console.error("Error in advanced search:", error);
      toast.error("Erreur lors de la recherche avancée");
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSemanticFieldSearch = async (
    params: SemanticFieldSearchParams
  ) => {
    setCurrentFilters({ clientName: params.clientName, dateFrom: params.date });
    setCurrentPage(1);
    setIsAdvancedSearch(true);
    setSearchQuery("");

    try {
      setLoading(true);
      const response = await documentsService.semanticFieldSearch(
        params,
        1,
        itemsPerPage
      );

      if (response && response.data) {
        setDocuments(response.data);
        setPagination(response.pagination);
        toast.success(
          `${response.data.length} document(s) trouvé(s) dans les données extraites`
        );
      } else {
        setDocuments([]);
      }
    } catch (error) {
      console.error("Error in semantic field search:", error);
      toast.error("Erreur lors de la recherche sémantique");
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setCurrentFilters({});
    setIsAdvancedSearch(false);
    setCurrentPage(1);
    loadDocuments();
  };

  // Handle page changes with server-side pagination
  const handlePageChange = async (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });

    try {
      setLoading(true);
      let response: PaginatedResponse<Document>;

      if (isAdvancedSearch) {
        // Check if it's a semantic field search (has clientName or exact date)
        if (currentFilters.clientName || currentFilters.dateFrom) {
          const semanticParams: SemanticFieldSearchParams = {};
          if (currentFilters.clientName)
            semanticParams.clientName = currentFilters.clientName;
          if (currentFilters.dateFrom)
            semanticParams.date = currentFilters.dateFrom;
          response = await documentsService.semanticFieldSearch(
            semanticParams,
            page,
            itemsPerPage
          );
        } else {
          // Fallback to regular document listing
          response = await documentsService.getAllDocuments(
            page,
            itemsPerPage,
            "createdAt",
            "DESC"
          );
        }
      } else {
        // Default to regular document listing
        response = await documentsService.getAllDocuments(
          page,
          itemsPerPage,
          "createdAt",
          "DESC"
        );
      }

      if (response && response.data) {
        setDocuments(response.data);
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error("Error changing page:", error);
      toast.error("Erreur lors du changement de page");
    } finally {
      setLoading(false);
    }
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value));
    setCurrentPage(1);
  };

  // Filter documents by type (client-side for quick filtering)
  const filteredDocuments = documents.filter((doc) => {
    if (activeFilter === "tous") return true;

    const typeMap: { [key: string]: string } = {
      factures: "invoice",
      devis: "quote",
      bons_commande: "purchase_order",
    };

    return doc.type && doc.type.toLowerCase() === typeMap[activeFilter];
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
              <p className="text-gray-500">
                Consultez et gérez vos documents comptables
              </p>

              {/* Feature Status */}
              <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-green-800">
                      Fonctionnalités disponibles
                    </h3>
                    <ul className="mt-1 text-xs text-green-700 space-y-1">
                      <li>
                        ✅ <strong>Recherche sémantique</strong> - Recherche
                        dans les données extraites par IA (client_name, date)
                      </li>
                      <li>
                        ✅ <strong>Recherche textuelle</strong> - Recherche par
                        mots-clés dans les documents
                      </li>
                      <li>
                        ✅ <strong>Pagination</strong> - Navigation efficace
                        dans les résultats
                      </li>
                    </ul>
                    <p className="mt-2 text-xs text-blue-600">
                      🚀 <strong>Bientôt :</strong> Recherche sémantique
                      complète, recherche hybride, et filtres avancés
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Search Instructions */}
          <div className="mb-4 p-4 bg-purple-50 rounded-md border border-purple-200">
            <div className="flex items-start space-x-3">
              <Search className="h-4 w-4 text-purple-600 mt-0.5" />
              <div className="flex-1">
                <span className="text-sm font-medium text-purple-800">
                  🧠 Recherche sémantique intelligente
                </span>
                <div className="text-xs text-purple-600 mt-2 space-y-1">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div className="bg-white p-2 rounded border">
                      <strong>Par client :</strong>
                      <br />
                      <code className="text-xs">M. BACHIR FAHMI</code>
                    </div>
                    <div className="bg-white p-2 rounded border">
                      <strong>Par année :</strong>
                      <br />
                      <code className="text-xs">2025</code>
                    </div>
                    <div className="bg-white p-2 rounded border">
                      <strong>Combiné :</strong>
                      <br />
                      <code className="text-xs">M. BACHIR FAHMI 2025</code>
                    </div>
                  </div>
                  <p className="mt-2 text-xs">
                    <strong>Format année :</strong> 4 chiffres (ex: 2025, 2024,
                    2023...)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="Ex: M. BACHIR FAHMI, 2025, ou M. BACHIR FAHMI 2025"
                className="pl-10"
                value={searchQuery}
                onChange={(e) => handleQuickSearch(e.target.value)}
              />
              {loading && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                </div>
              )}
            </div>
          </div>

          {/* Semantic Field Search - Searches in extracted document data */}
          <AdvancedSearch
            onSearch={handleAdvancedSearch}
            onSemanticFieldSearch={handleSemanticFieldSearch}
            onClear={handleClearSearch}
            isLoading={loading}
          />

          {/* Active Search Indicator */}
          {(searchQuery || isAdvancedSearch) && (
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">Recherche sémantique active</Badge>
                {searchQuery && (
                  <div className="text-sm text-gray-600">
                    {(() => {
                      const parsed = parseSearchQuery(searchQuery);
                      return getSearchDescription(parsed);
                    })()}
                  </div>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={handleClearSearch}>
                Effacer la recherche
              </Button>
            </div>
          )}

          {/* Filters and Controls */}
          <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
            <div className="flex gap-2">
              <Button
                variant={activeFilter === "tous" ? "default" : "outline"}
                onClick={() => setActiveFilter("tous")}
              >
                Tous
              </Button>
              <Button
                variant={activeFilter === "factures" ? "default" : "outline"}
                onClick={() => setActiveFilter("factures")}
              >
                Factures
              </Button>
              <Button
                variant={activeFilter === "devis" ? "default" : "outline"}
                onClick={() => setActiveFilter("devis")}
              >
                Devis
              </Button>
              <Button
                variant={
                  activeFilter === "bons_commande" ? "default" : "outline"
                }
                onClick={() => setActiveFilter("bons_commande")}
              >
                Bons de commande
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Afficher:</span>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={handleItemsPerPageChange}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">6</SelectItem>
                  <SelectItem value="9">9</SelectItem>
                  <SelectItem value="12">12</SelectItem>
                  <SelectItem value="18">18</SelectItem>
                  <SelectItem value="24">24</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-600">par page</span>
            </div>
          </div>

          {/* Results Summary */}
          {!loading && filteredDocuments.length > 0 && (
            <div className="mb-4 flex justify-between items-center text-sm text-gray-600">
              <span>
                Affichage de {(pagination.page - 1) * pagination.limit + 1} à{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                sur {pagination.total} documents
              </span>
              <span>
                Page {pagination.page} sur {pagination.totalPages}
              </span>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}

          {/* Documents Grid */}
          {!loading && filteredDocuments.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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
                  hasSharedUsers={document.hasSharedUsers}
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

          {/* Pagination */}
          {!loading &&
            filteredDocuments.length > 0 &&
            pagination.totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() =>
                          handlePageChange(Math.max(1, pagination.page - 1))
                        }
                        className={
                          !pagination.hasPrev
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>

                    {/* Page Numbers */}
                    {Array.from(
                      { length: pagination.totalPages },
                      (_, i) => i + 1
                    ).map((page) => {
                      // Show first page, last page, current page, and pages around current page
                      if (
                        page === 1 ||
                        page === pagination.totalPages ||
                        (page >= pagination.page - 1 &&
                          page <= pagination.page + 1)
                      ) {
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => handlePageChange(page)}
                              isActive={pagination.page === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      }

                      // Show ellipsis
                      if (
                        page === pagination.page - 2 ||
                        page === pagination.page + 2
                      ) {
                        return (
                          <PaginationItem key={page}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        );
                      }

                      return null;
                    })}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() =>
                          handlePageChange(
                            Math.min(pagination.totalPages, pagination.page + 1)
                          )
                        }
                        className={
                          !pagination.hasNext
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}

          {/* Empty State */}
          {!loading && filteredDocuments.length === 0 && (
            <Card className="flex flex-col items-center justify-center p-8 text-center">
              <svg
                className="w-16 h-16 text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                Aucun document trouvé
              </h3>
              <p className="text-gray-500 mb-4">
                Il n'y a pas de documents correspondant à votre recherche.
              </p>
              <Button variant="outline" onClick={() => setActiveFilter("tous")}>
                Voir tous les documents
              </Button>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Documents;
