"use client";

import React, { useState, useRef, useMemo } from "react";
import { Bar, Chart } from "react-chartjs-2";
import {
  Chart as ChartJS, // Renomeado para evitar conflito com o componente Chart
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend, // Renomeado ChartJS para Chart para clareza
  LineElement, // Adicionado para gráficos de linha
  LineController, // Adicionado para gráficos de linha
  PointElement, // Adicionado para gráficos de linha
} from "chart.js";
import { BoxPlotController, BoxAndWiskers } from "@sgratzl/chartjs-chart-boxplot";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

ChartJS.defaults.color = 'black'; // Define a cor padrão do texto para todos os gráficos
 
ChartJS.register( // Usando o nome importado 'ChartJS'
  CategoryScale,
  LinearScale,
  BarElement,
  BoxPlotController,
  BoxAndWiskers,
  Title,
  LineController,
  Tooltip, // Adicionado para gráficos de linha
  Legend, // Adicionado para gráficos de linha
  LineElement, // Registra o elemento de linha
  PointElement // Registra o elemento de ponto
);

// Função para calcular os pontos da curva de distribuição normal (PDF)
function calculateNormalDistributionData(mean: number, stddev: number, dataMin: number, dataMax: number, numPoints = 100) {
  if (stddev === 0 || isNaN(mean) || isNaN(stddev)) {
    // Se o desvio padrão for zero ou N/A, a curva normal não é significativa.
    // Retorna dados vazios ou um ponto no centro se for um caso de dados únicos.
    if (stddev === 0 && !isNaN(mean)) {
      return { labels: [mean.toFixed(2)], data: [1] }; // Um pico no valor único
    }
    return { labels: [], data: [] };
  }

  const labels: string[] = [];
  const data: number[] = [];

  // Define um intervalo para a curva, tipicamente média +/- 3-4 desvios padrão
  const minX = Math.min(dataMin, mean - 4 * stddev);
  const maxX = Math.max(dataMax, mean + 4 * stddev);
  const range = maxX - minX;
  const step = range / (numPoints - 1);

  for (let i = 0; i < numPoints; i++) {
    const x = minX + i * step;
    const y = (1 / (stddev * Math.sqrt(2 * Math.PI))) * Math.exp(-((x - mean) ** 2) / (2 * stddev ** 2));
    labels.push(x.toFixed(2));
    data.push(y);
  }

  return { labels, data };
}

interface Stats {
  count: number;
  mean: number | "N/A";
  median: number | "N/A";
  stddev: number | "N/A";
  skewness: number | "N/A";
  kurtosis: number | "N/A";
}

interface AnalysisResult {
  stats: {
    ok: {
      torque: Stats;
      angle: Stats;
    };
    nok: {
      torque: Stats;
      angle: Stats;
    };
    all: {
      torque: Stats;
      angle: Stats;
    }
  };
  rawData: {
    ok_torque: number[];
    ok_angle: number[];
    nok_torque: number[];
    nok_angle: number[];
  };
  all_torque: number[];
  all_angle: number[];
  controlChartData: {
    ok_torque: { labels: string[], data: number[] };
    ok_angle: { labels: string[], data: number[] };
    noktorque: { labels: string[], data: number[] };
    nokangle: { labels: string[], data: number[] };
  };

  fileName: string;
}

function createHistogramData(data: number[], binCount = 15) { // Mantido binCount = 15 como estava no contexto
  if (data.length === 0) {
    return { labels: [], counts: [] };
  }

  const dataMin = Math.min(...data);
  const dataMax = Math.max(...data);

  // Arredonda os limites para valores mais "agradáveis"
  const niceMin = Math.floor(dataMin);
  const niceMax = Math.ceil(dataMax);

  const binSize = (niceMax - niceMin) / binCount;

  const bins = new Array(binCount).fill(0);
  const labels = new Array(binCount);

  for (let i = 0; i < binCount; i++) {
    const binStart = niceMin + i * binSize;
    const binEnd = binStart + binSize;
    labels[i] = `${binStart.toFixed(2)} - ${binEnd.toFixed(2)}`;
  }

  for (const value of data) {
    let binIndex = Math.floor((value - niceMin) / binSize);
    if (binIndex === binCount) {
      binIndex--;
    }
    bins[binIndex]++;
  }

  return { labels, counts: bins };
}

