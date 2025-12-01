'use client';

import TransactionCard from './TransactionCard';
import type { Transaction } from '@/types';

interface TransactionListProps {
  transactions: Transaction[];
  title?: string;
  limit?: number;
}

export default function TransactionList({ transactions, title, limit }: TransactionListProps) {
  const displayTransactions = limit ? transactions.slice(0, limit) : transactions;

  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-500">Aucune transaction trouvée</p>
      </div>
    );
  }

  return (
    <div>
      {title && <h2 className="text-2xl font-bold text-text mb-4">{title}</h2>}
      <div className="space-y-4">
        {displayTransactions.map((transaction) => (
          <TransactionCard key={transaction.id} transaction={transaction} />
        ))}
      </div>
    </div>
  );
}

