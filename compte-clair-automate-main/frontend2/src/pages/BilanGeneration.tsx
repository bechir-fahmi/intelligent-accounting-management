import React, { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DocumentSelector from "@/components/bilan/DocumentSelector";
import BilanConfiguration from "@/components/bilan/BilanConfiguration";
import BilanReport from "@/components/bilan/BilanReport";
import TransactionDetails from "@/components/bilan/TransactionDetails";
import {
  BilanConfig,
  BilanReport as BilanReportType,
  Document,
} from "@/types/bilan.types";
import { bilanService } from "@/services/bilan.service";
import { documentsService } from "@/services/documents.service";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "react-hot-toast";
import {
  Calculator,
  FileText,
  Settings,
  Play,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  RotateCcw,
} from "lucide-react";

const BilanGeneration: React.FC = () => {
  useAuth();

  // State management
  const [currentStep, setCurrentStep] = useState<
    "selection" | "configuration" | "generation" | "results"
  >("selection");
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [config, setConfig] = useState<BilanConfig>({
    periodDays: 90,
    includeTypes: [
      "invoice",
      "receipt",
      "purchase_order",
      "bank_statement",
      "expense_report",
      "payslip",
    ],
  });

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [bilanReport, setBilanReport] = useState<BilanReportType | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Computed values
  const selectedDocs = documents.filter((doc) =>
    selectedDocuments.includes(doc.id)
  );
  const financialTypes = [
    "invoice",
    "receipt",
    "purchase_order",
    "bank_statement",
    "expense_report",
    "payslip",
  ];
  const financialDocumentsCount = selectedDocs.filter((doc) =>
    financialTypes.includes(doc.type?.toLowerCase())
  ).length;

  const handleDocumentsLoad = useCallback((loadedDocuments: Document[]) => {
    setDocuments(loadedDocuments);
  }, []);

  const handleSelectionChange = useCallback((documentIds: string[]) => {
    setSelectedDocuments(documentIds);
    setError(null);
  }, []);

  const handleConfigChange = useCallback((newConfig: BilanConfig) => {
    setConfig(newConfig);
    setError(null);
  }, []);

  const validateAndProceed = (targetStep: string) => {
    setError(null);

    if (targetStep === "configuration") {
      // Validate document selection
      const validation = bilanService.validateDocumentSelection(
        selectedDocuments,
        documents
      );
      if (!validation.isValid) {
        setError(validation.errors.join(" "));
        return;
      }
      setCurrentStep("configuration");
    } else if (targetStep === "generation") {
      // Validate configuration
      const configValidation = bilanService.validateBilanConfig(config);
      if (!configValidation.isValid) {
        setError(configValidation.errors.join(" "));
        return;
      }
      setCurrentStep("generation");
    }
  };

  const generateBilan = async () => {
    try {
      setIsGenerating(true);
      setGenerationProgress(0);
      setError(null);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setGenerationProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 15;
        });
      }, 500);

      // Generate bilan
      console.log("Calling generateBilan with:", {
        selectedDocuments,
        periodDays: config.periodDays,
      });
      const report = await documentsService.generateBilan(
        selectedDocuments,
        config.periodDays
      );
      console.log("Received bilan report:", report);

      // Check if the response is an error
      if (report && report.error) {
        throw new Error(report.details || report.error);
      }

      clearInterval(progressInterval);
      setGenerationProgress(100);

      setBilanReport(report);
      setCurrentStep("results");

      toast.success("Bilan généré avec succès !");
    } catch (error: any) {
      console.error("Error generating bilan:", error);
      setError(error.message || "Erreur lors de la génération du bilan");
      toast.error("Erreur lors de la génération du bilan");
    } finally {
      setIsGenerating(false);
    }
  };

  const resetGeneration = () => {
    setCurrentStep("selection");
    setSelectedDocuments([]);
    setConfig({
      periodDays: 90,
      includeTypes: [
        "invoice",
        "receipt",
        "purchase_order",
        "bank_statement",
        "expense_report",
        "payslip",
      ],
    });
    setBilanReport(null);
    setError(null);
    setGenerationProgress(0);
  };

  const handleExportPDF = () => {
    toast.error("Export PDF non encore implémenté");
  };

  const handleExportExcel = () => {
    toast.error("Export Excel non encore implémenté");
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    toast.error("Partage non encore implémenté");
  };

  const handleDocumentClick = (documentId: string) => {
    // Navigate to document details (implement based on your routing)
    toast(`Navigation vers le document ${documentId}`);
  };

  const getStepIcon = (step: string) => {
    switch (step) {
      case "selection":
        return FileText;
      case "configuration":
        return Settings;
      case "generation":
        return Play;
      case "results":
        return Calculator;
      default:
        return FileText;
    }
  };

  const getStepStatus = (step: string) => {
    const steps = ["selection", "configuration", "generation", "results"];
    const currentIndex = steps.indexOf(currentStep);
    const stepIndex = steps.indexOf(step);

    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "current";
    return "pending";
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Génération de Bilan
            </h1>
            <p className="text-gray-600">
              Générez un bilan comptable complet à partir de vos documents
              financiers
            </p>
          </div>

          {/* Progress Steps */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                {[
                  { key: "selection", label: "Sélection des documents" },
                  { key: "configuration", label: "Configuration" },
                  { key: "generation", label: "Génération" },
                  { key: "results", label: "Résultats" },
                ].map((step, index) => {
                  const Icon = getStepIcon(step.key);
                  const status = getStepStatus(step.key);

                  return (
                    <div key={step.key} className="flex items-center">
                      <div className="flex flex-col items-center space-y-2">
                        <div
                          className={`
                          w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors
                          ${
                            status === "completed"
                              ? "bg-green-500 border-green-500 text-white"
                              : status === "current"
                              ? "bg-blue-500 border-blue-500 text-white"
                              : "bg-gray-100 border-gray-300 text-gray-400"
                          }
                        `}
                        >
                          {status === "completed" ? (
                            <CheckCircle2 className="h-6 w-6" />
                          ) : (
                            <Icon className="h-6 w-6" />
                          )}
                        </div>
                        <div className="text-center">
                          <div
                            className={`text-sm font-medium ${
                              status === "current"
                                ? "text-blue-600"
                                : status === "completed"
                                ? "text-green-600"
                                : "text-gray-500"
                            }`}
                          >
                            {step.label}
                          </div>
                        </div>
                      </div>

                      {index < 3 && (
                        <ArrowRight
                          className={`h-5 w-5 ${
                            getStepStatus(
                              [
                                "selection",
                                "configuration",
                                "generation",
                                "results",
                              ][index + 1]
                            ) !== "pending"
                              ? "text-green-500"
                              : "text-gray-300"
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Error Display */}
          {error && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Step Content */}
          {currentStep === "selection" && (
            <div className="space-y-6">
              <DocumentSelector
                selectedDocuments={selectedDocuments}
                onSelectionChange={handleSelectionChange}
                onDocumentsLoad={handleDocumentsLoad}
              />

              <div className="flex justify-end">
                <Button
                  onClick={() => validateAndProceed("configuration")}
                  disabled={
                    selectedDocuments.length === 0 ||
                    financialDocumentsCount === 0
                  }
                  size="lg"
                >
                  Continuer vers la configuration
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {currentStep === "configuration" && (
            <div className="space-y-6">
              <BilanConfiguration
                config={config}
                onConfigChange={handleConfigChange}
                selectedDocumentsCount={selectedDocuments.length}
                financialDocumentsCount={financialDocumentsCount}
              />

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep("selection")}
                >
                  Retour à la sélection
                </Button>
                <Button
                  onClick={() => validateAndProceed("generation")}
                  size="lg"
                >
                  Continuer vers la génération
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {currentStep === "generation" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calculator className="h-6 w-6" />
                  <span>Génération du Bilan</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Generation Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {selectedDocuments.length}
                    </div>
                    <div className="text-sm text-gray-600">
                      Documents sélectionnés
                    </div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {financialDocumentsCount}
                    </div>
                    <div className="text-sm text-gray-600">
                      Documents financiers
                    </div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {config.periodDays}
                    </div>
                    <div className="text-sm text-gray-600">Jours d'analyse</div>
                  </div>
                </div>

                {/* Generation Progress */}
                {isGenerating && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                      <span className="text-sm text-gray-600">
                        Génération en cours...
                      </span>
                    </div>
                    <Progress value={generationProgress} className="w-full" />
                    <div className="text-center text-sm text-gray-500">
                      {Math.round(generationProgress)}% terminé
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep("configuration")}
                    disabled={isGenerating}
                  >
                    Retour à la configuration
                  </Button>
                  <Button
                    onClick={generateBilan}
                    disabled={isGenerating}
                    size="lg"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Génération en cours...
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Générer le bilan
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === "results" && bilanReport && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <Badge variant="default" className="text-lg px-4 py-2">
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  Bilan généré avec succès
                </Badge>
                <Button variant="outline" onClick={resetGeneration}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Nouveau bilan
                </Button>
              </div>

              <BilanReport
                report={bilanReport}
                onExportPDF={handleExportPDF}
                onExportExcel={handleExportExcel}
                onPrint={handlePrint}
                onShare={handleShare}
              />

              <TransactionDetails
                transactions={bilanReport.details_transactions}
                onDocumentClick={handleDocumentClick}
              />
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BilanGeneration;
