'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface BalanceData {
  date: string;
  balance: number;
}

interface BalanceChartProps {
  data: BalanceData[];
}

export default function BalanceChart({ data }: BalanceChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-500">Aucune donnée disponible</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold text-text mb-4">Historique du Solde</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#c69bcc" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#c69bcc" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Area
            type="monotone"
            dataKey="balance"
            stroke="#c69bcc"
            fillOpacity={1}
            fill="url(#colorBalance)"
            name="Solde (HTG)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}



