import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, User, Users, Lock, FileText, BarChart3, Calculator } from 'lucide-react';
import UserAvatar from '@/components/UserAvatar';

const Navbar = () => {
  const location = useLocation();
  const { user, logout, isAuthenticated, isAdmin, isComptable } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  
  if (!isAuthenticated) return null;
  
  return (
    <nav className="bg-white border-b border-gray-200 fixed w-full z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/dashboard" className="text-blue-600 font-bold text-xl">CompteAI</Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link 
                to="/dashboard" 
                className={`${location.pathname === '/dashboard' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-blue-600 hover:border-blue-600'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                Tableau de bord
              </Link>
              <Link 
                to="/documents" 
                className={`${location.pathname === '/documents' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-blue-600 hover:border-blue-600'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                Documents
              </Link>
              <Link 
                to="/upload" 
                className={`${location.pathname === '/upload' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-blue-600 hover:border-blue-600'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                Importer
              </Link>
              <Link 
                to="/reporting" 
                className={`${location.pathname === '/reporting' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-blue-600 hover:border-blue-600'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                <BarChart3 className="h-4 w-4 mr-1" />
                Rapports
              </Link>
              <Link 
                to="/bilan" 
                className={`${location.pathname === '/bilan' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-blue-600 hover:border-blue-600'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                <Calculator className="h-4 w-4 mr-1" />
                Bilan
              </Link>
              
              {/* Menu uniquement visible pour les administrateurs */}
              {isAdmin && (
                <Link 
                  to="/admin/users" 
                  className={`${location.pathname === '/admin/users' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-blue-600 hover:border-blue-600'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  <Users className="h-4 w-4 mr-1" />
                  Gestion Utilisateurs
                </Link>
              )}
              
              {/* Menu uniquement visible pour les comptables et admins */}
              {(isComptable || isAdmin) && (
                <Link 
                  to="/comptable/clients" 
                  className={`${location.pathname === '/comptable/clients' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-blue-600 hover:border-blue-600'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  <FileText className="h-4 w-4 mr-1" />
                  Clients
                </Link>
              )}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <UserAvatar size="sm" />
                <div className="text-sm text-gray-600">
                  {user?.email}
                  <span className={`ml-1 px-2 py-1 text-xs rounded-full ${
                    user?.type === 'admin' ? 'bg-purple-100 text-purple-800' :
                    user?.type === 'comptable' ? 'bg-green-100 text-green-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {user?.type}
                  </span>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center" 
                disabled={isLoggingOut}
                onClick={async () => {
                  if (isLoggingOut) return;
                  
                  try {
                    setIsLoggingOut(true);
                    await logout();
                  } catch (error) {
                    console.error('Logout failed:', error);
                    setIsLoggingOut(false);
                  }
                }}
              >
                <LogOut className="h-4 w-4 mr-1" />
                {isLoggingOut ? 'Déconnexion...' : 'Se déconnecter'}
              </Button>
            </div>
          </div>
          <div className="flex items-center sm:hidden">
            <button type="button" className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500" aria-expanded="false">
              <span className="sr-only">Ouvrir le menu</span>
              <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
