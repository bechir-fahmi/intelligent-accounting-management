/**
 * Bilan Report Display Component
 * 
 * @author Bachir Fahmi <bachirfahmi5@gmail.com>
 * @repository https://github.com/bechir-fahmi
 * @description Professional balance sheet and income statement display component
 *              with financial ratios, analysis, and export capabilities
 * @created 2025
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BilanReport as BilanReportType } from '@/types/bilan.types';
import { bilanService } from '@/services/bilan.service';
import { 
  FileText, 
  Download, 
  Printer, 
  Share2, 
  TrendingUp, 
  TrendingDown, 
  PieChart,
  BarChart3,
  AlertCircle,
  CheckCircle2,
  Clock,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface BilanReportProps {
  report: BilanReportType;
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
  onShare
}) => {
  const formatCurrency = (amount: number) => bilanService.formatCurrency(amount || 0);
  const formatPercentage = (value: number) => bilanService.formatPercentage(value || 0);
  
  // Helper function to safely get nested values
  const safeGet = (obj: any, path: string, defaultValue: any = 0): any => {
    return path.split('.').reduce((current, key) => current?.[key], obj) ?? defaultValue;
  };



  // Safety checks for report structure
  if (!report || !report.bilan_comptable || !report.bilan_comptable.actif || !report.bilan_comptable.passif) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Erreur de données</h3>
          <p className="text-gray-500">
            Les données du bilan sont incomplètes ou corrompues.
            {!report && " (Aucune donnée reçue)"}
            {report && !report.bilan_comptable && " (Structure bilan_comptable manquante)"}
          </p>
          <details className="mt-4 text-left">
            <summary className="cursor-pointer text-sm text-gray-600">Voir les données reçues</summary>
            <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
              {JSON.stringify(report, null, 2)}
            </pre>
          </details>
        </CardContent>
      </Card>
    );
  }

  const isBalanced = Math.abs(
    (report.bilan_comptable.actif.total_actif || 0) - 
    (report.bilan_comptable.passif.total_passif || 0)
  ) < 0.01;

  return (
    <div className="space-y-6">
      {/* Report Header */}
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
                  <span>Généré le {format(new Date(safeGet(report, 'metadata.generated_at', Date.now())), 'dd/MM/yyyy à HH:mm', { locale: fr })}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>Période: {safeGet(report, 'metadata.period_days')} jours</span>
                </div>
                <Badge variant="outline">
                  {safeGet(report, 'metadata.documents_processed')} documents analysés
                </Badge>
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

      {/* Balance Verification */}
      <Card>
        <CardContent className="p-4">
          <div className={`flex items-center space-x-2 ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>
            {isBalanced ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <span className="font-medium">
              {isBalanced 
                ? 'Bilan équilibré - Actif = Passif' 
                : 'Attention: Déséquilibre détecté dans le bilan'
              }
            </span>
            <Badge variant={isBalanced ? "default" : "destructive"}>
              Écart: {formatCurrency(Math.abs(safeGet(report, 'bilan_comptable.actif.total_actif') - safeGet(report, 'bilan_comptable.passif.total_passif')))}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Balance Sheet */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ACTIF */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span>ACTIF</span>
              <Badge variant="outline">{formatCurrency(safeGet(report, 'bilan_comptable.actif.total_actif'))}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Actif Non Courant */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Actif Non Courant</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Immobilisations corporelles</span>
                  <span>{formatCurrency(safeGet(report, 'bilan_comptable.actif.actif_non_courant.immobilisations_corporelles'))}</span>
                </div>
                <div className="flex justify-between">
                  <span>Immobilisations incorporelles</span>
                  <span>{formatCurrency(safeGet(report, 'bilan_comptable.actif.actif_non_courant.immobilisations_incorporelles'))}</span>
                </div>
                <div className="flex justify-between">
                  <span>Immobilisations financières</span>
                  <span>{formatCurrency(safeGet(report, 'bilan_comptable.actif.actif_non_courant.immobilisations_financieres'))}</span>
                </div>
                <div className="flex justify-between font-medium border-t pt-2">
                  <span>Total Actif Non Courant</span>
                  <span>{formatCurrency(safeGet(report, 'bilan_comptable.actif.actif_non_courant.total_actif_non_courant'))}</span>
                </div>
              </div>
            </div>

            {/* Actif Courant */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Actif Courant</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Stocks et en-cours</span>
                  <span>{formatCurrency(safeGet(report, 'bilan_comptable.actif.actif_courant.stocks_et_en_cours'))}</span>
                </div>
                <div className="flex justify-between">
                  <span>Clients et comptes rattachés</span>
                  <span>{formatCurrency(safeGet(report, 'bilan_comptable.actif.actif_courant.clients_et_comptes_rattaches'))}</span>
                </div>
                <div className="flex justify-between">
                  <span>Autres créances</span>
                  <span>{formatCurrency(safeGet(report, 'bilan_comptable.actif.actif_courant.autres_creances'))}</span>
                </div>
                <div className="flex justify-between">
                  <span>Disponibilités</span>
                  <span>{formatCurrency(safeGet(report, 'bilan_comptable.actif.actif_courant.disponibilites'))}</span>
                </div>
                <div className="flex justify-between font-medium border-t pt-2">
                  <span>Total Actif Courant</span>
                  <span>{formatCurrency(safeGet(report, 'bilan_comptable.actif.actif_courant.total_actif_courant'))}</span>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between font-bold text-lg">
                <span>TOTAL ACTIF</span>
                <span>{formatCurrency(safeGet(report, 'bilan_comptable.actif.total_actif'))}</span>
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
              <Badge variant="outline">{formatCurrency(safeGet(report, 'bilan_comptable.passif.total_passif'))}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Capitaux Propres */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Capitaux Propres</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Capital social</span>
                  <span>{formatCurrency(safeGet(report, 'bilan_comptable.passif.capitaux_propres.capital_social'))}</span>
                </div>
                <div className="flex justify-between">
                  <span>Réserves</span>
                  <span>{formatCurrency(safeGet(report, 'bilan_comptable.passif.capitaux_propres.reserves'))}</span>
                </div>
                <div className="flex justify-between">
                  <span>Résultat net de l'exercice</span>
                  <span className={safeGet(report, 'bilan_comptable.passif.capitaux_propres.resultat_net_exercice') >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatCurrency(safeGet(report, 'bilan_comptable.passif.capitaux_propres.resultat_net_exercice'))}
                  </span>
                </div>
                <div className="flex justify-between font-medium border-t pt-2">
                  <span>Total Capitaux Propres</span>
                  <span>{formatCurrency(safeGet(report, 'bilan_comptable.passif.capitaux_propres.total_capitaux_propres'))}</span>
                </div>
              </div>
            </div>

            {/* Passif Non Courant */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Passif Non Courant</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Emprunts et dettes financières LT</span>
                  <span>{formatCurrency(safeGet(report, 'bilan_comptable.passif.passif_non_courant.emprunts_dettes_financieres_lt'))}</span>
                </div>
                <div className="flex justify-between">
                  <span>Provisions LT</span>
                  <span>{formatCurrency(safeGet(report, 'bilan_comptable.passif.passif_non_courant.provisions_lt'))}</span>
                </div>
                <div className="flex justify-between font-medium border-t pt-2">
                  <span>Total Passif Non Courant</span>
                  <span>{formatCurrency(safeGet(report, 'bilan_comptable.passif.passif_non_courant.total_passif_non_courant'))}</span>
                </div>
              </div>
            </div>

            {/* Passif Courant */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Passif Courant</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Fournisseurs et comptes rattachés</span>
                  <span>{formatCurrency(safeGet(report, 'bilan_comptable.passif.passif_courant.fournisseurs_et_comptes_rattaches'))}</span>
                </div>
                <div className="flex justify-between">
                  <span>Dettes fiscales et sociales</span>
                  <span>{formatCurrency(safeGet(report, 'bilan_comptable.passif.passif_courant.dettes_fiscales_et_sociales'))}</span>
                </div>
                <div className="flex justify-between">
                  <span>Autres dettes CT</span>
                  <span>{formatCurrency(safeGet(report, 'bilan_comptable.passif.passif_courant.autres_dettes_ct'))}</span>
                </div>
                <div className="flex justify-between font-medium border-t pt-2">
                  <span>Total Passif Courant</span>
                  <span>{formatCurrency(safeGet(report, 'bilan_comptable.passif.passif_courant.total_passif_courant'))}</span>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between font-bold text-lg">
                <span>TOTAL PASSIF</span>
                <span>{formatCurrency(safeGet(report, 'bilan_comptable.passif.total_passif'))}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Income Statement */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Compte de Résultat</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Produits */}
            <div>
              <h4 className="font-medium text-green-600 mb-3">Produits d'Exploitation</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Chiffre d'affaires</span>
                  <span>{formatCurrency(safeGet(report, 'compte_de_resultat.produits_exploitation.chiffre_affaires'))}</span>
                </div>
                <div className="flex justify-between">
                  <span>Production immobilisée</span>
                  <span>{formatCurrency(safeGet(report, 'compte_de_resultat.produits_exploitation.production_immobilisee'))}</span>
                </div>
                <div className="flex justify-between">
                  <span>Subventions d'exploitation</span>
                  <span>{formatCurrency(safeGet(report, 'compte_de_resultat.produits_exploitation.subventions_exploitation'))}</span>
                </div>
                <div className="flex justify-between">
                  <span>Autres produits d'exploitation</span>
                  <span>{formatCurrency(safeGet(report, 'compte_de_resultat.produits_exploitation.autres_produits_exploitation'))}</span>
                </div>
                <div className="flex justify-between font-medium border-t pt-2 text-green-600">
                  <span>Total Produits</span>
                  <span>{formatCurrency(safeGet(report, 'compte_de_resultat.produits_exploitation.total_produits_exploitation'))}</span>
                </div>
              </div>
            </div>

            {/* Charges */}
            <div>
              <h4 className="font-medium text-red-600 mb-3">Charges d'Exploitation</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Achats consommés</span>
                  <span>{formatCurrency(safeGet(report, 'compte_de_resultat.charges_exploitation.achats_consommes'))}</span>
                </div>
                <div className="flex justify-between">
                  <span>Charges de personnel</span>
                  <span>{formatCurrency(safeGet(report, 'compte_de_resultat.charges_exploitation.charges_personnel'))}</span>
                </div>
                <div className="flex justify-between">
                  <span>Dotations aux amortissements</span>
                  <span>{formatCurrency(safeGet(report, 'compte_de_resultat.charges_exploitation.dotations_amortissements'))}</span>
                </div>
                <div className="flex justify-between">
                  <span>Autres charges d'exploitation</span>
                  <span>{formatCurrency(safeGet(report, 'compte_de_resultat.charges_exploitation.autres_charges_exploitation'))}</span>
                </div>
                <div className="flex justify-between font-medium border-t pt-2 text-red-600">
                  <span>Total Charges</span>
                  <span>{formatCurrency(safeGet(report, 'compte_de_resultat.charges_exploitation.total_charges_exploitation'))}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="mt-6 space-y-3 border-t pt-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">Résultat d'Exploitation</span>
              <span className={`font-bold ${safeGet(report, 'compte_de_resultat.resultat_exploitation') >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(safeGet(report, 'compte_de_resultat.resultat_exploitation'))}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Résultat Financier</span>
              <span className={safeGet(report, 'compte_de_resultat.resultat_financier') >= 0 ? 'text-green-600' : 'text-red-600'}>
                {formatCurrency(safeGet(report, 'compte_de_resultat.resultat_financier'))}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Résultat Exceptionnel</span>
              <span className={safeGet(report, 'compte_de_resultat.resultat_exceptionnel') >= 0 ? 'text-green-600' : 'text-red-600'}>
                {formatCurrency(safeGet(report, 'compte_de_resultat.resultat_exceptionnel'))}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Résultat Avant Impôt</span>
              <span className={safeGet(report, 'compte_de_resultat.resultat_avant_impot') >= 0 ? 'text-green-600' : 'text-red-600'}>
                {formatCurrency(safeGet(report, 'compte_de_resultat.resultat_avant_impot'))}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Impôt sur les bénéfices</span>
              <span>{formatCurrency(safeGet(report, 'compte_de_resultat.impot_sur_benefices'))}</span>
            </div>
            <div className="flex justify-between items-center border-t pt-3">
              <span className="font-bold text-lg">RÉSULTAT NET</span>
              <span className={`font-bold text-lg ${safeGet(report, 'compte_de_resultat.resultat_net') >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(safeGet(report, 'compte_de_resultat.resultat_net'))}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Ratios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <PieChart className="h-5 w-5" />
            <span>Ratios Financiers</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {formatPercentage(safeGet(report, 'ratios_financiers.marge_brute_percent'))}
              </div>
              <div className="text-sm text-gray-600">Marge Brute</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {formatPercentage(safeGet(report, 'ratios_financiers.marge_nette_percent'))}
              </div>
              <div className="text-sm text-gray-600">Marge Nette</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {formatPercentage(safeGet(report, 'ratios_financiers.rentabilite_actif_percent'))}
              </div>
              <div className="text-sm text-gray-600">Rentabilité de l'Actif</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {safeGet(report, 'ratios_financiers.liquidite_generale').toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Liquidité Générale</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {formatPercentage(safeGet(report, 'ratios_financiers.autonomie_financiere_percent'))}
              </div>
              <div className="text-sm text-gray-600">Autonomie Financière</div>
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
              <span>Points Forts</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {(safeGet(report, 'analyse_financiere.points_forts', []) as string[]).map((point, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{point}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>Points Faibles</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {(safeGet(report, 'analyse_financiere.points_faibles', []) as string[]).map((point, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{point}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-blue-600">
              <TrendingUp className="h-5 w-5" />
              <span>Recommandations</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {(safeGet(report, 'analyse_financiere.recommandations', []) as string[]).map((rec, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <TrendingUp className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BilanReport;