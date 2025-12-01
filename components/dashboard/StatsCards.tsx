'use client';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

function StatCard({ title, value, icon, trend }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm mb-1">{title}</p>
          <p className="text-2xl font-bold text-text">{value}</p>
          {trend && (
            <p className={`text-sm mt-2 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );
}

interface StatsCardsProps {
  totalBalance: number;
  totalContributions: number;
  activeLoans: number;
  recentTransactions: number;
}

export default function StatsCards({
  totalBalance,
  totalContributions,
  activeLoans,
  recentTransactions,
}: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatCard
        title="Solde Total"
        value={`${totalBalance.toLocaleString('fr-FR')} HTG`}
        icon="💰"
      />
      <StatCard
        title="Contributions Totales"
        value={`${totalContributions.toLocaleString('fr-FR')} HTG`}
        icon="📈"
      />
      <StatCard
        title="Prêts Actifs"
        value={activeLoans}
        icon="💳"
      />
      <StatCard
        title="Transactions Récentes"
        value={recentTransactions}
        icon="📊"
      />
    </div>
  );
}



