/**
 * Bilan Configuration Component
 * 
 * @author Bachir Fahmi <bachirfahmi5@gmail.com>
 * @repository https://github.com/bechir-fahmi
 * @description Configuration interface for bilan generation parameters
 *              including period selection and document type filtering
 * @created 2025
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { BilanConfig } from '@/types/bilan.types';
import { Settings, Calendar as CalendarIcon, Clock, AlertTriangle } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';

interface BilanConfigurationProps {
  config: BilanConfig;
  onConfigChange: (config: BilanConfig) => void;
  selectedDocumentsCount: number;
  financialDocumentsCount: number;
}

const BilanConfiguration: React.FC<BilanConfigurationProps> = ({
  config,
  onConfigChange,
  selectedDocumentsCount,
  financialDocumentsCount
}) => {
  const [useCustomDateRange, setUseCustomDateRange] = useState(false);
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  const periodOptions = [
    { value: 90, label: '90 jours (3 mois)', description: 'Analyse trimestrielle - Recommandé' },
    { value: 365, label: '365 jours (1 an)', description: 'Analyse annuelle' }
  ];

  const documentTypes = [
    { value: 'invoice', label: 'Factures', financial: true },
    { value: 'receipt', label: 'Reçus', financial: true },
    { value: 'purchase_order', label: 'Bons de commande', financial: true },
    { value: 'bank_statement', label: 'Relevés bancaires', financial: true },
    { value: 'expense_report', label: 'Notes de frais', financial: true },
    { value: 'payslip', label: 'Fiches de paie', financial: true },
    { value: 'quote', label: 'Devis', financial: false },
    { value: 'delivery_note', label: 'Bons de livraison', financial: false },
    { value: 'other', label: 'Autres', financial: false }
  ];

  const handlePeriodChange = (days: string) => {
    const periodDays = parseInt(days);
    onConfigChange({
      ...config,
      periodDays,
      customDateRange: undefined // Clear custom range when using preset
    });
    setUseCustomDateRange(false);
  };

  const handleCustomDateRange = () => {
    if (dateFrom && dateTo) {
      const customDateRange = {
        from: format(dateFrom, 'yyyy-MM-dd'),
        to: format(dateTo, 'yyyy-MM-dd')
      };
      
      // Calculate period days from date range
      const diffTime = Math.abs(dateTo.getTime() - dateFrom.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      onConfigChange({
        ...config,
        periodDays: diffDays,
        customDateRange
      });
    }
  };

  const handleIncludeTypeToggle = (type: string) => {
    const newIncludeTypes = config.includeTypes.includes(type)
      ? config.includeTypes.filter(t => t !== type)
      : [...config.includeTypes, type];
    
    onConfigChange({
      ...config,
      includeTypes: newIncludeTypes
    });
  };

  const getValidationMessages = () => {
    const messages = [];
    
    if (selectedDocumentsCount === 0) {
      messages.push({
        type: 'error',
        message: 'Aucun document sélectionné'
      });
    } else if (financialDocumentsCount === 0) {
      messages.push({
        type: 'error',
        message: 'Aucun document financier sélectionné'
      });
    } else {
      messages.push({
        type: 'success',
        message: `${financialDocumentsCount} document(s) financier(s) prêt(s) pour l'analyse`
      });
    }
    
    if (config.periodDays > 365) {
      messages.push({
        type: 'warning',
        message: 'Période très longue - peut affecter les performances'
      });
    }
    
    if (config.customDateRange) {
      const { from, to } = config.customDateRange;
      const fromDate = new Date(from);
      const toDate = new Date(to);
      const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 730) {
        messages.push({
          type: 'error',
          message: 'La plage de dates ne peut pas dépasser 2 ans'
        });
      }
    }
    
    return messages;
  };

  const validationMessages = getValidationMessages();
  const hasErrors = validationMessages.some(msg => msg.type === 'error');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Settings className="h-5 w-5" />
          <span>Configuration du bilan</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Period Selection */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Période d'analyse</Label>
          <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded-md">
            ℹ️ Seules les analyses trimestrielles (90 jours) et annuelles (365 jours) sont actuellement supportées par l'API.
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {periodOptions.map((option) => (
              <Button
                key={option.value}
                variant={config.periodDays === option.value && !useCustomDateRange ? "default" : "outline"}
                className="h-auto p-3 text-left justify-start"
                onClick={() => handlePeriodChange(option.value.toString())}
              >
                <div>
                  <div className="font-medium">{option.label}</div>
                  <div className="text-xs text-gray-500">{option.description}</div>
                </div>
              </Button>
            ))}
          </div>

          {/* Custom Date Range */}
          <div className="border-t pt-4">
            <div className="flex items-center space-x-2 mb-3">
              <input
                type="checkbox"
                id="customRange"
                checked={useCustomDateRange}
                onChange={(e) => setUseCustomDateRange(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="customRange">Période personnalisée</Label>
            </div>

            {useCustomDateRange && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date de début</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateFrom ? format(dateFrom, 'dd/MM/yyyy', { locale: fr }) : 'Sélectionner'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dateFrom}
                        onSelect={setDateFrom}
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
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateTo ? format(dateTo, 'dd/MM/yyyy', { locale: fr }) : 'Sélectionner'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dateTo}
                        onSelect={setDateTo}
                        initialFocus
                        locale={fr}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {dateFrom && dateTo && (
                  <div className="md:col-span-2">
                    <Button onClick={handleCustomDateRange} className="w-full">
                      Appliquer la période personnalisée
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Document Type Filters */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Types de documents à inclure</Label>
          <p className="text-sm text-gray-600">
            Sélectionnez les types de documents à analyser dans le bilan
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {documentTypes.map((type) => (
              <div
                key={type.value}
                className={`flex items-center space-x-2 p-2 rounded border cursor-pointer transition-colors ${
                  config.includeTypes.includes(type.value)
                    ? 'bg-blue-50 border-blue-200'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => handleIncludeTypeToggle(type.value)}
              >
                <input
                  type="checkbox"
                  checked={config.includeTypes.includes(type.value)}
                  onChange={() => handleIncludeTypeToggle(type.value)}
                  className="rounded"
                />
                <span className="text-sm">{type.label}</span>
                {type.financial && <span className="text-xs">💰</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Configuration Summary */}
        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
          <h4 className="font-medium flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>Résumé de la configuration</span>
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Période:</span>
              <div className="font-medium">
                {config.customDateRange ? (
                  `Du ${format(new Date(config.customDateRange.from), 'dd/MM/yyyy', { locale: fr })} au ${format(new Date(config.customDateRange.to), 'dd/MM/yyyy', { locale: fr })}`
                ) : (
                  `${config.periodDays} jours`
                )}
              </div>
            </div>
            
            <div>
              <span className="text-gray-600">Documents sélectionnés:</span>
              <div className="font-medium">{selectedDocumentsCount} document(s)</div>
            </div>
            
            <div>
              <span className="text-gray-600">Documents financiers:</span>
              <div className="font-medium">{financialDocumentsCount} document(s)</div>
            </div>
            
            <div>
              <span className="text-gray-600">Types inclus:</span>
              <div className="font-medium">{config.includeTypes.length} type(s)</div>
            </div>
          </div>
        </div>

        {/* Validation Messages */}
        {validationMessages.length > 0 && (
          <div className="space-y-2">
            {validationMessages.map((msg, index) => (
              <div
                key={index}
                className={`flex items-center space-x-2 p-3 rounded-md ${
                  msg.type === 'error'
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : msg.type === 'warning'
                    ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                    : 'bg-green-50 text-green-700 border border-green-200'
                }`}
              >
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm">{msg.message}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BilanConfiguration;