// Componente Memoizado para as Estatísticas
const MemoizedStats = React.memo(function MemoizedStats({ analysis }: { analysis: AnalysisResult }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
      <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
        <h3 className="text-black font-semibold mb-4 text-center text-slate-700">Estatísticas de Torque (OK)</h3>
        <table className="w-full text-left">
          <tbody>
            <tr className="border-b"><td className="py-2 pr-2 text-black">Contagem</td><td className="text-black">{analysis.stats.ok.torque.count}</td></tr>
            <tr className="border-b"><td className="py-2 pr-2 text-black">Média</td><td className="text-black">{typeof analysis.stats.ok.torque.mean === 'number' ? analysis.stats.ok.torque.mean.toFixed(2) : 'N/A'}</td></tr>
            <tr className="border-b"><td className="py-2 pr-2 text-black">Mediana</td><td className="text-black">{typeof analysis.stats.ok.torque.median === 'number' ? analysis.stats.ok.torque.median.toFixed(2) : 'N/A'}</td></tr>
            <tr className="border-b"><td className="py-2 pr-2 text-black">Desvio Padrão</td><td className="text-black">{typeof analysis.stats.ok.torque.stddev === 'number' ? analysis.stats.ok.torque.stddev.toFixed(2) : 'N/A'}</td></tr>
            <tr className="border-b"><td className="py-2 pr-2 text-black">Assimetria (Skewness)</td><td className="text-black">{typeof analysis.stats.ok.torque.skewness === 'number' ? analysis.stats.ok.torque.skewness.toFixed(3) : 'N/A'}</td></tr>
            <tr><td className="py-2 pr-2 text-black">Curtose (Kurtosis)</td><td className="text-black">{typeof analysis.stats.ok.torque.kurtosis === 'number' ? analysis.stats.ok.torque.kurtosis.toFixed(3) : 'N/A'}</td></tr>
          </tbody>
        </table>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
        <h3 className="text-black font-semibold mb-4 text-center text-slate-700">Estatísticas de Torque (NOK)</h3>
        <table className="w-full text-left">
          <tbody>
            <tr className="border-b"><td className="py-2 pr-2 text-black">Contagem</td><td className="text-black">{analysis.stats.nok.torque.count}</td></tr>
            <tr className="border-b"><td className="py-2 pr-2 text-black">Média</td><td className="text-black">{typeof analysis.stats.nok.torque.mean === 'number' ? analysis.stats.nok.torque.mean.toFixed(2) : 'N/A'}</td></tr>
            <tr className="border-b"><td className="py-2 pr-2 text-black">Mediana</td><td className="text-black">{typeof analysis.stats.nok.torque.median === 'number' ? analysis.stats.nok.torque.median.toFixed(2) : 'N/A'}</td></tr>
            <tr><td className="py-2 pr-2 text-black">Desvio Padrão</td><td className="text-black">{typeof analysis.stats.nok.torque.stddev === 'number' ? analysis.stats.nok.torque.stddev.toFixed(2) : 'N/A'}</td></tr>
          </tbody>
        </table>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
        <h3 className="text-black font-semibold mb-4 text-center text-slate-700">Estatísticas de Ângulo (OK)</h3>
        <table className="w-full text-left">
          <tbody>
            <tr className="border-b"><td className="py-2 pr-2 text-black">Contagem</td><td className="text-black">{analysis.stats.ok.angle.count}</td></tr>
            <tr className="border-b"><td className="py-2 pr-2 text-black">Média</td><td className="text-black">{typeof analysis.stats.ok.angle.mean === 'number' ? analysis.stats.ok.angle.mean.toFixed(2) : 'N/A'}</td></tr>
            <tr className="border-b"><td className="py-2 pr-2 text-black">Mediana</td><td className="text-black">{typeof analysis.stats.ok.angle.median === 'number' ? analysis.stats.ok.angle.median.toFixed(2) : 'N/A'}</td></tr>
            <tr className="border-b"><td className="py-2 pr-2 text-black">Desvio Padrão</td><td className="text-black">{typeof analysis.stats.ok.angle.stddev === 'number' ? analysis.stats.ok.angle.stddev.toFixed(2) : 'N/A'}</td></tr>
            <tr className="border-b"><td className="py-2 pr-2 text-black">Assimetria (Skewness)</td><td className="text-black">{typeof analysis.stats.ok.angle.skewness === 'number' ? analysis.stats.ok.angle.skewness.toFixed(3) : 'N/A'}</td></tr>
            <tr><td className="py-2 pr-2 text-black">Curtose (Kurtosis)</td><td className="text-black">{typeof analysis.stats.ok.angle.kurtosis === 'number' ? analysis.stats.ok.angle.kurtosis.toFixed(3) : 'N/A'}</td></tr>
          </tbody>
        </table>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
        <h3 className="text-black font-semibold mb-4 text-center text-slate-700">Estatísticas de Ângulo (NOK)</h3>
        <table className="w-full text-left">
          <tbody>
            <tr className="border-b"><td className="py-2 pr-2 text-black">Contagem</td><td className="text-black">{analysis.stats.nok.angle.count}</td></tr>
            <tr className="border-b"><td className="py-2 pr-2 text-black">Média</td><td className="text-black">{typeof analysis.stats.nok.angle.mean === 'number' ? analysis.stats.nok.angle.mean.toFixed(2) : 'N/A'}</td></tr>
            <tr className="border-b"><td className="py-2 pr-2 text-black">Mediana</td><td className="text-black">{typeof analysis.stats.nok.angle.median === 'number' ? analysis.stats.nok.angle.median.toFixed(2) : 'N/A'}</td></tr>
            <tr><td className="py-2 pr-2 text-black">Desvio Padrão</td><td className="text-black">{typeof analysis.stats.nok.angle.stddev === 'number' ? analysis.stats.nok.angle.stddev.toFixed(2) : 'N/A'}</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
});

