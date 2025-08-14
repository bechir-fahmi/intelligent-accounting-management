import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  SearchFilters,
  SemanticFieldSearchParams,
} from "@/services/documents.service";
import {
  ChevronDown,
  ChevronUp,
  Search,
  X,
  Calendar as CalendarIcon,
  Filter,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void;
  onSemanticFieldSearch: (params: SemanticFieldSearchParams) => void;
  onClear: () => void;
  isLoading?: boolean;
}

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  onSearch,
  onSemanticFieldSearch,
  onClear,
  isLoading = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    clientName: "",
    documentType: "all",
    dateFrom: "",
    dateTo: "",
    sortBy: "createdAt",
    sortOrder: "DESC",
  });
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [exactDate, setExactDate] = useState<Date | undefined>();
  const [useExactSearch, setUseExactSearch] = useState(true); // Default to exact search since it's the only one working

  const documentTypes = [
    { value: "invoice", label: "Facture" },
    { value: "quote", label: "Devis" },
    { value: "purchase_order", label: "Bon de commande" },
    { value: "receipt", label: "Reçu" },
    { value: "bank_statement", label: "Relevé bancaire" },
    { value: "tax_document", label: "Document fiscal" },
    { value: "delivery_note", label: "Bon de livraison" },
    { value: "expense_report", label: "Note de frais" },
    { value: "payslip", label: "Fiche de paie" },
    { value: "other", label: "Autre" },
  ];

  const sortOptions = [
    { value: "createdAt", label: "Date de création" },
    { value: "originalName", label: "Nom du fichier" },
    { value: "type", label: "Type de document" },
    { value: "size", label: "Taille du fichier" },
  ];

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleDateChange = (type: "from" | "to", date: Date | undefined) => {
    if (type === "from") {
      setDateFrom(date);
      setFilters((prev) => ({
        ...prev,
        dateFrom: date ? format(date, "yyyy-MM-dd") : "",
      }));
    } else {
      setDateTo(date);
      setFilters((prev) => ({
        ...prev,
        dateTo: date ? format(date, "yyyy-MM-dd") : "",
      }));
    }
  };

  const handleSearch = () => {
    if (useExactSearch) {
      // Use semantic field search for exact matching in extracted data
      const semanticParams: SemanticFieldSearchParams = {};
      if (filters.clientName) semanticParams.clientName = filters.clientName;
      if (exactDate) semanticParams.date = exactDate.getFullYear().toString();

      onSemanticFieldSearch(semanticParams);
    } else {
      // Use advanced search for complex filtering (when available)
      onSearch(filters);
    }
  };

  const handleClear = () => {
    setFilters({
      query: "",
      clientName: "",
      documentType: "all",
      dateFrom: "",
      dateTo: "",
      sortBy: "createdAt",
      sortOrder: "DESC",
    });
    setDateFrom(undefined);
    setDateTo(undefined);
    setExactDate(undefined);
    setUseExactSearch(false);
    onClear();
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.query) count++;
    if (filters.clientName) count++;
    if (filters.documentType) count++;
    if (useExactSearch) {
      if (exactDate) count++;
    } else {
      if (filters.dateFrom) count++;
      if (filters.dateTo) count++;
    }
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Card className="mb-6">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5" />
                <span>Recherche avancée</span>
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {activeFiltersCount} filtre
                    {activeFiltersCount > 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
              {isOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* Search Mode Toggle */}
            <div className="flex items-center space-x-4 p-3 bg-purple-50 rounded-md border border-purple-200">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="exactSearch"
                  checked={useExactSearch}
                  onChange={(e) => setUseExactSearch(e.target.checked)}
                  className="rounded"
                />
                <Label
                  htmlFor="exactSearch"
                  className="text-sm font-medium text-purple-800"
                >
                  🧠 Recherche sémantique dans les données extraites
                  (Recommandée)
                </Label>
              </div>
              <div className="text-xs text-purple-700">
                {useExactSearch
                  ? "✅ Recherche dans les informations extraites par IA (client_name, année, etc.)"
                  : "⚠️ Recherche textuelle classique - Fonctionnalité en développement"}
              </div>
            </div>

            {/* Basic Search */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="query">
                  Recherche textuelle (Non disponible)
                </Label>
                <Input
                  id="query"
                  placeholder="Fonctionnalité en développement..."
                  value={filters.query}
                  onChange={(e) => handleFilterChange("query", e.target.value)}
                  disabled={true}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientName">Nom du client</Label>
                <Input
                  id="clientName"
                  placeholder="Nom ou entreprise du client"
                  value={filters.clientName}
                  onChange={(e) =>
                    handleFilterChange("clientName", e.target.value)
                  }
                />
              </div>
            </div>

            {/* Document Type and Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="documentType">Type de document</Label>
                <Select
                  value={filters.documentType}
                  onValueChange={(value) =>
                    handleFilterChange("documentType", value)
                  }
                  disabled={useExactSearch}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    {documentTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {useExactSearch ? (
                <div className="space-y-2 md:col-span-2">
                  <Label>Année exacte</Label>
                  <Input
                    type="number"
                    placeholder="Ex: 2025"
                    min="1900"
                    max="2099"
                    value={exactDate ? new Date(exactDate).getFullYear() : ""}
                    onChange={(e) => {
                      const year = e.target.value;
                      if (year && year.length === 4) {
                        setExactDate(new Date(`${year}-01-01`));
                      } else {
                        setExactDate(undefined);
                      }
                    }}
                  />
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Date de début</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateFrom
                            ? format(dateFrom, "dd/MM/yyyy", { locale: fr })
                            : "Sélectionner"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={dateFrom}
                          onSelect={(date) => handleDateChange("from", date)}
                          initialFocus
                          locale={fr}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>Date de fin</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateTo
                            ? format(dateTo, "dd/MM/yyyy", { locale: fr })
                            : "Sélectionner"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={dateTo}
                          onSelect={(date) => handleDateChange("to", date)}
                          initialFocus
                          locale={fr}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </>
              )}
            </div>

            {/* Sorting Options - Only for advanced search */}
            {!useExactSearch && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sortBy">Trier par</Label>
                  <Select
                    value={filters.sortBy}
                    onValueChange={(value) =>
                      handleFilterChange("sortBy", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sortOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sortOrder">Ordre</Label>
                  <Select
                    value={filters.sortOrder}
                    onValueChange={(value) =>
                      handleFilterChange("sortOrder", value as "ASC" | "DESC")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DESC">Décroissant</SelectItem>
                      <SelectItem value="ASC">Croissant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={handleClear}>
                <X className="h-4 w-4 mr-2" />
                Effacer
              </Button>
              <Button onClick={handleSearch} disabled={isLoading}>
                <Search className="h-4 w-4 mr-2" />
                {isLoading ? "Recherche..." : "Rechercher"}
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default AdvancedSearch;
