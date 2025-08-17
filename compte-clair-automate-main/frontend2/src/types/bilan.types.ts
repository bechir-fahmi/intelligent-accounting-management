/**
 * Bilan Generation TypeScript Type Definitions
 * 
 * @author Bachir Fahmi <bachirfahmi5@gmail.com>
 * @repository https://github.com/bechir-fahmi
 * @description Complete type definitions for bilan generation feature
 *              including balance sheet, income statement, and analysis types
 * @created 2025
 */

// Bilan Generation Types
export interface BilanConfig {
  periodDays: number;
  includeTypes: string[];
  customDateRange?: {
    from: string;
    to: string;
  };
}

export interface BilanGenerationRequest {
  documentIds: string[];
  periodDays: number;
}

export interface ActifNonCourant {
  immobilisations_corporelles: number;
  immobilisations_incorporelles: number;
  immobilisations_financieres: number;
  total_actif_non_courant: number;
}

export interface ActifCourant {
  stocks_et_en_cours: number;
  clients_et_comptes_rattaches: number;
  autres_creances: number;
  disponibilites: number;
  total_actif_courant: number;
}

export interface Actif {
  actif_non_courant: ActifNonCourant;
  actif_courant: ActifCourant;
  total_actif: number;
}

export interface CapitauxPropres {
  capital_social: number;
  reserves: number;
  resultat_net_exercice: number;
  total_capitaux_propres: number;
}

export interface PassifNonCourant {
  emprunts_dettes_financieres_lt: number;
  provisions_lt: number;
  total_passif_non_courant: number;
}

export interface PassifCourant {
  fournisseurs_et_comptes_rattaches: number;
  dettes_fiscales_et_sociales: number;
  autres_dettes_ct: number;
  total_passif_courant: number;
}

export interface Passif {
  capitaux_propres: CapitauxPropres;
  passif_non_courant: PassifNonCourant;
  passif_courant: PassifCourant;
  total_passif: number;
}

export interface BilanComptable {
  actif: Actif;
  passif: Passif;
}

export interface ProduitsExploitation {
  chiffre_affaires: number;
  production_immobilisee: number;
  subventions_exploitation: number;
  autres_produits_exploitation: number;
  total_produits_exploitation: number;
}

export interface ChargesExploitation {
  achats_consommes: number;
  charges_personnel: number;
  dotations_amortissements: number;
  autres_charges_exploitation: number;
  total_charges_exploitation: number;
}

export interface CompteDeResultat {
  produits_exploitation: ProduitsExploitation;
  charges_exploitation: ChargesExploitation;
  resultat_exploitation: number;
  resultat_financier: number;
  resultat_exceptionnel: number;
  resultat_avant_impot: number;
  impot_sur_benefices: number;
  resultat_net: number;
}

export interface RatiosFinanciers {
  marge_brute_percent: number;
  marge_nette_percent: number;
  rentabilite_actif_percent: number;
  liquidite_generale: number;
  autonomie_financiere_percent: number;
}

export interface AnalyseFinanciere {
  points_forts: string[];
  points_faibles: string[];
  recommandations: string[];
}

export interface DetailTransaction {
  document_id: string;
  type: string;
  montant: number;
  compte_comptable: string;
  libelle: string;
}

export interface BilanMetadata {
  documents_processed: number;
  period_days: number;
  processing_time_ms: number;
  generated_at: string;
  standard: string;
}

export interface BilanReport {
  bilan_comptable: BilanComptable;
  compte_de_resultat: CompteDeResultat;
  ratios_financiers: RatiosFinanciers;
  analyse_financiere: AnalyseFinanciere;
  details_transactions: DetailTransaction[];
  metadata: BilanMetadata;
}

export interface BilanGenerationState {
  // Document selection
  documents: Document[];
  selectedDocuments: string[];
  filters: {
    documentType: string;
    dateFrom: string;
    dateTo: string;
    clientName: string;
    searchQuery: string;
  };
  
  // Configuration
  config: BilanConfig;
  
  // Generation process
  isGenerating: boolean;
  generationProgress: number;
  
  // Results
  bilanReport: BilanReport | null;
  error: string | null;
}

// Re-export Document type from documents service
export type { Document } from '@/services/documents.service';