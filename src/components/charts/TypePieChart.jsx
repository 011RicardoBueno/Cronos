import React, { useMemo } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function TypePieChart({ transactions = [] }) {

  const chartData = useMemo(() => {
    const typeCounts = transactions.reduce((acc, t) => {
      const type = t.type || 'unknown';
      // We only count positive amounts for revenue types
      if (t.type === 'service' || t.type === 'product') {
        if (t.amount > 0) {
            acc[type] = (acc[type] || 0) + 1;
        }
      } else {
        acc[type] = (acc[type] || 0) + 1;
      }
      return acc;
    }, {});

    const labels = Object.keys(typeCounts).map(type => {
        switch(type) {
            case 'service': return 'Serviços';
            case 'product': return 'Produtos';
            case 'expense': return 'Despesas';
            case 'advance_redemption': return 'Uso de Vale';
            default: return 'Outros';
        }
    });

    const data = Object.values(typeCounts);
    
    // Get colors from CSS variables for theme consistency
    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#10B981';
    const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#3B82F6';
    
    const backgroundColors = Object.keys(typeCounts).map(type => {
        switch(type) {
            case 'service': return primaryColor;
            case 'product': return accentColor;
            case 'expense': return '#EF4444'; // red-500
            case 'advance_redemption': return '#F59E0B'; // amber-500
            default: return '#6B7280'; // gray-500
        }
    });

    return {
      labels,
      datasets: [
        {
          label: 'Nº de Transações',
          data,
          backgroundColor: backgroundColors,
          borderColor: 'var(--dash-card)',
          borderWidth: 4,
        },
      ],
    };
  }, [transactions]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: 'var(--dash-text-muted)', padding: 20, boxWidth: 12, font: { size: 12, weight: 'bold' } },
      },
      tooltip: { backgroundColor: 'var(--dash-card)', titleColor: 'var(--dash-text)', bodyColor: 'var(--dash-text-muted)', padding: 10, cornerRadius: 8 },
    },
  };

  if (transactions.length === 0) {
    return <div className="flex items-center justify-center h-full text-brand-muted text-sm">Sem dados para exibir</div>
  }

  return (
    <div style={{ position: 'relative', height: '100%', minHeight: '250px' }}>
      <Pie data={chartData} options={chartOptions} />
    </div>
  );
}