// Componente Memoizado para os Gráficos
const MemoizedCharts = React.memo(function MemoizedCharts({ analysis, chartData }: { analysis: AnalysisResult, chartData: any }) {
  const { torqueHistogram, angleHistogram, nokTorqueHistogram, nokAngleHistogram, torqueNormalCurveData, angleNormalCurveData } = chartData;

  return (
    <>
      {/* Cartas de Controle */}
      <div className="w-full mt-8 bg-slate-100/60 p-6 rounded-xl border border-slate-200">
          <h2 className="text-3xl font-bold text-slate-700 text-center mb-8">Cartas de Controle</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {analysis?.controlChartData?.ok_torque?.data.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
                <h3 className="text-slate-700 font-semibold mb-2 text-center">Carta de Controle de Torque (OK)</h3>
                <Chart type='line' data={{ labels: analysis.controlChartData.ok_torque.labels, datasets: [{ label: 'Torque', data: analysis.controlChartData.ok_torque.data, borderColor: 'rgba(54, 162, 235, 1)', pointBackgroundColor: 'rgba(54, 162, 235, 1)', pointRadius: 2, fill: false }, { label: 'Média', data: Array(analysis.controlChartData.ok_torque.data.length).fill(analysis.stats.ok.torque.mean), borderColor: 'rgba(75, 192, 192, 1)', pointRadius: 0, borderWidth: 2, fill: false }, { label: 'LSC (+3σ)', data: Array(analysis.controlChartData.ok_torque.data.length).fill(typeof analysis.stats.ok.torque.mean === 'number' && typeof analysis.stats.ok.torque.stddev === 'number' ? analysis.stats.ok.torque.mean + 3 * analysis.stats.ok.torque.stddev : null), borderColor: 'rgba(255, 99, 132, 1)', borderDash: [5, 5], pointRadius: 0, borderWidth: 2, fill: false }, { label: 'LIC (-3σ)', data: Array(analysis.controlChartData.ok_torque.data.length).fill(typeof analysis.stats.ok.torque.mean === 'number' && typeof analysis.stats.ok.torque.stddev === 'number' ? analysis.stats.ok.torque.mean - 3 * analysis.stats.ok.torque.stddev : null), borderColor: 'rgba(255, 99, 132, 1)', borderDash: [5, 5], pointRadius: 0, borderWidth: 2, fill: false }] }} options={{ scales: { y: { beginAtZero: false } } }} />
              </div>
            )}
            {analysis?.controlChartData?.ok_angle?.data.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
                <h3 className="text-slate-700 font-semibold mb-2 text-center">Carta de Controle de Ângulo (OK)</h3>
                <Chart type='line' data={{ labels: analysis.controlChartData.ok_angle.labels, datasets: [{ label: 'Ângulo', data: analysis.controlChartData.ok_angle.data, borderColor: 'rgba(75, 192, 192, 1)', pointBackgroundColor: 'rgba(75, 192, 192, 1)', pointRadius: 2, fill: false }, { label: 'Média', data: Array(analysis.controlChartData.ok_angle.data.length).fill(analysis.stats.ok.angle.mean), borderColor: 'rgba(54, 162, 235, 1)', pointRadius: 0, borderWidth: 2, fill: false }, { label: 'LSC (+3σ)', data: Array(analysis.controlChartData.ok_angle.data.length).fill(typeof analysis.stats.ok.angle.mean === 'number' && typeof analysis.stats.ok.angle.stddev === 'number' ? analysis.stats.ok.angle.mean + 3 * analysis.stats.ok.angle.stddev : null), borderColor: 'rgba(255, 99, 132, 1)', borderDash: [5, 5], pointRadius: 0, borderWidth: 2, fill: false }, { label: 'LIC (-3σ)', data: Array(analysis.controlChartData.ok_angle.data.length).fill(typeof analysis.stats.ok.angle.mean === 'number' && typeof analysis.stats.ok.angle.stddev === 'number' ? analysis.stats.ok.angle.mean - 3 * analysis.stats.ok.angle.stddev : null), borderColor: 'rgba(255, 99, 132, 1)', borderDash: [5, 5], pointRadius: 0, borderWidth: 2, fill: false }] }} options={{ scales: { y: { beginAtZero: false } } }} />
              </div>
            )}
            {analysis?.controlChartData?.noktorque?.data.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
                <h3 className="text-slate-700 font-semibold mb-2 text-center">Carta de Controle de Torque (NOK)</h3>
                <Chart type='line' data={{ labels: analysis.controlChartData.noktorque.labels, datasets: [{ label: 'Torque NOK', data: analysis.controlChartData.noktorque.data, borderColor: 'rgba(255, 99, 132, 1)', pointBackgroundColor: 'rgba(255, 99, 132, 1)', pointRadius: 2, fill: false }, { label: 'Média', data: Array(analysis.controlChartData.noktorque.data.length).fill(analysis.stats.nok.torque.mean), borderColor: 'rgba(255, 159, 64, 1)', pointRadius: 0, borderWidth: 2, fill: false }] }} options={{ scales: { y: { beginAtZero: false } } }} />
              </div>
            )}
            {analysis?.controlChartData?.nokangle?.data.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
                <h3 className="text-slate-700 font-semibold mb-2 text-center">Carta de Controle de Ângulo (NOK)</h3>
                <Chart type='line' data={{ labels: analysis.controlChartData.nokangle.labels, datasets: [{ label: 'Ângulo NOK', data: analysis.controlChartData.nokangle.data, borderColor: 'rgba(255, 99, 132, 1)', pointBackgroundColor: 'rgba(255, 99, 132, 1)', pointRadius: 2, fill: false }, { label: 'Média', data: Array(analysis.controlChartData.nokangle.data.length).fill(analysis.stats.nok.angle.mean), borderColor: 'rgba(255, 159, 64, 1)', pointRadius: 0, borderWidth: 2, fill: false }] }} options={{ scales: { y: { beginAtZero: false } } }} />
              </div>
            )}
          </div>
      </div>

      {/* Histogramas */}
      <div className="w-full mt-8 bg-slate-100/60 p-6 rounded-xl border border-slate-200">
        <h2 className="text-3xl font-bold text-slate-700 text-center mb-8">Histogramas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {torqueHistogram && torqueHistogram.counts.length > 0 && <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200"><h3 className="text-slate-700 font-semibold mb-2 text-center">Histograma de Torque (OK)</h3><Bar data={{ labels: torqueHistogram.labels, datasets: [{ label: 'Contagem', data: torqueHistogram.counts, backgroundColor: 'rgba(54, 162, 235, 0.6)' }] }} options={{ scales: { y: { beginAtZero: true } } }} /></div>}
          {angleHistogram && angleHistogram.counts.length > 0 && <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200"><h3 className="text-slate-700 font-semibold mb-2 text-center">Histograma de Ângulo (OK)</h3><Bar data={{ labels: angleHistogram.labels, datasets: [{ label: 'Contagem', data: angleHistogram.counts, backgroundColor: 'rgba(75, 192, 192, 0.6)' }] }} options={{ scales: { y: { beginAtZero: true } } }} /></div>}
          {nokTorqueHistogram && nokTorqueHistogram.counts.length > 0 && <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200"><h3 className="text-slate-700 font-semibold mb-2 text-center">Histograma de Torque (NOK)</h3><Bar data={{ labels: nokTorqueHistogram.labels, datasets: [{ label: 'Contagem', data: nokTorqueHistogram.counts, backgroundColor: 'rgba(255, 99, 132, 0.6)' }] }} options={{ scales: { y: { beginAtZero: true } } }} /></div>}
          {nokAngleHistogram && nokAngleHistogram.counts.length > 0 && <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200"><h3 className="text-slate-700 font-semibold mb-2 text-center">Histograma de Ângulo (NOK)</h3><Bar data={{ labels: nokAngleHistogram.labels, datasets: [{ label: 'Contagem', data: nokAngleHistogram.counts, backgroundColor: 'rgba(255, 159, 64, 0.6)' }] }} options={{ scales: { y: { beginAtZero: true } } }} /></div>}
        </div>
      </div>

      {/* Curvas de Distribuição Normal */}
      {(torqueNormalCurveData || angleNormalCurveData) && (
        <div className="w-full mt-8 bg-slate-100/60 p-6 rounded-xl border border-slate-200">
          <h2 className="text-3xl font-bold text-slate-700 text-center mb-8">Curvas de Distribuição Normal</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {torqueNormalCurveData && (
              <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
                <h3 className="text-slate-700 font-semibold mb-2 text-center">Curva Normal de Torque (OK)</h3>
                <Chart type='line' data={{ labels: torqueNormalCurveData.labels, datasets: [{ label: 'Densidade de Probabilidade', data: torqueNormalCurveData.data, borderColor: 'rgba(54, 162, 235, 1)', backgroundColor: 'rgba(54, 162, 235, 0.2)', fill: true, tension: 0.4, pointRadius: 0, }] }} options={{ scales: { x: { type: 'category', title: { display: true, text: 'Torque' } }, y: { beginAtZero: true, title: { display: true, text: 'Densidade de Probabilidade' } } }, plugins: { legend: { display: false } } }} />
              </div>
            )}
            {angleNormalCurveData && (
              <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
                <h3 className="text-slate-700 font-semibold mb-2 text-center">Curva Normal de Ângulo (OK)</h3>
                <Chart type='line' data={{ labels: angleNormalCurveData.labels, datasets: [{ label: 'Densidade de Probabilidade', data: angleNormalCurveData.data, borderColor: 'rgba(75, 192, 192, 1)', backgroundColor: 'rgba(75, 192, 192, 0.2)', fill: true, tension: 0.4, pointRadius: 0, }] }} options={{ scales: { x: { type: 'category', title: { display: true, text: 'Ângulo' } }, y: { beginAtZero: true, title: { display: true, text: 'Densidade de Probabilidade' } } }, plugins: { legend: { display: false } } }} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Gráficos de Boxplot */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        {analysis?.rawData.ok_torque?.length > 0 && <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
          <h3 className="text-slate-700 font-semibold mb-2 text-center">Boxplot de Torque (OK)</h3>
          <Chart type='boxplot' data={{ labels: ['Torque OK'], datasets: [{ label: 'Torque (OK)', data: [analysis.rawData.ok_torque], backgroundColor: 'rgba(54, 162, 235, 0.6)', borderColor: 'rgba(54, 162, 235, 1)' }] }} />
        </div>}
        {analysis?.rawData.nok_torque?.length > 0 && <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
          <h3 className="text-slate-700 font-semibold mb-2 text-center">Boxplot de Torque (NOK)</h3>
          <Chart type='boxplot' data={{ labels: ['Torque NOK'], datasets: [{ label: 'Torque (NOK)', data: [analysis.rawData.nok_torque], backgroundColor: 'rgba(255, 99, 132, 0.6)', borderColor: 'rgba(255, 99, 132, 1)' }] }} />
        </div>}
        {analysis?.rawData.ok_angle?.length > 0 && <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
          <h3 className="text-slate-700 font-semibold mb-2 text-center">Boxplot de Ângulo (OK)</h3>
          <Chart type='boxplot' data={{ labels: ['Ângulo OK'], datasets: [{ label: 'Ângulo (OK)', data: [analysis.rawData.ok_angle], backgroundColor: 'rgba(75, 192, 192, 0.6)', borderColor: 'rgba(75, 192, 192, 1)' }] }} />
        </div>}
        {analysis?.rawData.nok_angle?.length > 0 && <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
          <h3 className="text-slate-700 font-semibold mb-2 text-center">Boxplot de Ângulo (NOK)</h3>
          <Chart type='boxplot' data={{ labels: ['Ângulo NOK'], datasets: [{ label: 'Ângulo (NOK)', data: [analysis.rawData.nok_angle], backgroundColor: 'rgba(255, 159, 64, 0.6)', borderColor: 'rgba(255, 159, 64, 1)' }] }} />
        </div>}
      </div>
    </>
  );
});

export default function Page() {
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<'select' | 'map' | 'analyzing'>('select');
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState({
    torqueStatus: '',
    torqueValue: '',
    angleStatus: '',
    angleValue: ''
  });
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Estados para Cp e Cpk
  const [torqueLSE, setTorqueLSE] = useState('');
  const [torqueLIE, setTorqueLIE] = useState('');
  const [angleLSE, setAngleLSE] = useState('');
  const [angleLIE, setAngleLIE] = useState('');
  const [processCapacity, setProcessCapacity] = useState<{
    torque: { cp: number | string; cpk: number | string } | null;
    angle: { cp: number | string; cpk: number | string } | null;
  } | null>(null);
  const [processPerformance, setProcessPerformance] = useState<{
    torque: { pp: number | string; ppk: number | string } | null;
    angle: { pp: number | string; ppk: number | string } | null;
  } | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setFile(selectedFile || null);

    if (selectedFile) {
      setAnalysis(null);
      setError(null);
      setHeaders([]);
      setMapping({
        torqueStatus: '',
        torqueValue: '',
        angleStatus: '',
        angleValue: ''
      });

      setIsLoading(true);
      const formData = new FormData();
      formData.append("csvfile", selectedFile);

      try {
        const response = await fetch("/api/get-headers", {
          method: "POST",
          body: formData,
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || "Não foi possível ler os cabeçalhos.");
        }
        setHeaders(result.headers);
        setStep('map');
      } catch (err: any) {
        setError(err.message);
        setStep('select');
      } finally {
        setIsLoading(false);
      }
    } else {
      setStep('select');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) {
      setError("Por favor, selecione um arquivo.");
      return;
    }
    if (!mapping.torqueValue || !mapping.angleValue) {
      setError("Por favor, mapeie pelo menos as colunas de Valor do Torque e Valor do Ângulo.");
      return;
    }

    setIsLoading(true);
    setStep('analyzing');
    setError(null);
    setAnalysis(null);

    const formData = new FormData();
    formData.append("csvfile", file);
    formData.append("torqueStatusColumn", mapping.torqueStatus);
    formData.append("torqueValueColumn", mapping.torqueValue);
    formData.append("angleStatusColumn", mapping.angleStatus);
    formData.append("angleValueColumn", mapping.angleValue);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Ocorreu um erro na análise.");
      }

      setAnalysis(result);
      setStep('select'); // Volta ao início após a análise
    } catch (err: any) {
      setError(err.message);
      setStep('map'); // Volta para o mapeamento em caso de erro
    } finally {
      setIsLoading(false);
    }
  };

  const handleCalculateCpk = () => {
    if (!analysis) return;

    const { ok, all } = analysis.stats;
    const { torque: torqueOk, angle: angleOk } = ok;

    const results: {
      torque: { cp: string | number; cpk: string | number } | null;
      angle: { cp: string | number; cpk: string | number } | null;
    } = {
      torque: null,
      angle: null,
    };

    const performanceResults: {
      torque: { pp: string | number; ppk: string | number } | null;
      angle: { pp: string | number; ppk: string | number } | null;
    } = {
      torque: null,
      angle: null,
    };

    // Cálculo para Torque
    const tLSE = parseFloat(torqueLSE.replace(',', '.'));
    const tLIE = parseFloat(torqueLIE.replace(',', '.'));
    if (!isNaN(tLSE) && !isNaN(tLIE) && typeof torqueOk.mean === 'number' && typeof torqueOk.stddev === 'number' && torqueOk.stddev > 0) {
      const cp = (tLSE - tLIE) / (6 * torqueOk.stddev);
      const cpk = Math.min((tLSE - torqueOk.mean) / (3 * torqueOk.stddev), (torqueOk.mean - tLIE) / (3 * torqueOk.stddev));
      results.torque = { cp: cp.toFixed(2), cpk: cpk.toFixed(2) };
    } else {
      results.torque = { cp: 'N/A', cpk: 'N/A' };
    }
    if (!isNaN(tLSE) && !isNaN(tLIE) && typeof all.torque.mean === 'number' && typeof all.torque.stddev === 'number' && all.torque.stddev > 0) {
      const pp = (tLSE - tLIE) / (6 * all.torque.stddev);
      const ppk = Math.min((tLSE - all.torque.mean) / (3 * all.torque.stddev), (all.torque.mean - tLIE) / (3 * all.torque.stddev));
      performanceResults.torque = { pp: pp.toFixed(2), ppk: ppk.toFixed(2) };
    } else {
      performanceResults.torque = { pp: 'N/A', ppk: 'N/A' };
    }

    // Cálculo para Ângulo
    const aLSE = parseFloat(angleLSE.replace(',', '.'));
    const aLIE = parseFloat(angleLIE.replace(',', '.'));
    if (!isNaN(aLSE) && !isNaN(aLIE) && typeof angleOk.mean === 'number' && typeof angleOk.stddev === 'number' && angleOk.stddev > 0) {
      const cp = (aLSE - aLIE) / (6 * angleOk.stddev);
      const cpk = Math.min((aLSE - angleOk.mean) / (3 * angleOk.stddev), (angleOk.mean - aLIE) / (3 * angleOk.stddev));
      results.angle = { cp: cp.toFixed(2), cpk: cpk.toFixed(2) };
    } else {
      results.angle = { cp: 'N/A', cpk: 'N/A' };
    }
    if (!isNaN(aLSE) && !isNaN(aLIE) && typeof all.angle.mean === 'number' && typeof all.angle.stddev === 'number' && all.angle.stddev > 0) {
      const pp = (aLSE - aLIE) / (6 * all.angle.stddev);
      const ppk = Math.min((aLSE - all.angle.mean) / (3 * all.angle.stddev), (all.angle.mean - aLIE) / (3 * all.angle.stddev));
      performanceResults.angle = { pp: pp.toFixed(2), ppk: ppk.toFixed(2) };
    } else {
      performanceResults.angle = { pp: 'N/A', ppk: 'N/A' };
    }

    setProcessCapacity(results);
    setProcessPerformance(performanceResults);
  };

  const handleDownload = async (format: 'pdf' | 'png' | 'jpg') => {
    if (!resultsRef.current) return;

    // Workaround for html2canvas oklch color error with Tailwind CSS
    // This patches the imported html2canvas object directly.
    const h2c = html2canvas as any;
    if (h2c.Color && !h2c.Color.colorParsers.oklch) {
      h2c.Color.colorParsers.oklch = (val: string) => {
        return { r: 0, g: 0, b: 0, a: 0 }; // Return transparent for oklch
      };
    }

    const downloadButtons = resultsRef.current.querySelector('#download-buttons');
    if (downloadButtons) {
      (downloadButtons as HTMLElement).style.display = 'none';
    }

    const canvas = await html2canvas(resultsRef.current, {
      scale: 2, // Aumenta a resolução para melhor qualidade
      useCORS: true,
      backgroundColor: '#f8fafc'
    });

    // Restaura a visibilidade dos botões
    if (downloadButtons) {
      (downloadButtons as HTMLElement).style.display = 'flex';
    }

    if (format === 'pdf') {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`analise-torquescope.pdf`);
    } else {
      const image = canvas.toDataURL(format === 'png' ? 'image/png' : 'image/jpeg', 1.0);
      const link = document.createElement('a');
      link.href = image;
      link.download = `analise-torquescope.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Limpa os resultados de Cpk quando um novo arquivo é analisado
  const resetCpkAnalysis = () => {
    setProcessCapacity(null);
    setProcessPerformance(null);
    setTorqueLSE(''); setTorqueLIE('');
    setAngleLSE(''); setAngleLIE('');
  };

  // Memoize os cálculos pesados para evitar re-execução em cada render
  const chartData = useMemo(() => {
    if (!analysis) {
      return { torqueHistogram: null, angleHistogram: null, nokTorqueHistogram: null, nokAngleHistogram: null, torqueNormalCurveData: null, angleNormalCurveData: null };
    }
  
    const torqueNormalData = typeof analysis.stats.ok.torque.mean === 'number' && typeof analysis.stats.ok.torque.stddev === 'number' && analysis.rawData.ok_torque.length > 0
      ? calculateNormalDistributionData(
        analysis.stats.ok.torque.mean,
        analysis.stats.ok.torque.stddev,
        Math.min(...analysis.rawData.ok_torque),
        Math.max(...analysis.rawData.ok_torque)
      )
      : null;
    
    const angleNormalData = typeof analysis.stats.ok.angle.mean === 'number' && typeof analysis.stats.ok.angle.stddev === 'number' && analysis.rawData.ok_angle.length > 0
      ? calculateNormalDistributionData(
        analysis.stats.ok.angle.mean,
        analysis.stats.ok.angle.stddev,
        Math.min(...analysis.rawData.ok_angle),
        Math.max(...analysis.rawData.ok_angle)
      )
      : null;

    return {
      torqueHistogram: createHistogramData(analysis.rawData.ok_torque),
      angleHistogram: createHistogramData(analysis.rawData.ok_angle),
      nokTorqueHistogram: createHistogramData(analysis.rawData.nok_torque),
      nokAngleHistogram: createHistogramData(analysis.rawData.nok_angle),
      torqueNormalCurveData: torqueNormalData,
      angleNormalCurveData: angleNormalData
    };
  }, [analysis]);

  return (
    <div className="min-h-screen">
      <main className="flex-grow container mx-auto p-6 md:p-12">
        <div className="w-full max-w-7xl mx-auto flex flex-col items-center gap-8">
          <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-2xl border border-slate-200">
            <h1 className="text-3xl font-bold text-slate-800 text-center mb-2">TorqueScope</h1>
            <p className="text-center text-slate-500 mb-6">Faça o upload do seu arquivo CSV para gerar estatísticas e gráficos.</p>

            <form onSubmit={handleSubmit} className="flex flex-col items-center gap-6">
              {/* Passo 1: Selecionar Arquivo */}
              <div className="w-full">
                <label htmlFor="csvfile-input" className="text-slate-600 font-medium mb-2 block">Passo 1: Selecione o arquivo</label>
                <input id="csvfile-input" type="file" name="csvfile" accept=".csv, text/csv" onChange={handleFileChange} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" disabled={isLoading}/>
              </div>

              {/* Passo 2: Mapear Colunas */}
              {step === 'map' && headers.length > 0 && (
                <div className="w-full p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <h3 className="text-slate-600 font-medium mb-4">Passo 2: Mapeie as colunas</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                    {[
                      { key: 'torqueStatus', label: 'Status do Torque', optional: true },
                      { key: 'torqueValue', label: 'Valor do Torque', optional: false },
                      { key: 'angleStatus', label: 'Status do Ângulo', optional: true },
                      { key: 'angleValue', label: 'Valor do Ângulo', optional: false },
                    ].map((item) => (
                      <div key={item.key}>
                        <label htmlFor={`map-${item.key}`} className="block text-sm font-medium text-slate-700">
                          {item.label}
                          {item.optional && <span className="text-slate-400 font-normal"> (Opcional)</span>}
                        </label>
                        <select
                          id={`map-${item.key}`}
                          value={mapping[item.key as keyof typeof mapping]}
                          onChange={(e) => setMapping(prev => ({ ...prev, [item.key]: e.target.value }))}
                          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="">Selecione...</option>
                          {headers.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <button type="submit" disabled={isLoading || step !== 'map'} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors duration-300">
                {isLoading ? (step === 'analyzing' ? "Analisando..." : "Lendo arquivo...") : "Analisar Arquivo"}
              </button>
            </form>
          </div>

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">{error}</div>}

        {analysis && (
          <div ref={resultsRef} className="w-full mt-8 bg-slate-50 p-6 rounded-xl border border-slate-200">
            <div className="flex flex-col sm:flex-row justify-center items-center mb-8">
              <h2 className="text-3xl font-bold text-slate-700 text-center">Resultados para: <span className="text-indigo-600">{analysis.fileName}</span></h2>
            </div>
            <MemoizedStats analysis={analysis} />

            {/* Análise de Capacidade do Processo (Cp, Cpk) */}
            <div className="w-full mt-8 bg-slate-100/60 p-6 rounded-xl border border-slate-200">
              <h2 className="text-2xl font-bold text-slate-700 text-center mb-6">Capacidade e Performance do Processo</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Inputs para Torque */}
                <div className="flex flex-col gap-4 bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                  <h3 className="font-semibold text-slate-700">Especificações de Torque</h3>
                  <input type="text" placeholder="Limite Inferior (LIE)" value={torqueLIE} onChange={(e) => setTorqueLIE(e.target.value)} className="p-2 border rounded-md" />
                  <input type="text" placeholder="Limite Superior (LSE)" value={torqueLSE} onChange={(e) => setTorqueLSE(e.target.value)} className="p-2 border rounded-md" />
                </div>
                {/* Inputs para Ângulo */}
                <div className="flex flex-col gap-4 bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                  <h3 className="font-semibold text-slate-700">Especificações de Ângulo</h3>
                  <input type="text" placeholder="Limite Inferior (LIE)" value={angleLIE} onChange={(e) => setAngleLIE(e.target.value)} className="p-2 border rounded-md" />
                  <input type="text" placeholder="Limite Superior (LSE)" value={angleLSE} onChange={(e) => setAngleLSE(e.target.value)} className="p-2 border rounded-md" />
                </div>
              </div>
              <div className="text-center mt-6">
                <button onClick={handleCalculateCpk} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition-colors duration-300">
                  Calcular
                </button>
              </div>

              {processCapacity && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                  <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
                    <h3 className="text-black font-semibold mb-4 text-center text-slate-700">Capacidade (Torque)</h3>
                    <table className="w-full text-left">
                      <tbody>
                        <tr className="border-b"><td className="py-2 pr-2 text-black">Cp</td><td className="text-black font-bold">{processCapacity.torque?.cp}</td></tr>
                        <tr><td className="py-2 pr-2 text-black">Cpk</td><td className="text-black font-bold">{processCapacity.torque?.cpk}</td></tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
                    <h3 className="text-black font-semibold mb-4 text-center text-slate-700">Capacidade (Ângulo)</h3>
                    <table className="w-full text-left">
                      <tbody>
                        <tr className="border-b"><td className="py-2 pr-2 text-black">Cp</td><td className="text-black font-bold">{processCapacity.angle?.cp}</td></tr>
                        <tr><td className="py-2 pr-2 text-black">Cpk</td><td className="text-black font-bold">{processCapacity.angle?.cpk}</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {processPerformance && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                  <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
                    <h3 className="text-black font-semibold mb-4 text-center text-slate-700">Performance (Torque)</h3>
                    <table className="w-full text-left">
                      <tbody>
                        <tr className="border-b"><td className="py-2 pr-2 text-black">Pp</td><td className="text-black font-bold">{processPerformance.torque?.pp}</td></tr>
                        <tr><td className="py-2 pr-2 text-black">Ppk</td><td className="text-black font-bold">{processPerformance.torque?.ppk}</td></tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
                    <h3 className="text-black font-semibold mb-4 text-center text-slate-700">Performance (Ângulo)</h3>
                    <table className="w-full text-left">
                      <tbody>
                        <tr className="border-b"><td className="py-2 pr-2 text-black">Pp</td><td className="text-black font-bold">{processPerformance.angle?.pp}</td></tr>
                        <tr><td className="py-2 pr-2 text-black">Ppk</td><td className="text-black font-bold">{processPerformance.angle?.ppk}</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <MemoizedCharts analysis={analysis} chartData={chartData} />
          </div>
        )}
        </div>
      </main>
    </div>
  );
}