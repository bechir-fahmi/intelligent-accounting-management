/**
 * Bilan Report Display Component
 *
 * @author Bachir Fahmi <bachirfahmi5@gmail.com>
 * @repository https://github.com/bechir-fahmi
 * @description Professional balance sheet and income statement display component
 *              with financial ratios, analysis, and export capabilities
 * @created 2025
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { bilanService } from "@/services/bilan.service";
import {
  FileText,
  Download,
  Printer,
  Share2,
  TrendingUp,
  TrendingDown,
  PieChart,
  AlertCircle,
  CheckCircle2,
  Clock,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface BilanReportProps {
  report: any; // Updated to handle new structure
  onExportPDF?: () => void;
  onExportExcel?: () => void;
  onPrint?: () => void;
  onShare?: () => void;
}

const BilanReport: React.FC<BilanReportProps> = ({
  report,
  onExportPDF,
  onExportExcel,
  onPrint,
  onShare,
}) => {
  const formatCurrency = (amount: number) =>
    bilanService.formatCurrency(amount || 0);
  const formatPercentage = (value: number) =>
    bilanService.formatPercentage(value || 0);

  // Safety checks for report structure
  if (!report || !report.actifs || !report.capitaux_propres_et_passifs) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Erreur de données
          </h3>
          <p className="text-gray-500">
            Les données du bilan sont incomplètes ou corrompues.
            {!report && " (Aucune donnée reçue)"}
            {report && !report.actifs && " (Structure actifs manquante)"}
          </p>
          <details className="mt-4 text-left">
            <summary className="cursor-pointer text-sm text-gray-600">
              Voir les données reçues
            </summary>
            <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
              {JSON.stringify(report, null, 2)}
            </pre>
          </details>
        </CardContent>
      </Card>
    );
  }

  // Get available years from the data and sort them (most recent first)
  const availableYearKeys = Object.keys(report.date || {}).sort((a, b) => {
    const yearA = parseInt(a.split("-")[0]);
    const yearB = parseInt(b.split("-")[0]);
    return yearB - yearA; // Sort descending (most recent first)
  });

  // Extract just the year part for data access
  const currentYear = availableYearKeys[0]
    ? availableYearKeys[0].split("-")[0]
    : "2025";
  const previousYear = availableYearKeys[1]
    ? availableYearKeys[1].split("-")[0]
    : "2024";

  // Keep full keys for display purposes
  const currentYearDisplay = availableYearKeys[0] || "2025-12-31";
  const previousYearDisplay = availableYearKeys[1] || "2024-12-31";

  // Debug logging
  console.log("Available year keys:", availableYearKeys);
  console.log("Current year for data access:", currentYear);
  console.log("Previous year for data access:", previousYear);
  console.log(
    "Sample data check - clients_et_comptes_rattaches:",
    report.actifs?.actifs_courants?.clients_et_comptes_rattaches?.net
  );
  console.log(
    "Sample value for 2025:",
    report.actifs?.actifs_courants?.clients_et_comptes_rattaches?.net?.[
      currentYear
    ]
  );

  const isBalanced =
    Math.abs(
      (report.actifs?.total_actifs?.[currentYear] || 0) -
        (report.capitaux_propres_et_passifs
          ?.total_capitaux_propres_et_passifs?.[currentYear] || 0)
    ) < 0.01;

  const renderReportHeader = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-6 w-6" />
              <span>Bilan Comptable</span>
            </CardTitle>
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>
                  Généré le{" "}
                  {format(new Date(), "dd/MM/yyyy à HH:mm", { locale: fr })}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>
                  Exercices: {report.date?.[currentYearDisplay]} vs{" "}
                  {report.date?.[previousYearDisplay]}
                </span>
              </div>
              <Badge variant="outline">Comparaison sur 2 exercices</Badge>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={onPrint}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimer
            </Button>
            <Button variant="outline" size="sm" onClick={onExportExcel}>
              <Download className="h-4 w-4 mr-2" />
              Excel
            </Button>
            <Button variant="outline" size="sm" onClick={onExportPDF}>
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <Button variant="outline" size="sm" onClick={onShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Partager
            </Button>
          </div>
        </div>
      </CardHeader>
    </Card>
  );

  const renderBalanceVerification = () => (
    <Card>
      <CardContent className="p-4">
        <div
          className={`flex items-center space-x-2 ${
            isBalanced ? "text-green-600" : "text-red-600"
          }`}
        >
          {isBalanced ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span className="font-medium">
            {isBalanced
              ? "Bilan équilibré - Actif = Passif"
              : "Attention: Déséquilibre détecté dans le bilan"}
          </span>
          <Badge variant={isBalanced ? "default" : "destructive"}>
            Écart:{" "}
            {formatCurrency(
              Math.abs(
                (report.actifs?.total_actifs?.[currentYear] || 0) -
                  (report.capitaux_propres_et_passifs
                    ?.total_capitaux_propres_et_passifs?.[currentYear] || 0)
              )
            )}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {renderReportHeader()}
      {renderBalanceVerification()}

      {/* Balance Sheet */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ACTIF */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span>ACTIF</span>
              <Badge variant="outline">
                {formatCurrency(
                  report.actifs?.total_actifs?.[currentYear] || 0
                )}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Header with years */}
            <div className="grid grid-cols-3 gap-4 text-sm font-medium text-gray-600 border-b pb-2">
              <span></span>
              <span className="text-center">{currentYear}</span>
              <span className="text-center">{previousYear}</span>
            </div>

            {/* Actif Non Courant */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                Actif Non Courant
              </h4>
              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-3 gap-4">
                  <span>Immobilisations incorporelles</span>
                  <span className="text-right">
                    {formatCurrency(
                      report.actifs?.actifs_non_courants
                        ?.immobilisations_incorporelles?.net || 0
                    )}
                  </span>
                  <span className="text-right text-gray-500">-</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <span>Immobilisations corporelles</span>
                  <span className="text-right">
                    {formatCurrency(
                      report.actifs?.actifs_non_courants
                        ?.immobilisations_corporelles?.net?.[currentYear] || 0
                    )}
                  </span>
                  <span className="text-right text-gray-500">
                    {formatCurrency(
                      report.actifs?.actifs_non_courants
                        ?.immobilisations_corporelles?.net?.[previousYear] || 0
                    )}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <span>Immobilisations financières</span>
                  <span className="text-right">
                    {formatCurrency(
                      report.actifs?.actifs_non_courants
                        ?.immobilisations_financieres?.net || 0
                    )}
                  </span>
                  <span className="text-right text-gray-500">-</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <span>Autres actifs non courants</span>
                  <span className="text-right">
                    {formatCurrency(
                      report.actifs?.actifs_non_courants
                        ?.autres_actifs_non_courants || 0
                    )}
                  </span>
                  <span className="text-right text-gray-500">-</span>
                </div>
                <div className="grid grid-cols-3 gap-4 font-medium border-t pt-2">
                  <span>Total Actifs Immobilisés</span>
                  <span className="text-right">
                    {formatCurrency(
                      report.actifs?.actifs_non_courants
                        ?.total_actifs_immobilises?.[currentYear] || 0
                    )}
                  </span>
                  <span className="text-right">
                    {formatCurrency(
                      report.actifs?.actifs_non_courants
                        ?.total_actifs_immobilises?.[previousYear] || 0
                    )}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 font-medium">
                  <span>Total Actifs Non Courants</span>
                  <span className="text-right">
                    {formatCurrency(
                      report.actifs?.actifs_non_courants?.total?.[
                        currentYear
                      ] || 0
                    )}
                  </span>
                  <span className="text-right">
                    {formatCurrency(
                      report.actifs?.actifs_non_courants?.total?.[
                        previousYear
                      ] || 0
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Actif Courant */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Actif Courant</h4>
              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-3 gap-4">
                  <span>Stocks</span>
                  <span className="text-right">
                    {formatCurrency(
                      report.actifs?.actifs_courants?.stocks?.net?.[
                        currentYear
                      ] || 0
                    )}
                  </span>
                  <span className="text-right text-gray-500">
                    {formatCurrency(
                      report.actifs?.actifs_courants?.stocks?.net?.[
                        previousYear
                      ] || 0
                    )}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <span>Clients et comptes rattachés</span>
                  <span className="text-right">
                    {formatCurrency(
                      report.actifs?.actifs_courants
                        ?.clients_et_comptes_rattaches?.net?.[currentYear] || 0
                    )}
                  </span>
                  <span className="text-right text-gray-500">
                    {formatCurrency(
                      report.actifs?.actifs_courants
                        ?.clients_et_comptes_rattaches?.net?.[previousYear] || 0
                    )}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <span>Autres actifs courants</span>
                  <span className="text-right">
                    {formatCurrency(
                      report.actifs?.actifs_courants?.autres_actifs_courants?.[
                        currentYear
                      ] || 0
                    )}
                  </span>
                  <span className="text-right text-gray-500">
                    {formatCurrency(
                      report.actifs?.actifs_courants?.autres_actifs_courants?.[
                        previousYear
                      ] || 0
                    )}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <span>Placements et autres actifs financiers</span>
                  <span className="text-right">
                    {formatCurrency(
                      report.actifs?.actifs_courants
                        ?.placements_et_autres_actifs_financiers || 0
                    )}
                  </span>
                  <span className="text-right text-gray-500">-</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <span>Liquidités et équivalents</span>
                  <span className="text-right">
                    {formatCurrency(
                      report.actifs?.actifs_courants
                        ?.liquidites_et_equivalents?.[currentYear] || 0
                    )}
                  </span>
                  <span className="text-right text-gray-500">
                    {formatCurrency(
                      report.actifs?.actifs_courants
                        ?.liquidites_et_equivalents?.[previousYear] || 0
                    )}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 font-medium border-t pt-2">
                  <span>Total Actif Courant</span>
                  <span className="text-right">
                    {formatCurrency(
                      report.actifs?.actifs_courants?.total?.[currentYear] || 0
                    )}
                  </span>
                  <span className="text-right">
                    {formatCurrency(
                      report.actifs?.actifs_courants?.total?.[previousYear] || 0
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="grid grid-cols-3 gap-4 font-bold text-lg">
                <span>TOTAL ACTIF</span>
                <span className="text-right">
                  {formatCurrency(
                    report.actifs?.total_actifs?.[currentYear] || 0
                  )}
                </span>
                <span className="text-right">
                  {formatCurrency(
                    report.actifs?.total_actifs?.[previousYear] || 0
                  )}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PASSIF */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              <span>PASSIF</span>
              <Badge variant="outline">
                {formatCurrency(
                  report.capitaux_propres_et_passifs
                    ?.total_capitaux_propres_et_passifs?.[currentYear] || 0
                )}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Header with years */}
            <div className="grid grid-cols-3 gap-4 text-sm font-medium text-gray-600 border-b pb-2">
              <span></span>
              <span className="text-center">{currentYear}</span>
              <span className="text-center">{previousYear}</span>
            </div>

            {/* Capitaux Propres */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                Capitaux Propres
              </h4>
              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-3 gap-4">
                  <span>Capital social</span>
                  <span className="text-right">
                    {formatCurrency(
                      report.capitaux_propres_et_passifs?.capitaux_propres
                        ?.capital_social?.[currentYear] || 0
                    )}
                  </span>
                  <span className="text-right text-gray-500">
                    {formatCurrency(
                      report.capitaux_propres_et_passifs?.capitaux_propres
                        ?.capital_social?.[previousYear] || 0
                    )}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <span>Réserves</span>
                  <span className="text-right">
                    {formatCurrency(
                      report.capitaux_propres_et_passifs?.capitaux_propres
                        ?.reserves?.[currentYear] || 0
                    )}
                  </span>
                  <span className="text-right text-gray-500">
                    {formatCurrency(
                      report.capitaux_propres_et_passifs?.capitaux_propres
                        ?.reserves?.[previousYear] || 0
                    )}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <span>Autres capitaux propres</span>
                  <span className="text-right">
                    {formatCurrency(
                      report.capitaux_propres_et_passifs?.capitaux_propres
                        ?.autres_capitaux_propres?.[currentYear] || 0
                    )}
                  </span>
                  <span className="text-right text-gray-500">
                    {formatCurrency(
                      report.capitaux_propres_et_passifs?.capitaux_propres
                        ?.autres_capitaux_propres?.[previousYear] || 0
                    )}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <span>Résultats reportés</span>
                  <span className="text-right">
                    {formatCurrency(
                      report.capitaux_propres_et_passifs?.capitaux_propres
                        ?.resultats_reportes?.[currentYear] || 0
                    )}
                  </span>
                  <span className="text-right text-gray-500">
                    {formatCurrency(
                      report.capitaux_propres_et_passifs?.capitaux_propres
                        ?.resultats_reportes?.[previousYear] || 0
                    )}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 font-medium border-t pt-2">
                  <span>Total avant résultat</span>
                  <span className="text-right">
                    {formatCurrency(
                      report.capitaux_propres_et_passifs?.capitaux_propres
                        ?.total_avant_resultat?.[currentYear] || 0
                    )}
                  </span>
                  <span className="text-right">
                    {formatCurrency(
                      report.capitaux_propres_et_passifs?.capitaux_propres
                        ?.total_avant_resultat?.[previousYear] || 0
                    )}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <span>Résultat de l'exercice</span>
                  <span
                    className={`text-right ${
                      (report.capitaux_propres_et_passifs?.capitaux_propres
                        ?.resultat_exercice?.[currentYear] || 0) >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {formatCurrency(
                      report.capitaux_propres_et_passifs?.capitaux_propres
                        ?.resultat_exercice?.[currentYear] || 0
                    )}
                  </span>
                  <span
                    className={`text-right ${
                      (report.capitaux_propres_et_passifs?.capitaux_propres
                        ?.resultat_exercice?.[previousYear] || 0) >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {formatCurrency(
                      report.capitaux_propres_et_passifs?.capitaux_propres
                        ?.resultat_exercice?.[previousYear] || 0
                    )}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 font-medium border-t pt-2">
                  <span>Total Capitaux Propres</span>
                  <span className="text-right">
                    {formatCurrency(
                      report.capitaux_propres_et_passifs?.capitaux_propres
                        ?.total?.[currentYear] || 0
                    )}
                  </span>
                  <span className="text-right">
                    {formatCurrency(
                      report.capitaux_propres_et_passifs?.capitaux_propres
                        ?.total?.[previousYear] || 0
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Passif Non Courant */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                Passif Non Courant
              </h4>
              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-3 gap-4">
                  <span>Emprunts</span>
                  <span className="text-right">
                    {formatCurrency(
                      report.capitaux_propres_et_passifs?.passifs
                        ?.passifs_non_courants?.emprunts || 0
                    )}
                  </span>
                  <span className="text-right text-gray-500">-</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <span>Autres passifs financiers</span>
                  <span className="text-right">
                    {formatCurrency(
                      report.capitaux_propres_et_passifs?.passifs
                        ?.passifs_non_courants?.autres_passifs_financiers || 0
                    )}
                  </span>
                  <span className="text-right text-gray-500">-</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <span>Provisions</span>
                  <span className="text-right">
                    {formatCurrency(
                      report.capitaux_propres_et_passifs?.passifs
                        ?.passifs_non_courants?.provisions || 0
                    )}
                  </span>
                  <span className="text-right text-gray-500">-</span>
                </div>
                <div className="grid grid-cols-3 gap-4 font-medium border-t pt-2">
                  <span>Total Passif Non Courant</span>
                  <span className="text-right">
                    {formatCurrency(
                      report.capitaux_propres_et_passifs?.passifs
                        ?.passifs_non_courants?.total || 0
                    )}
                  </span>
                  <span className="text-right text-gray-500">-</span>
                </div>
              </div>
            </div>

            {/* Passif Courant */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Passif Courant</h4>
              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-3 gap-4">
                  <span>Fournisseurs et comptes rattachés</span>
                  <span className="text-right">
                    {formatCurrency(
                      report.capitaux_propres_et_passifs?.passifs
                        ?.passifs_courants?.fournisseurs_et_comptes_rattaches?.[
                        currentYear
                      ] || 0
                    )}
                  </span>
                  <span className="text-right text-gray-500">
                    {formatCurrency(
                      report.capitaux_propres_et_passifs?.passifs
                        ?.passifs_courants?.fournisseurs_et_comptes_rattaches?.[
                        previousYear
                      ] || 0
                    )}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <span>Autres passifs courants</span>
                  <span className="text-right">
                    {formatCurrency(
                      report.capitaux_propres_et_passifs?.passifs
                        ?.passifs_courants?.autres_passifs_courants?.[
                        currentYear
                      ] || 0
                    )}
                  </span>
                  <span className="text-right text-gray-500">
                    {formatCurrency(
                      report.capitaux_propres_et_passifs?.passifs
                        ?.passifs_courants?.autres_passifs_courants?.[
                        previousYear
                      ] || 0
                    )}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <span>Concours bancaires et autres</span>
                  <span className="text-right">
                    {formatCurrency(
                      report.capitaux_propres_et_passifs?.passifs
                        ?.passifs_courants?.concours_bancaires_et_autres || 0
                    )}
                  </span>
                  <span className="text-right text-gray-500">-</span>
                </div>
                <div className="grid grid-cols-3 gap-4 font-medium border-t pt-2">
                  <span>Total Passif Courant</span>
                  <span className="text-right">
                    {formatCurrency(
                      report.capitaux_propres_et_passifs?.passifs
                        ?.passifs_courants?.total?.[currentYear] || 0
                    )}
                  </span>
                  <span className="text-right">
                    {formatCurrency(
                      report.capitaux_propres_et_passifs?.passifs
                        ?.passifs_courants?.total?.[previousYear] || 0
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="grid grid-cols-3 gap-4 font-medium">
                <span>Total Passifs</span>
                <span className="text-right">
                  {formatCurrency(
                    report.capitaux_propres_et_passifs?.passifs
                      ?.total_passifs?.[currentYear] || 0
                  )}
                </span>
                <span className="text-right">
                  {formatCurrency(
                    report.capitaux_propres_et_passifs?.passifs
                      ?.total_passifs?.[previousYear] || 0
                  )}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4 font-bold text-lg border-t pt-2 mt-2">
                <span>TOTAL CAPITAUX PROPRES ET PASSIFS</span>
                <span className="text-right">
                  {formatCurrency(
                    report.capitaux_propres_et_passifs
                      ?.total_capitaux_propres_et_passifs?.[currentYear] || 0
                  )}
                </span>
                <span className="text-right">
                  {formatCurrency(
                    report.capitaux_propres_et_passifs
                      ?.total_capitaux_propres_et_passifs?.[previousYear] || 0
                  )}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Ratios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <PieChart className="h-5 w-5" />
            <span>Analyse Comparative</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {formatPercentage(
                  (((report.actifs?.total_actifs?.[currentYear] || 0) -
                    (report.actifs?.total_actifs?.[previousYear] || 0)) /
                    (report.actifs?.total_actifs?.[previousYear] || 1)) *
                    100
                )}
              </div>
              <div className="text-sm text-gray-600">Évolution Actif</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {formatPercentage(
                  (((report.capitaux_propres_et_passifs?.capitaux_propres
                    ?.total?.[currentYear] || 0) -
                    (report.capitaux_propres_et_passifs?.capitaux_propres
                      ?.total?.[previousYear] || 0)) /
                    (report.capitaux_propres_et_passifs?.capitaux_propres
                      ?.total?.[previousYear] || 1)) *
                    100
                )}
              </div>
              <div className="text-sm text-gray-600">
                Évolution Capitaux Propres
              </div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {formatPercentage(
                  ((report.capitaux_propres_et_passifs?.capitaux_propres
                    ?.total?.[currentYear] || 0) /
                    (report.actifs?.total_actifs?.[currentYear] || 1)) *
                    100
                )}
              </div>
              <div className="text-sm text-gray-600">Autonomie Financière</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {(
                  (report.actifs?.actifs_courants?.total?.[currentYear] || 0) /
                  (report.capitaux_propres_et_passifs?.passifs?.passifs_courants
                    ?.total?.[currentYear] || 1)
                ).toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Liquidité Générale</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              <span>Évolutions Positives</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {/* Generate analysis based on data */}
              {(report.capitaux_propres_et_passifs?.capitaux_propres
                ?.resultat_exercice?.[currentYear] || 0) > 0 && (
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">
                    Résultat positif de l'exercice
                  </span>
                </li>
              )}
              {(report.actifs?.total_actifs?.[currentYear] || 0) >
                (report.actifs?.total_actifs?.[previousYear] || 0) && (
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">
                    Croissance du total des actifs
                  </span>
                </li>
              )}
              {(report.capitaux_propres_et_passifs?.capitaux_propres?.total?.[
                currentYear
              ] || 0) >
                (report.capitaux_propres_et_passifs?.capitaux_propres?.total?.[
                  previousYear
                ] || 0) && (
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">
                    Renforcement des capitaux propres
                  </span>
                </li>
              )}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>Points d'Attention</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {(report.capitaux_propres_et_passifs?.capitaux_propres
                ?.resultat_exercice?.[currentYear] || 0) < 0 && (
                <li className="flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">
                    Résultat négatif de l'exercice
                  </span>
                </li>
              )}
              {(report.actifs?.total_actifs?.[currentYear] || 0) <
                (report.actifs?.total_actifs?.[previousYear] || 0) && (
                <li className="flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">
                    Diminution du total des actifs
                  </span>
                </li>
              )}
              {!isBalanced && (
                <li className="flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">
                    Déséquilibre comptable détecté
                  </span>
                </li>
              )}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-blue-600">
              <TrendingUp className="h-5 w-5" />
              <span>Indicateurs Clés</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Variation CA</span>
                <span className="font-medium">
                  {formatPercentage(
                    (((report.actifs?.actifs_courants
                      ?.clients_et_comptes_rattaches?.net?.[currentYear] || 0) -
                      (report.actifs?.actifs_courants
                        ?.clients_et_comptes_rattaches?.net?.[previousYear] ||
                        0)) /
                      (report.actifs?.actifs_courants
                        ?.clients_et_comptes_rattaches?.net?.[previousYear] ||
                        1)) *
                      100
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Variation Stocks</span>
                <span className="font-medium">
                  {formatPercentage(
                    (((report.actifs?.actifs_courants?.stocks?.net?.[
                      currentYear
                    ] || 0) -
                      (report.actifs?.actifs_courants?.stocks?.net?.[
                        previousYear
                      ] || 0)) /
                      (report.actifs?.actifs_courants?.stocks?.net?.[
                        previousYear
                      ] || 1)) *
                      100
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Endettement</span>
                <span className="font-medium">
                  {formatPercentage(
                    ((report.capitaux_propres_et_passifs?.passifs
                      ?.total_passifs?.[currentYear] || 0) /
                      (report.actifs?.total_actifs?.[currentYear] || 1)) *
                      100
                  )}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BilanReport;
