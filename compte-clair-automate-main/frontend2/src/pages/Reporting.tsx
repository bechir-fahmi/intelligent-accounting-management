import React from 'react';
import { useTranslation } from 'react-i18next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, FileText, TrendingUp, Calendar } from 'lucide-react';

const Reporting = () => {
  const { t } = useTranslation();
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <div className="pt-16 flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <BarChart3 className="h-6 w-6 mr-2" />
              {t('pages.reporting.title')}
            </h1>
            <p className="text-gray-500 mt-1">{t('pages.reporting.description')}</p>
          </div>

          {/* Coming Soon Card */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-8 mb-8 text-center">
            <div className="max-w-md mx-auto">
              <BarChart3 className="h-16 w-16 text-blue-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {t('pages.reporting.comingSoon')}
              </h2>
              <p className="text-gray-600 mb-4">
                {t('pages.reporting.inDevelopment')}
              </p>
              <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                <Calendar className="h-4 w-4 mr-2" />
                {t('pages.reporting.availableSoon')}
              </div>
            </div>
          </div>

          {/* Preview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card className="opacity-60">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('pages.reporting.financialReports')}
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-400">---</div>
                <p className="text-xs text-muted-foreground">
                  {t('pages.reporting.financialReportsDesc')}
                </p>
              </CardContent>
            </Card>

            <Card className="opacity-60">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('pages.reporting.vatAnalysis')}
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-400">---</div>
                <p className="text-xs text-muted-foreground">
                  {t('pages.reporting.vatAnalysisDesc')}
                </p>
              </CardContent>
            </Card>

            <Card className="opacity-60">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('pages.reporting.dashboards')}
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-400">---</div>
                <p className="text-xs text-muted-foreground">
                  {t('pages.reporting.dashboardsDesc')}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Features Preview */}
          <Card>
            <CardHeader>
              <CardTitle>{t('pages.reporting.upcomingFeatures')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">{t('pages.reporting.automatedReports')}</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                      {t('pages.reporting.automaticBilans')}
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                      {t('pages.reporting.detailedProfitLoss')}
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                      {t('pages.reporting.cashFlowAnalysis')}
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                      {t('pages.reporting.customReports')}
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">{t('pages.reporting.advancedAnalysis')}</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      {t('pages.reporting.financialForecasts')}
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      {t('pages.reporting.trendAnalysis')}
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      {t('pages.reporting.periodicComparisons')}
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      {t('pages.reporting.smartAlerts')}
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Reporting;