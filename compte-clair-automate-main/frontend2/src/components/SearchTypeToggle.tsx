import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Brain, Zap } from 'lucide-react';

export type SearchType = 'text' | 'semantic' | 'hybrid';

interface SearchTypeToggleProps {
  searchType: SearchType;
  onSearchTypeChange: (type: SearchType) => void;
  availableTypes?: {
    semantic: boolean;
    hybrid: boolean;
  };
}

const SearchTypeToggle: React.FC<SearchTypeToggleProps> = ({ 
  searchType, 
  onSearchTypeChange,
  availableTypes = { semantic: true, hybrid: true }
}) => {
  const searchTypes = [
    {
      type: 'text' as SearchType,
      label: 'Recherche textuelle',
      icon: Search,
      description: 'Recherche par mots-clés exacts',
      color: 'bg-blue-100 text-blue-800'
    },
    {
      type: 'semantic' as SearchType,
      label: 'Recherche sémantique',
      icon: Brain,
      description: 'Recherche par sens et contexte (IA)',
      color: 'bg-purple-100 text-purple-800'
    },
    {
      type: 'hybrid' as SearchType,
      label: 'Recherche hybride',
      icon: Zap,
      description: 'Combine textuelle et sémantique',
      color: 'bg-green-100 text-green-800'
    }
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {searchTypes.map(({ type, label, icon: Icon, description, color }) => {
        const isAvailable = type === 'text' || 
          (type === 'semantic' && availableTypes.semantic) || 
          (type === 'hybrid' && availableTypes.hybrid);
        
        return (
          <Button
            key={type}
            variant={searchType === type ? 'default' : 'outline'}
            size="sm"
            onClick={() => onSearchTypeChange(type)}
            disabled={!isAvailable}
            className="flex items-center space-x-2"
            title={!isAvailable ? 'Cette fonctionnalité n\'est pas encore disponible' : ''}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
            {searchType === type && (
              <Badge className={`ml-2 ${color} text-xs`}>
                Actif
              </Badge>
            )}
            {!isAvailable && (
              <Badge className="ml-2 bg-gray-100 text-gray-600 text-xs">
                Bientôt
              </Badge>
            )}
          </Button>
        );
      })}
      
      {/* Description for current search type */}
      <div className="w-full mt-2">
        <p className="text-sm text-gray-600">
          {searchTypes.find(s => s.type === searchType)?.description}
        </p>
      </div>
    </div>
  );
};

export default SearchTypeToggle;