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

export default function RevenueChart({ dataPoints }) {
  // Configuração dos dados
  const data = {
    labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
    datasets: [
      {
        fill: true,
        label: 'Faturamento R$',
        data: dataPoints, // Ex: [120, 190, 300, 500, 200, 1000, 800]
        borderColor: COLORS.sageGreen,
        backgroundColor: 'rgba(138, 154, 134, 0.1)', // SageGreen com transparência
        tension: 0.4, // Deixa a linha curvada (mais moderno)
        pointRadius: 4,
        pointBackgroundColor: COLORS.sageGreen,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // Escondemos a legenda para ficar mais minimalista
      },
      tooltip: {
        backgroundColor: COLORS.deepCharcoal,
        padding: 12,
        titleFont: { size: 14 },
        bodyFont: { size: 14 },
        displayColors: false,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          display: true,
          color: '#F0F0F0',
        },
        ticks: {
          callback: (value) => `R$ ${value}`,
          color: '#999',
        }
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#999',
        }
      }
    },
  };

  return (
    <div style={{ height: '300px', width: '100%' }}>
      <Line data={data} options={options} />
    </div>
  );
}