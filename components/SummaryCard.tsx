import React from 'react';

interface SummaryCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, icon }) => (
  <div className="bg-base-200 p-6 rounded-xl shadow-lg flex items-center space-x-4 transform hover:scale-105 transition-transform duration-300">
    <div className="bg-base-300 p-3 rounded-full text-brand-primary">{icon}</div>
    <div>
      <p className="text-sm text-gray-400">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  </div>
);
