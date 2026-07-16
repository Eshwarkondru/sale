import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line, Pie, Radar, Scatter, Doughnut } from 'react-chartjs-2';
import { useTheme } from '../context/ThemeContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const PALETTE = ['#6366f1', '#22d3ee', '#f59e0b', '#10b981', '#f43f5e', '#a855f7', '#3b82f6', '#ec4899'];

function useChartTheme() {
  const { theme } = useTheme();
  const grid = theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)';
  const ticks = theme === 'dark' ? '#cbd5e1' : '#475569';
  return { grid, ticks };
}

interface SeriesChartProps {
  labels: string[];
  datasets: { label: string; data: number[] }[];
  type?: 'bar' | 'line';
  height?: number;
}

export function SeriesChart({ labels, datasets, type = 'bar', height = 280 }: SeriesChartProps) {
  const { grid, ticks } = useChartTheme();
  const data = {
    labels,
    datasets: datasets.map((d, i) => ({
      label: d.label,
      data: d.data,
      backgroundColor: type === 'bar' ? `${PALETTE[i % PALETTE.length]}cc` : `${PALETTE[i % PALETTE.length]}33`,
      borderColor: PALETTE[i % PALETTE.length],
      borderWidth: 2,
      tension: 0.35,
      fill: type === 'line',
      pointBackgroundColor: PALETTE[i % PALETTE.length],
      pointRadius: type === 'line' ? 3 : 0,
    })),
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: ticks } } },
    scales: {
      x: { ticks: { color: ticks }, grid: { color: grid } },
      y: { ticks: { color: ticks }, grid: { color: grid }, beginAtZero: true },
    },
  };
  return (
    <div style={{ height }}>
      {type === 'bar' ? <Bar data={data} options={options} /> : <Line data={data} options={options} />}
    </div>
  );
}

interface PieChartProps {
  labels: string[];
  data: number[];
  height?: number;
  doughnut?: boolean;
}

export function PieChart({ labels, data, height = 280, doughnut = false }: PieChartProps) {
  const { ticks } = useChartTheme();
  const chartData = {
    labels,
    datasets: [
      {
        data,
        backgroundColor: PALETTE.slice(0, labels.length).map((c) => `${c}cc`),
        borderColor: PALETTE.slice(0, labels.length),
        borderWidth: 2,
      },
    ],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'right' as const, labels: { color: ticks } } },
  };
  return <div style={{ height }}>{doughnut ? <Doughnut data={chartData} options={options} /> : <Pie data={chartData} options={options} />}</div>;
}

interface RadarChartProps {
  labels: string[];
  datasets: { label: string; data: number[] }[];
  height?: number;
}

export function RadarChart({ labels, datasets, height = 300 }: RadarChartProps) {
  const { grid, ticks } = useChartTheme();
  const data = {
    labels,
    datasets: datasets.map((d, i) => ({
      label: d.label,
      data: d.data,
      backgroundColor: `${PALETTE[i % PALETTE.length]}33`,
      borderColor: PALETTE[i % PALETTE.length],
      borderWidth: 2,
      pointBackgroundColor: PALETTE[i % PALETTE.length],
    })),
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: ticks } } },
    scales: {
      r: {
        angleLines: { color: grid },
        grid: { color: grid },
        pointLabels: { color: ticks },
        ticks: { color: ticks, backdropColor: 'transparent' },
        suggestedMin: 0,
        suggestedMax: 100,
      },
    },
  };
  return <div style={{ height }}><Radar data={data} options={options} /></div>;
}

interface ScatterChartProps {
  points: { x: number; y: number }[];
  label?: string;
  height?: number;
  xLabel?: string;
  yLabel?: string;
}

export function ScatterPlot({ points, label = 'Points', height = 300, xLabel, yLabel }: ScatterChartProps) {
  const { grid, ticks } = useChartTheme();
  const data = {
    datasets: [
      {
        label,
        data: points,
        backgroundColor: `${PALETTE[0]}88`,
        borderColor: PALETTE[0],
        pointRadius: 4,
      },
    ],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: ticks } } },
    scales: {
      x: { title: { display: !!xLabel, text: xLabel, color: ticks }, ticks: { color: ticks }, grid: { color: grid } },
      y: { title: { display: !!yLabel, text: yLabel, color: ticks }, ticks: { color: ticks }, grid: { color: grid } },
    },
  };
  return <div style={{ height }}><Scatter data={data} options={options} /></div>;
}
