import { NextRequest, NextResponse } from "next/server";
import Papa, { ParseError, ParseStepResult } from "papaparse";

// --- Funções de Cálculo Estatístico ---

function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

function calculateStandardDeviation(values: number[], mean: number): number {
  if (values.length < 2) return 0;
  const sumOfSquares = values.reduce((acc, val) => acc + (val - mean) ** 2, 0);
  return Math.sqrt(sumOfSquares / (values.length - 1)); // Desvio padrão amostral
}

function calculateSkewness(values: number[], mean: number, stddev: number): number {
  if (values.length < 3 || stddev === 0) return 0;
  const n = values.length;
  const sumOfCubes = values.reduce((acc, val) => acc + Math.pow(val - mean, 3), 0);
  return (n / ((n - 1) * (n - 2))) * (sumOfCubes / Math.pow(stddev, 3));
}

function calculateKurtosis(values: number[], mean: number, stddev: number): number {
  if (values.length < 4 || stddev === 0) return 0;
  const n = values.length;
  const sumOfFourth = values.reduce((acc, val) => acc + Math.pow(val - mean, 4), 0);
  const term1 = (n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3));
  const term2 = sumOfFourth / Math.pow(stddev, 4);
  const term3 = (3 * Math.pow(n - 1, 2)) / ((n - 2) * (n - 3));
  return term1 * term2 - term3; // Excesso de curtose
}

function calculateStats(values: number[]) {
  if (values.length === 0) {
    return { count: 0, mean: null, median: null, stddev: null, skewness: null, kurtosis: null };
  }
  const mean = values.reduce((acc, val) => acc + val, 0) / values.length;
  const stddev = calculateStandardDeviation(values, mean);
  return {
    count: values.length,
    mean: mean,
    median: calculateMedian(values),
    stddev: stddev,
    skewness: calculateSkewness(values, mean, stddev),
    kurtosis: calculateKurtosis(values, mean, stddev),
  };
}

// --- Rota da API ---

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("csvfile") as File | null;

    // Recebe o mapeamento das colunas
    const torqueStatusColumn = formData.get("torqueStatusColumn") as string | null;
    const torqueValueColumn = formData.get("torqueValueColumn") as string | null;
    const angleStatusColumn = formData.get("angleStatusColumn") as string | null;
    const angleValueColumn = formData.get("angleValueColumn") as string | null;

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo foi enviado." }, { status: 400 });
    }

    if (!torqueStatusColumn || !torqueValueColumn || !angleStatusColumn || !angleValueColumn) {
      return NextResponse.json({ error: "Mapeamento de colunas incompleto." }, { status: 400 });
    }

    const fileContent = await file.text();

    // Define um tipo para os registros do CSV para maior segurança
    type CsvRecord = { [key: string]: string };

    const rawData = await new Promise<{
      ok_torque: number[];
      ok_angle: number[];
      nok_torque: number[];
      nok_angle: number[];
    }>((resolve, reject) => {
        const data = { ok_torque: [] as number[], ok_angle: [] as number[], nok_torque: [] as number[], nok_angle: [] as number[] };
        
        Papa.parse<CsvRecord>(fileContent, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: false,
          step: (result: ParseStepResult<CsvRecord>) => {
            const record = result.data;
            const torqueStatus = record[torqueStatusColumn]?.trim().toUpperCase();
            const torqueValueStr = record[torqueValueColumn]?.replace(",", ".");
            const angleStatus = record[angleStatusColumn]?.trim().toUpperCase();
            const angleValueStr = record[angleValueColumn]?.replace(",", ".");

            const finalTorque = parseFloat(torqueValueStr);
            const finalAngle = parseFloat(angleValueStr);

            // Processa Torque
            if (torqueStatus === "OK" && !isNaN(finalTorque) && finalTorque >= 0) {
              data.ok_torque.push(finalTorque);
            } else if (torqueStatus !== "OK" && !isNaN(finalTorque) && finalTorque >= 0) {
              data.nok_torque.push(finalTorque);
            }

            // Processa Ângulo
            if (angleStatus === "OK" && !isNaN(finalAngle) && finalAngle >= -250) {
              data.ok_angle.push(finalAngle);
            } else if (angleStatus !== "OK" && !isNaN(finalAngle) && finalAngle >= -250) {
              data.nok_angle.push(finalAngle);
            }
          },
          complete: () => resolve(data),
          error: (error: Error) => reject(new Error(`Erro ao processar o CSV: ${error.message}`)),
        });
    });

    const analysisResults = {
      ok: {
        torque: calculateStats(rawData.ok_torque),
        angle: calculateStats(rawData.ok_angle),
      },
      nok: {
        torque: calculateStats(rawData.nok_torque),
        angle: calculateStats(rawData.nok_angle),
      },
      all: {
        torque: calculateStats([...rawData.ok_torque, ...rawData.nok_torque]),
        angle: calculateStats([...rawData.ok_angle, ...rawData.nok_angle]),
      },
      all_torque: [...rawData.ok_torque, ...rawData.nok_torque],
      all_angle: [...rawData.ok_angle, ...rawData.nok_angle],
    };

    const controlChartData = {
      torque: { labels: rawData.ok_torque.map((_, i) => (i + 1).toString()), data: rawData.ok_torque },
      angle: { labels: rawData.ok_angle.map((_, i) => (i + 1).toString()), data: rawData.ok_angle },
    };

    return NextResponse.json({ stats: analysisResults, rawData, controlChartData, fileName: file.name });

  } catch (error: unknown) {
    console.error("Erro na API /api/analyze:", error);
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
    return NextResponse.json({ error: `Ocorreu um erro no servidor: ${errorMessage}` }, { status: 500 });
  }
}