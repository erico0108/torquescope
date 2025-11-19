import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";

// Configuração para a rota da API (App Router)
//export const config = {
//  maxBytes: 5 * 1024 * 1024, // Define o limite do corpo da requisição para 5MB
//};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("csvfile") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo foi enviado." }, { status: 400 });
    }

    const fileContent = await file.text();

    // Usa o PapaParse para ler apenas a primeira linha (cabeçalho)
    const parseResult = Papa.parse(fileContent, {
      preview: 1, // Analisa apenas a primeira linha
      skipEmptyLines: true,
    });

    if (parseResult.errors.length > 0) {
      throw new Error(`Erro ao processar o CSV: ${parseResult.errors[0].message}`);
    }

    const headers = parseResult.data[0] as string[];

    return NextResponse.json({ headers });

  } catch (error: any) {
    return NextResponse.json({ error: `Ocorreu um erro no servidor: ${error.message}` }, { status: 500 });
  }
}
