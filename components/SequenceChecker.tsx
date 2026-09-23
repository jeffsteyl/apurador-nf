import React from 'react';
import { Gap } from '../services/sequenceService';
import { CheckCircleIcon, WarningIcon } from './icons/DashboardIcons';

interface SequenceCheckerProps {
  gaps: Map<number, Gap[]> | null;
  filteredSeries: string;
}

export const SequenceChecker: React.FC<SequenceCheckerProps> = ({ gaps, filteredSeries }) => {
  if (!gaps) return null;

  if (!filteredSeries) {
    return (
      <div className="bg-blue-900/50 border border-blue-700 text-blue-300 px-4 py-3 rounded-lg shadow-md" role="alert">
        <p>Filtre por uma única série para verificar se há quebras na numeração das notas.</p>
      </div>
    );
  }

  const seriesNum = parseInt(filteredSeries, 10);
  if (isNaN(seriesNum)) {
    return (
      <div className="bg-yellow-900/50 border border-yellow-700 text-yellow-300 px-4 py-3 rounded-lg shadow-md" role="alert">
        <p>O filtro de série inserido não é um número válido.</p>
      </div>
    );
  }

  const seriesGaps = gaps.get(seriesNum);
  if (!seriesGaps || seriesGaps.length === 0) {
    return (
      <div className="bg-green-900/50 border border-green-700 text-green-300 px-4 py-3 rounded-lg shadow-md flex items-center gap-3" role="alert">
        <CheckCircleIcon />
        <p className="font-semibold">Nenhuma quebra de numeração encontrada para a série {seriesNum}.</p>
      </div>
    );
  }

  const renderGap = (gap: Gap) => 
    gap.start === gap.end ? `Nota número ${gap.start}` : `Notas de ${gap.start} a ${gap.end}`;

  return (
    <div className="bg-yellow-900/50 border border-yellow-700 text-yellow-300 px-4 py-3 rounded-lg shadow-md" role="alert">
      <div className="flex items-start gap-3">
        <WarningIcon />
        <div>
          <p className="font-bold">Atenção: Quebras de numeração encontradas para a série {seriesNum}!</p>
          <ul className="mt-2 list-disc list-inside">
            {seriesGaps.map((gap, index) => (
              <li key={index}>{renderGap(gap)}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
