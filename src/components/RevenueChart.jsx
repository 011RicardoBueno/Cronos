import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { COLORS } from '../constants/dashboard';

// Registar os componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

export default function RevenueChart({ dataPoints, label = "Faturamento", isCurrency = true }) {
  const data = {
    labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
    datasets: [
      {
        fill: true,
        label: label,
        data: dataPoints,
        borderColor: COLORS.sageGreen,
        backgroundColor: 'rgba(138, 154, 134, 0.1)',
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: COLORS.sageGreen,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: COLORS.deepCharcoal,
        callbacks: {
          label: (context) => isCurrency 
            ? `R$ ${context.parsed.y.toLocaleString('pt-BR')}` 
            : `${context.parsed.y} atendimentos`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          // Aqui removemos o R$ se isCurrency for false
          callback: (value) => isCurrency ? `R$ ${value}` : value,
          color: '#999',
        }
      },
      x: { ticks: { color: '#999' }, grid: { display: false } }
    },
  };

  return (
    <div style={{ height: '300px', width: '100%' }}>
      <Line data={data} options={options} />
    </div>
  );
}