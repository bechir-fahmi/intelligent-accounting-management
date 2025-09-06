/**
 * Bilan Configuration Component
 *
 * @author Bachir Fahmi <bachirfahmi5@gmail.com>
 * @repository https://github.com/bechir-fahmi
 * @description Configuration interface for bilan generation parameters
 *              including period selection and document type filtering
 * @created 2025
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { BilanConfig } from "@/types/bilan.types";
import { Settings, Clock, AlertTriangle } from "lucide-react";

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
  financialDocumentsCount,
}) => {
  const periodOptions = [
    {
      value: 365,
      label: "365 jours (1 an)",
      description: "Analyse annuelle - Recommandé",
    },
  ];

  const documentTypes = [
    { value: "invoice", label: "Factures", financial: true },
    { value: "receipt", label: "Reçus", financial: true },
    { value: "purchase_order", label: "Bons de commande", financial: true },
    { value: "bank_statement", label: "Relevés bancaires", financial: true },
    { value: "expense_report", label: "Notes de frais", financial: true },
    { value: "payslip", label: "Fiches de paie", financial: true },
    { value: "quote", label: "Devis", financial: false },
    { value: "delivery_note", label: "Bons de livraison", financial: false },
    { value: "other", label: "Autres", financial: false },
  ];

  const handlePeriodChange = (days: string) => {
    const periodDays = parseInt(days);
    onConfigChange({
      ...config,
      periodDays,
    });
  };

  const handleIncludeTypeToggle = (type: string) => {
    const newIncludeTypes = config.includeTypes.includes(type)
      ? config.includeTypes.filter((t) => t !== type)
      : [...config.includeTypes, type];

    onConfigChange({
      ...config,
      includeTypes: newIncludeTypes,
    });
  };

  const getValidationMessages = () => {
    const messages = [];

    if (selectedDocumentsCount === 0) {
      messages.push({
        type: "error",
        message: "Aucun document sélectionné",
      });
    } else if (financialDocumentsCount === 0) {
      messages.push({
        type: "error",
        message: "Aucun document financier sélectionné",
      });
    } else {
      messages.push({
        type: "success",
        message: `${financialDocumentsCount} document(s) financier(s) prêt(s) pour l'analyse`,
      });
    }

    if (config.periodDays !== 365) {
      messages.push({
        type: "warning",
        message: "Seule la période de 365 jours est supportée",
      });
    }

    return messages;
  };

  const validationMessages = getValidationMessages();

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
            ℹ️ Seule l'analyse annuelle (365 jours) est actuellement supportée
            par l'API.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {periodOptions.map((option) => (
              <Button
                key={option.value}
                variant={
                  config.periodDays === option.value ? "default" : "outline"
                }
                className="h-auto p-3 text-left justify-start"
                onClick={() => handlePeriodChange(option.value.toString())}
              >
                <div>
                  <div className="font-medium">{option.label}</div>
                  <div className="text-xs text-gray-500">
                    {option.description}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Document Type Filters */}
        <div className="space-y-3">
          <Label className="text-base font-medium">
            Types de documents à inclure
          </Label>
          <p className="text-sm text-gray-600">
            Sélectionnez les types de documents à analyser dans le bilan
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {documentTypes.map((type) => (
              <div
                key={type.value}
                className={`flex items-center space-x-2 p-2 rounded border cursor-pointer transition-colors ${
                  config.includeTypes.includes(type.value)
                    ? "bg-blue-50 border-blue-200"
                    : "hover:bg-gray-50"
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
                {config.periodDays} jours (1 an)
              </div>
            </div>

            <div>
              <span className="text-gray-600">Documents sélectionnés:</span>
              <div className="font-medium">
                {selectedDocumentsCount} document(s)
              </div>
            </div>

            <div>
              <span className="text-gray-600">Documents financiers:</span>
              <div className="font-medium">
                {financialDocumentsCount} document(s)
              </div>
            </div>

            <div>
              <span className="text-gray-600">Types inclus:</span>
              <div className="font-medium">
                {config.includeTypes.length} type(s)
              </div>
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
                  msg.type === "error"
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : msg.type === "warning"
                    ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                    : "bg-green-50 text-green-700 border border-green-200"
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
