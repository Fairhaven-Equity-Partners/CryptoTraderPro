import React from 'react';
import Header from '@/components/Header';
import PortfolioManager from '@/components/PortfolioManager';

export default function Portfolio() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <PortfolioManager />
    </div>
  );
}