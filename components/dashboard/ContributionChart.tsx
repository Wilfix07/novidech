'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ContributionData {
  date: string;
  amount: number;
}

interface ContributionChartProps {
  data: ContributionData[];
}

export default function ContributionChart({ data }: ContributionChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-500">Aucune donnée disponible</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold text-text mb-4">Tendances des Contributions</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="amount"
            stroke="#c69bcc"
            strokeWidth={2}
            name="Montant (HTG)"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}



