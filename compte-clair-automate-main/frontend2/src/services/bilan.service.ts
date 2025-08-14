import api from '@/lib/axios';
import { BilanGenerationRequest, BilanReport } from '@/types/bilan.types';

class BilanService {
  /**
   * Generate a bilan report from selected documents
   */
  async generateBilan(request: BilanGenerationRequest): Promise<BilanReport> {
    try {
      const response = await api.post('/documents/generate-bilan', request);
      return response.data;
    } catch (error: any) {
      // Handle specific error cases
      if (error.response?.status === 400) {
        throw new Error('Veuillez sélectionner des documents valides pour générer le bilan.');
      }
      if (error.response?.status === 403) {
        throw new Error('Vous n\'avez pas accès à certains documents sélectionnés.');
      }
      if (error.response?.status === 500) {
        throw new Error('Erreur du service de génération de bilan. Veuillez réessayer plus tard.');
      }
      if (error.message?.includes('Network Error')) {
        throw new Error('Erreur de connexion au service de bilan. Vérifiez votre connexion.');
      }
      
      // Generic error handling
      throw new Error(error.response?.data?.message || 'Une erreur inattendue s\'est produite lors de la génération du bilan.');
    }
  }

  /**
   * Validate document selection for bilan generation
   */
  validateDocumentSelection(documentIds: string[], documents: any[]): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    // Check minimum documents
    if (documentIds.length === 0) {
      errors.push('Veuillez sélectionner au moins un document.');
    }
    
    // Check maximum documents (performance limit)
    if (documentIds.length > 100) {
      errors.push('Vous ne pouvez pas sélectionner plus de 100 documents à la fois.');
    }
    
    // Check for financial documents
    const selectedDocs = documents.filter(doc => documentIds.includes(doc.id));
    const financialTypes = ['invoice', 'receipt', 'purchase_order', 'bank_statement'];
    const hasFinancialDocs = selectedDocs.some(doc => 
      financialTypes.includes(doc.type?.toLowerCase())
    );
    
    if (!hasFinancialDocs) {
      errors.push('Veuillez sélectionner au moins un document financier (facture, reçu, bon de commande, ou relevé bancaire).');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate bilan configuration
   */
  validateBilanConfig(config: any): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    // Validate period days
    if (!config.periodDays || config.periodDays < 1 || config.periodDays > 365) {
      errors.push('La période doit être comprise entre 1 et 365 jours.');
    }
    
    // Validate custom date range if provided
    if (config.customDateRange) {
      const { from, to } = config.customDateRange;
      if (from && to) {
        const fromDate = new Date(from);
        const toDate = new Date(to);
        const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > 730) { // 2 years
          errors.push('La plage de dates ne peut pas dépasser 2 ans.');
        }
        
        if (fromDate > toDate) {
          errors.push('La date de début doit être antérieure à la date de fin.');
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Format currency for display
   */
  formatCurrency(amount: number, currency: string = 'TND'): string {
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Format percentage for display
   */
  formatPercentage(value: number): string {
    return new Intl.NumberFormat('fr-TN', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value / 100);
  }

  /**
   * Export bilan report to PDF (placeholder for future implementation)
   */
  async exportToPDF(bilanReport: BilanReport): Promise<Blob> {
    // This would integrate with a PDF generation service
    throw new Error('Export PDF non encore implémenté');
  }

  /**
   * Export bilan report to Excel (placeholder for future implementation)
   */
  async exportToExcel(bilanReport: BilanReport): Promise<Blob> {
    // This would integrate with an Excel generation service
    throw new Error('Export Excel non encore implémenté');
  }
}

export const bilanService = new BilanService();