import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import UserAvatar from '@/components/UserAvatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Users, Upload } from 'lucide-react';
import DashboardCard from '@/components/DashboardCard';
import FinancialChart from '@/components/FinancialChart';
import { documentsService } from '@/services/documents.service';
import { usersService } from '@/services/users.service';

const Dashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [documentCount, setDocumentCount] = useState(0);
  const [userCount, setUserCount] = useState(0);
  const [importCount, setImportCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch documents
        const documents = await documentsService.getAllDocuments();
        setDocumentCount(documents.length);

        // Fetch users
        const users = await usersService.getAllUsers();
        setUserCount(users.length);

        // Import count is the same as document count since each document is an import
        setImportCount(documents.length);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Données mock pour les graphiques
  const revenueData = [
    { name: 'Jan', value: 4000 },
    { name: 'Fév', value: 3000 },
    { name: 'Mar', value: 5000 },
    { name: 'Avr', value: 2780 },
    { name: 'Mai', value: 1890 },
    { name: 'Juin', value: 2390 },
    { name: 'Juil', value: 3490 },
    { name: 'Aoû', value: 4000 },
    { name: 'Sep', value: 2500 },
    { name: 'Oct', value: 1500 },
    { name: 'Nov', value: 2000 },
    { name: 'Déc', value: 2800 },
  ];

  const expensesData = [
    { name: 'Jan', value: 2400 },
    { name: 'Fév', value: 1398 },
    { name: 'Mar', value: 3800 },
    { name: 'Avr', value: 3908 },
    { name: 'Mai', value: 4800 },
    { name: 'Juin', value: 3800 },
    { name: 'Juil', value: 4300 },
    { name: 'Aoû', value: 2500 },
    { name: 'Sep', value: 1500 },
    { name: 'Oct', value: 1200 },
    { name: 'Nov', value: 3000 },
    { name: 'Déc', value: 1700 },
  ];

  const cashflowData = revenueData.map((item, index) => ({
    name: item.name,
    value: item.value - expensesData[index].value
  }));

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <div className="pt-16 flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <div className="flex items-center space-x-4">
              <UserAvatar size="lg" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {t('dashboard.welcome')}, {user?.name}
                </h1>
                <p className="text-gray-500">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('navigation.documents')}
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? '...' : documentCount}</div>
                <p className="text-xs text-muted-foreground">
                  {t('dashboard.documentsProcessed')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('navigation.users')}
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? '...' : userCount}</div>
                <p className="text-xs text-muted-foreground">
                  {t('dashboard.activeUsers')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('dashboard.totalImports')}
                </CardTitle>
                <Upload className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? '...' : importCount}</div>
                <p className="text-xs text-muted-foreground">
                  {t('dashboard.importedDocuments')}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Cards Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <DashboardCard 
              title={t('dashboard.revenueTitle')} 
              value="48 590,00 €"
              description={t('dashboard.totalAnnual')} 
              trend="up"
              trendValue={`+5.2% ${t('dashboard.vsLastMonth')}`}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            
            <DashboardCard 
              title={t('dashboard.expensesTitle')} 
              value="32 410,00 €"
              description={t('dashboard.totalAnnual')}
              trend="down"
              trendValue={`-2.1% ${t('dashboard.vsLastMonth')}`}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              }
            />
            
            <DashboardCard 
              title={t('dashboard.netProfit')} 
              value="16 180,00 €"
              description={t('dashboard.totalAnnual')}
              trend="up"
              trendValue={`+8.3% ${t('dashboard.vsLastMonth')}`}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
            />
            
            <DashboardCard 
              title={t('dashboard.documentsProcessed')} 
              value="324"
              description={t('dashboard.last30Days')}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
            />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <FinancialChart title={t('dashboard.revenues')} data={revenueData} color="#3B82F6" />
            <FinancialChart title={t('dashboard.expensesTitle')} data={expensesData} color="#EF4444" />
          </div>
          
          <div className="mb-8">
            <FinancialChart title={t('dashboard.cashFlow')} data={cashflowData} color="#10B981" />
          </div>

          {/* Bilan Generation Feature - Demo removed, use /bilan route directly */}

          {/* Recent Activity */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">{t('dashboard.recentActivity')}</h2>
            <div className="flow-root">
              <ul className="-my-5 divide-y divide-gray-200">
                <li className="py-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{t('dashboard.invoiceProcessed')}</p>
                      <p className="text-sm text-gray-500">{t('dashboard.electricityEDF')}</p>
                    </div>
                    <div className="text-sm text-gray-500">
                      {t('dashboard.today')}
                    </div>
                  </div>
                </li>
                <li className="py-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                        <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{t('dashboard.clientPaymentReceived')}</p>
                      <p className="text-sm text-gray-500">{t('dashboard.techSolutions')}</p>
                    </div>
                    <div className="text-sm text-gray-500">
                      {t('dashboard.yesterday')}
                    </div>
                  </div>
                </li>
                <li className="py-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                        <svg className="h-5 w-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{t('dashboard.vatDeadline')}</p>
                      <p className="text-sm text-gray-500">{t('dashboard.vatDeclaration')}</p>
                    </div>
                    <div className="text-sm text-gray-500">
                      {t('dashboard.twoDaysAgo')}
                    </div>
                  </div>
                </li>
              </ul>
            </div>
            <div className="mt-6">
              <a href="#" className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                {t('dashboard.viewAllActivities')}
              </a>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Dashboard;
