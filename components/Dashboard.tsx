import React, { useState } from 'react';
import { NFeData, Filters } from '../types';
import { SummaryCard } from './SummaryCard';
import { ApuracaoView } from './ApuracaoView';
import { SequenceChecker } from './SequenceChecker';
import { InvoiceTable } from './InvoiceTable';
import { 
  FileTextIcon, 
  DollarSignIcon, 
  BarChartIcon, 
  ResetIcon, 
  CheckCircleIcon, 
  WarningIcon 
} from './icons/DashboardIcons';
import { Gap } from '../services/sequenceService';

const FILTER_OPERATION_CATEGORIES = [
  'Todas as Naturezas',
  'Entrada',
  'Saída',
  'Devolução',
  'Transferência',
  'Outro',
];

const FILTER_STATUS_CATEGORIES = [
  'Todas',
  'Autorizadas',
  'Canceladas',
];

interface DashboardStats {
  totalValue: number;
  invoiceCount: number;
  averageValue: number;
}

interface ApuracaoStats {
  totalSaida: number;
  totalDevolucao: number;
  resultado: number;
}

interface CfopVerifierProps {
  invalidInvoices: NFeData[];
  cfopFilter: string;
}

const CfopVerifier: React.FC<CfopVerifierProps> = ({ invalidInvoices, cfopFilter }) => {
  if (cfopFilter !== 'Saída') {
    return null;
  }

  if (invalidInvoices.length === 0) {
    return (
      <div className="bg-green-900/50 border border-green-700 text-green-300 px-4 py-3 rounded-lg shadow-md flex items-center gap-3" role="alert">
        <CheckCircleIcon />
        <p className="font-semibold">Todos os CFOPs de Saída nos filtros atuais estão corretos.</p>
      </div>
    );
  }

  return (
    <div className="bg-yellow-900/50 border border-yellow-700 text-yellow-300 px-4 py-3 rounded-lg shadow-md" role="alert">
      <div className="flex items-start gap-3">
        <WarningIcon />
        <div>
          <p className="font-bold">Atenção: Encontrados CFOPs de Saída inválidos!</p>
          <p className="text-sm mb-2">As seguintes notas estão classificadas como "Saída", mas não possuem um CFOP esperado (6108, 5102, 6106, 5106):</p>
          <ul className="mt-2 text-xs space-y-1">
            {invalidInvoices.map(inv => (
              <li key={inv.id}>
                - NFe: <strong>{inv.numero}</strong> / Série: <strong>{inv.serie}</strong> / CFOP: <strong className="bg-red-900 px-1 rounded">{inv.cfop}</strong>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

interface DashboardProps {
  stats: DashboardStats;
  apuracaoStats: ApuracaoStats;
  invoices: NFeData[];
  filters: Filters;
  onFilterChange: {
    setSerie: (val: string) => void;
    setCfop: (val: string) => void;
    setStatus: (val: string) => void;
  };
  onApplyFilters: () => void;
  onClearFilters: () => void;
  onReset: () => void;
  sequenceGaps: Map<number, Gap[]> | null;
  invalidCfopInvoices: NFeData[];
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  stats, 
  apuracaoStats, 
  invoices, 
  filters, 
  onFilterChange, 
  onApplyFilters, 
  onClearFilters, 
  onReset, 
  sequenceGaps, 
  invalidCfopInvoices 
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'apuracao'>('overview');
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const renderTabContent = () => {
    if (activeTab === 'apuracao') {
      return <ApuracaoView stats={apuracaoStats} formatCurrency={formatCurrency} />;
    }
    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <SummaryCard title="Total de Documentos" value={stats.invoiceCount.toString()} icon={<FileTextIcon />} />
          <SummaryCard title="Valor Total (Autorizadas)" value={formatCurrency(stats.totalValue)} icon={<DollarSignIcon />} />
          <SummaryCard title="Média por Nota (Autorizadas)" value={formatCurrency(stats.averageValue)} icon={<BarChartIcon />} />
        </div>
        <div className="mt-6 space-y-4">
          <SequenceChecker gaps={sequenceGaps} filteredSeries={filters.serie} />
          <CfopVerifier invalidInvoices={invalidCfopInvoices} cfopFilter={filters.cfop} />
        </div>
        <div className="bg-base-200 p-4 rounded-lg shadow-md mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Notas Fiscais Processadas</h2>
            <button 
              onClick={onReset} 
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md font-semibold hover:bg-red-700 transition cursor-pointer" 
              title="Carregar novos arquivos"
            >
              <ResetIcon />
              <span>Resetar</span>
            </button>
          </div>
          <InvoiceTable invoices={invoices} />
        </div>
      </>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-base-200 p-4 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
          <div className="lg:col-span-1">
            <label htmlFor="serie" className="block text-sm font-medium text-gray-300 mb-1">Série da Nota</label>
            <input 
              type="text" 
              id="serie" 
              value={filters.serie} 
              onChange={(e) => onFilterChange.setSerie(e.target.value)} 
              placeholder="Ex: 1" 
              className="w-full bg-base-300 border border-base-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition p-2 text-white" 
            />
          </div>
          <div className="lg:col-span-2">
            <label htmlFor="cfop" className="block text-sm font-medium text-gray-300 mb-1">Natureza da Operação</label>
            <select 
              id="cfop" 
              value={filters.cfop} 
              onChange={(e) => onFilterChange.setCfop(e.target.value)} 
              className="w-full bg-base-300 border border-base-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition py-2 px-3 text-white"
            >
              {FILTER_OPERATION_CATEGORIES.map(c => (
                <option key={c} value={c} className="bg-base-300 text-white">{c}</option>
              ))}
            </select>
          </div>
          <div className="lg:col-span-1">
            <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-1">Status do Documento</label>
            <select 
              id="status" 
              value={filters.status} 
              onChange={(e) => onFilterChange.setStatus(e.target.value)} 
              className="w-full bg-base-300 border border-base-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition py-2 px-3 text-white"
            >
              {FILTER_STATUS_CATEGORIES.map(c => (
                <option key={c} value={c} className="bg-base-300 text-white">{c}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 lg:col-span-2">
            <button 
              onClick={onApplyFilters} 
              className="w-full px-4 py-2 bg-brand-primary text-white rounded-md font-semibold hover:bg-indigo-700 transition cursor-pointer"
            >
              Filtrar
            </button>
            <button 
              onClick={onClearFilters} 
              className="w-full px-4 py-2 bg-base-300 hover:bg-gray-600 text-white rounded-md transition cursor-pointer"
            >
              Limpar
            </button>
          </div>
        </div>
      </div>
      <div className="border-b border-base-300">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          <button 
            onClick={() => setActiveTab('overview')} 
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer ${
              activeTab === 'overview' 
                ? 'border-brand-primary text-brand-primary' 
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
            }`}
          >
            Visão Geral
          </button>
          <button 
            onClick={() => setActiveTab('apuracao')} 
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer ${
              activeTab === 'apuracao' 
                ? 'border-brand-primary text-brand-primary' 
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
            }`}
          >
            Apuração
          </button>
        </nav>
      </div>
      <div className="mt-6">{renderTabContent()}</div>
    </div>
  );
};
