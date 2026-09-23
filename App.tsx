import React, { useState, useCallback, useMemo, useEffect } from 'react';
import JSZip from 'jszip';
import { NFeData, Filters } from './types';
import { parseNFeXML } from './services/nfeParser';
import { findSequenceGaps, Gap } from './services/sequenceService';
import { FileUploader } from './components/FileUploader';
import { Dashboard } from './components/Dashboard';
import { LoadingSpinner } from './components/icons/LoadingSpinner';

const CORRECT_SAIDA_CFOPS = new Set([6108, 5102, 6106, 5106]);

export const App: React.FC = () => {
  const [allInvoices, setAllInvoices] = useState<NFeData[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<NFeData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [sequenceGaps, setSequenceGaps] = useState<Map<number, Gap[]> | null>(null);
  const [serieFilter, setSerieFilter] = useState<string>('');
  const [cfopFilter, setCfopFilter] = useState<string>('Todas as Naturezas');
  const [statusFilter, setStatusFilter] = useState<string>('Todas');
  const [invalidCfopInvoices, setInvalidCfopInvoices] = useState<NFeData[]>([]);

  useEffect(() => {
    if (cfopFilter === 'Saída') {
        const invalid = filteredInvoices.filter(
          inv => inv.operationCategory === 'Saída' && !CORRECT_SAIDA_CFOPS.has(inv.cfop)
        );
        setInvalidCfopInvoices(invalid);
    } else {
        setInvalidCfopInvoices([]);
    }
  }, [filteredInvoices, cfopFilter]);

  const handleFileUpload = useCallback(async (files: FileList | File[]) => {
    if (!files.length) return;
    setIsLoading(true);
    setError(null);
    setAllInvoices([]);
    setFilteredInvoices([]);
    setSequenceGaps(null);

    try {
      const filesToProcess: File[] = [];
      const fileListArray = Array.from(files);
      
      for (const file of fileListArray) {
        if (file.name.toLowerCase().endsWith('.zip')) {
          const zip = await JSZip.loadAsync(file);
          for (const filename in zip.files) {
            const entry = zip.files[filename];
            if (!entry.dir && filename.toLowerCase().endsWith('.xml')) {
              const content = await entry.async('blob');
              filesToProcess.push(new File([content], filename, { type: 'application/xml' }));
            }
          }
        } else if (file.type === 'application/xml' || file.name.toLowerCase().endsWith('.xml')) {
          filesToProcess.push(file);
        }
      }

      if (!filesToProcess.length) {
        setError("Nenhum arquivo XML válido foi encontrado.");
        setIsLoading(false);
        return;
      }

      const nfeFiles: File[] = [];
      const cancellationKeys = new Set<string>();

      await Promise.all(filesToProcess.map(async file => {
        try {
          const content = await file.text();
          const xmlDoc = new DOMParser().parseFromString(content, 'application/xml');
          if (xmlDoc.getElementsByTagName('parsererror').length > 0) return;
          const rootTag = xmlDoc.documentElement.tagName;
          if (rootTag === 'nfeProc' || rootTag === 'NFe') {
            nfeFiles.push(file);
          } else if (rootTag === 'procEventoNFe' && xmlDoc.getElementsByTagName('tpEvento')[0]?.textContent?.trim() === '110111' && xmlDoc.getElementsByTagName('cStat')[0]?.textContent?.trim() === '135') {
            const chNFe = xmlDoc.getElementsByTagName('chNFe')[0]?.textContent?.trim();
            if (chNFe) cancellationKeys.add(chNFe);
          }
        } catch (e) { 
          console.warn(`Falha no pré-processamento de ${file.name}`, e); 
        }
      }));
    
      if (nfeFiles.length === 0) {
        setError(cancellationKeys.size > 0 
          ? "Arquivos de cancelamento foram encontrados, mas nenhuma NFe correspondente." 
          : "Nenhum arquivo de NFe válido foi encontrado.");
        setIsLoading(false);
        return;
      }

      const results = await Promise.allSettled(nfeFiles.map(parseNFeXML));
      const successfulInvoices = results
        .filter((r): r is PromiseFulfilledResult<NFeData> => r.status === 'fulfilled')
        .map(r => r.value);
      
      const finalInvoices = successfulInvoices.map(inv => 
        cancellationKeys.has(inv.id.replace('NFe', '')) 
          ? { ...inv, status: 'Cancelada' as const } 
          : inv
      );
      
      const failedParses = results.filter(r => r.status === 'rejected');
      if (failedParses.length > 0) {
        setError(`Falha ao processar ${failedParses.length} arquivo(s). Erro: ${(failedParses[0] as PromiseRejectedResult).reason?.message || 'Desconhecido.'}`);
      }
      
      if (finalInvoices.length > 0) {
        const sorted = finalInvoices.sort((a, b) => new Date(b.dataEmissao).getTime() - new Date(a.dataEmissao).getTime());
        setAllInvoices(sorted);
        setFilteredInvoices(sorted);
        setSequenceGaps(findSequenceGaps(sorted));
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro inesperado.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const applyFilters = useCallback(() => {
    const invoices = allInvoices.filter(inv => 
      (!serieFilter || inv.serie.toString() === serieFilter) &&
      (cfopFilter === 'Todas as Naturezas' || inv.operationCategory === cfopFilter) &&
      (statusFilter === 'Todas' || inv.status === (statusFilter === 'Autorizadas' ? 'Autorizada' : 'Cancelada'))
    );
    setFilteredInvoices(invoices);
  }, [allInvoices, serieFilter, cfopFilter, statusFilter]);

  const clearFilters = useCallback(() => {
    setSerieFilter('');
    setCfopFilter('Todas as Naturezas');
    setStatusFilter('Todas');
    setFilteredInvoices(allInvoices);
  }, [allInvoices]);
  
  const handleReset = useCallback(() => {
    setAllInvoices([]);
    setFilteredInvoices([]);
    setError(null);
    setSequenceGaps(null);
    setSerieFilter('');
    setCfopFilter('Todas as Naturezas');
    setStatusFilter('Todas');
  }, []);

  const dashboardStats = useMemo(() => {
    const authorized = filteredInvoices.filter(inv => inv.status === 'Autorizada');
    const totalValue = authorized.reduce((acc, inv) => acc + inv.valorTotal, 0);
    return { 
      totalValue, 
      invoiceCount: filteredInvoices.length, 
      averageValue: authorized.length > 0 ? totalValue / authorized.length : 0 
    };
  }, [filteredInvoices]);

  const apuracaoStats = useMemo(() => {
    const authorized = filteredInvoices.filter(inv => inv.status === 'Autorizada');
    const totalSaida = authorized.filter(inv => inv.operationCategory === 'Saída').reduce((acc, inv) => acc + inv.valorTotal, 0);
    const totalDevolucao = authorized.filter(inv => inv.operationCategory === 'Devolução').reduce((acc, inv) => acc + inv.valorTotal, 0);
    return { totalSaida, totalDevolucao, resultado: totalSaida - totalDevolucao };
  }, [filteredInvoices]);

  return (
    <div className="min-h-screen bg-base-100 text-base-content p-4 sm:p-6 lg:p-8">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary">
          Painel de Auditoria de NFe
        </h1>
        <p className="text-lg text-gray-400 mt-2">
          Faça upload dos seus arquivos XML, pastas ou arquivos .zip para começar.
        </p>
      </header>

      <main className="max-w-7xl mx-auto">
        {isLoading && (
          <div className="flex flex-col items-center justify-center h-64">
            <LoadingSpinner />
            <p className="mt-4 text-lg">Processando arquivos...</p>
          </div>
        )}

        {!isLoading && error && (
          <div className="text-center p-4 bg-red-900/50 border border-red-700 rounded-lg">
            <p className="text-red-300">{error}</p>
            <button 
              onClick={handleReset} 
              className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md text-white transition-colors cursor-pointer"
            >
              Tentar Novamente
            </button>
          </div>
        )}

        {!isLoading && !error && allInvoices.length === 0 && (
          <FileUploader onFileUpload={handleFileUpload} />
        )}

        {!isLoading && !error && allInvoices.length > 0 && (
          <Dashboard
            stats={dashboardStats}
            apuracaoStats={apuracaoStats}
            invoices={filteredInvoices}
            filters={{ serie: serieFilter, cfop: cfopFilter, status: statusFilter }}
            onFilterChange={{ setSerie: setSerieFilter, setCfop: setCfopFilter, setStatus: setStatusFilter }}
            onApplyFilters={applyFilters}
            onClearFilters={clearFilters}
            onReset={handleReset}
            sequenceGaps={sequenceGaps}
            invalidCfopInvoices={invalidCfopInvoices}
          />
        )}
      </main>
    </div>
  );
};

export default App;
