/**
 * Transaction Details Component
 * 
 * @author Bachir Fahmi <bachirfahmi5@gmail.com>
 * @repository https://github.com/bechir-fahmi
 * @description Detailed transaction breakdown table with sorting, filtering,
 *              and export capabilities for bilan reports
 * @created 2025
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DetailTransaction } from '@/types/bilan.types';
import { bilanService } from '@/services/bilan.service';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  FileText, 
  ExternalLink,
  Download
} from 'lucide-react';

interface TransactionDetailsProps {
  transactions: DetailTransaction[];
  onDocumentClick?: (documentId: string) => void;
}

const TransactionDetails: React.FC<TransactionDetailsProps> = ({
  transactions,
  onDocumentClick
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'montant' | 'type' | 'libelle'>('montant');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const documentTypes = [
    { value: 'invoice', label: 'Facture' },
    { value: 'receipt', label: 'Reçu' },
    { value: 'purchase_order', label: 'Bon de commande' },
    { value: 'bank_statement', label: 'Relevé bancaire' },
    { value: 'expense_report', label: 'Note de frais' },
    { value: 'payslip', label: 'Fiche de paie' },
    { value: 'other', label: 'Autre' }
  ];

  // Filter and sort transactions
  const filteredTransactions = (transactions || [])
    .filter(transaction => {
      const matchesSearch = !searchQuery || 
        transaction.libelle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.document_id.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = !typeFilter || typeFilter === 'all' || transaction.type === typeFilter;
      
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'montant':
          comparison = a.montant - b.montant;
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'libelle':
          comparison = a.libelle.localeCompare(b.libelle);
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const totalAmount = filteredTransactions.reduce((sum, transaction) => sum + transaction.montant, 0);

  const getTypeLabel = (type: string) => {
    const typeInfo = documentTypes.find(t => t.value === type);
    return typeInfo?.label || type;
  };

  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'invoice': 'bg-blue-100 text-blue-800',
      'receipt': 'bg-green-100 text-green-800',
      'purchase_order': 'bg-purple-100 text-purple-800',
      'bank_statement': 'bg-yellow-100 text-yellow-800',
      'expense_report': 'bg-red-100 text-red-800',
      'payslip': 'bg-indigo-100 text-indigo-800',
      'other': 'bg-gray-100 text-gray-800'
    };
    return colors[type] || colors['other'];
  };

  const handleSort = (field: 'montant' | 'type' | 'libelle') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const exportToCSV = () => {
    const headers = ['Document ID', 'Type', 'Libellé', 'Compte Comptable', 'Montant'];
    const csvContent = [
      headers.join(','),
      ...filteredTransactions.map(transaction => [
        transaction.document_id,
        getTypeLabel(transaction.type),
        `"${transaction.libelle}"`,
        `"${transaction.compte_comptable}"`,
        transaction.montant.toString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'transactions_bilan.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Table className="h-5 w-5" />
            <span>Détail des Transactions</span>
            <Badge variant="outline">
              {filteredTransactions.length} transaction{filteredTransactions.length > 1 ? 's' : ''}
            </Badge>
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">
              Total: {bilanService.formatCurrency(totalAmount)}
            </Badge>
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Exporter CSV
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher par libellé ou ID document..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filtrer par type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              {documentTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Transactions Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleSort('type')}
                    className="h-auto p-0 font-medium"
                  >
                    Type
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleSort('libelle')}
                    className="h-auto p-0 font-medium"
                  >
                    Libellé
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Compte Comptable</TableHead>
                <TableHead className="text-right">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleSort('montant')}
                    className="h-auto p-0 font-medium"
                  >
                    Montant
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((transaction, index) => (
                <TableRow key={index} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <span className="font-mono text-sm truncate max-w-32" title={transaction.document_id}>
                        {transaction.document_id}
                      </span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge className={getTypeColor(transaction.type)}>
                      {getTypeLabel(transaction.type)}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <span className="max-w-48 truncate block" title={transaction.libelle}>
                      {transaction.libelle}
                    </span>
                  </TableCell>
                  
                  <TableCell>
                    <span className="text-sm text-gray-600">
                      {transaction.compte_comptable}
                    </span>
                  </TableCell>
                  
                  <TableCell className="text-right font-mono">
                    <span className={transaction.montant >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {bilanService.formatCurrency(transaction.montant)}
                    </span>
                  </TableCell>
                  
                  <TableCell>
                    {onDocumentClick && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDocumentClick(transaction.document_id)}
                        className="h-8 w-8 p-0"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Empty State */}
        {filteredTransactions.length === 0 && (
          <div className="text-center py-8">
            <Filter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune transaction trouvée</h3>
            <p className="text-gray-500">
              {searchQuery || typeFilter 
                ? 'Modifiez vos critères de recherche pour voir plus de résultats.'
                : 'Aucune transaction disponible dans ce bilan.'
              }
            </p>
            {(searchQuery || typeFilter) && (
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                  setSearchQuery('');
                  setTypeFilter('all');
                }}
              >
                Effacer les filtres
              </Button>
            )}
          </div>
        )}

        {/* Summary */}
        {filteredTransactions.length > 0 && (
          <div className="border-t pt-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">
                {filteredTransactions.length} transaction{filteredTransactions.length > 1 ? 's' : ''} affichée{filteredTransactions.length > 1 ? 's' : ''}
                {(searchQuery || typeFilter) && ` sur ${transactions.length} au total`}
              </span>
              <div className="font-medium">
                Total: <span className={totalAmount >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {bilanService.formatCurrency(totalAmount)}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionDetails;