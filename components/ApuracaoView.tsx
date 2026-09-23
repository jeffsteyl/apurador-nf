import React from 'react';
import { SummaryCard } from './SummaryCard';
import { ArrowUpCircleIcon, ArrowDownCircleIcon, CalculatorIcon } from './icons/DashboardIcons';

interface ApuracaoStats {
  totalSaida: number;
  totalDevolucao: number;
  resultado: number;
}

interface ApuracaoViewProps {
  stats: ApuracaoStats;
  formatCurrency: (value: number) => string;
}

export const ApuracaoView: React.FC<ApuracaoViewProps> = ({ stats, formatCurrency }) => (
  <div className="space-y-6">
    <div className="text-center">
      <h2 className="text-2xl font-semibold text-white">Apuração (Saídas - Devoluções)</h2>
      <p className="text-gray-400 mt-1">Este cálculo considera apenas as notas com status <span className="font-semibold text-green-400">"Autorizada"</span> dentro dos filtros aplicados.</p>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <SummaryCard title="Total Saídas (Autorizadas)" value={formatCurrency(stats.totalSaida)} icon={<ArrowUpCircleIcon />} />
      <SummaryCard title="Total Devoluções (Autorizadas)" value={formatCurrency(stats.totalDevolucao)} icon={<ArrowDownCircleIcon />} />
      <SummaryCard title="Resultado da Apuração" value={formatCurrency(stats.resultado)} icon={<CalculatorIcon />} />
    </div>
  </div>
);
