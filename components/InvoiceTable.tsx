import React from 'react';
import { NFeData } from '../types';

interface InvoiceTableProps {
  invoices: NFeData[];
}

export const InvoiceTable: React.FC<InvoiceTableProps> = ({ invoices }) => {
  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'Entrada': return 'bg-green-900 text-green-300';
      case 'Saída': return 'bg-sky-900 text-sky-300';
      case 'Devolução': return 'bg-yellow-900 text-yellow-300';
      case 'Transferência': return 'bg-purple-900 text-purple-300';
      default: return 'bg-gray-700 text-gray-400';
    }
  };

  const getStatusBadgeColor = (status: string) => 
    status === 'Autorizada' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300';

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  if (invoices.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-400">Nenhuma nota fiscal encontrada para os filtros aplicados.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-base-300">
        <thead className="bg-base-300">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Número</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Série</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Data Emissão</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Emitente</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Destinatário</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Natureza da Operação</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">CFOP</th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Valor Total (R$)</th>
          </tr>
        </thead>
        <tbody className="bg-base-200 divide-y divide-base-300">
          {invoices.map((invoice) => (
            <tr key={invoice.id} className={`hover:bg-base-300/50 transition-colors ${invoice.status === 'Cancelada' ? 'opacity-60 line-through' : ''}`}>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(invoice.status)}`}>
                  {invoice.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">{invoice.numero}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">{invoice.serie}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDate(invoice.dataEmissao)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm truncate max-w-xs" title={invoice.emitente.nome}>{invoice.emitente.nome}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm truncate max-w-xs" title={invoice.destinatario.nome}>{invoice.destinatario.nome}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getCategoryBadgeColor(invoice.operationCategory)}`}>
                  {invoice.operationCategory}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">{invoice.cfop}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">{formatCurrency(invoice.valorTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
