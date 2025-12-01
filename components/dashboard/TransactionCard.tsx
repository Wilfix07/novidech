'use client';

import type { Transaction, TransactionType } from '@/types';

interface TransactionCardProps {
  transaction: Transaction;
}

export default function TransactionCard({ transaction }: TransactionCardProps) {
  const getTypeColor = (type: TransactionType) => {
    switch (type) {
      case 'contribution':
        return 'bg-green-100 text-green-800';
      case 'loan':
        return 'bg-blue-100 text-blue-800';
      case 'payment':
        return 'bg-purple-100 text-purple-800';
      case 'withdrawal':
        return 'bg-red-100 text-red-800';
      case 'expense':
        return 'bg-orange-100 text-orange-800';
      case 'interest':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: TransactionType) => {
    switch (type) {
      case 'contribution':
        return 'Contribution';
      case 'loan':
        return 'Prêt';
      case 'payment':
        return 'Paiement';
      case 'withdrawal':
        return 'Retrait';
      case 'expense':
        return 'Dépense';
      case 'interest':
        return 'Intérêt';
      default:
        return type;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(transaction.type)}`}>
          {getTypeLabel(transaction.type)}
        </span>
        <span className={`text-lg font-bold ${
          transaction.type === 'contribution' || transaction.type === 'payment' || transaction.type === 'interest'
            ? 'text-green-600' 
            : transaction.type === 'withdrawal' || transaction.type === 'expense'
            ? 'text-red-600' 
            : 'text-text'
        }`}>
          {transaction.type === 'contribution' || transaction.type === 'payment' || transaction.type === 'interest' 
            ? '+' 
            : transaction.type === 'withdrawal' || transaction.type === 'expense' 
            ? '-' 
            : ''}
          {(() => {
            const amount = typeof transaction.amount === 'number' 
              ? transaction.amount 
              : parseFloat(String(transaction.amount));
            return isNaN(amount) ? '0' : amount.toLocaleString('fr-FR');
          })()} HTG
        </span>
      </div>
      {transaction.description && (
        <p className="text-gray-600 text-sm mb-2">{transaction.description}</p>
      )}
      <p className="text-gray-500 text-xs">{formatDate(transaction.transaction_date)}</p>
    </div>
  );
}

