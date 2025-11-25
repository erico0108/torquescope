"use client";

import React from "react";

export default function TutorialPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-6 md:p-12">
      <div className="w-full max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-slate-800 mb-8 text-center">Tutorial TorqueScope</h1>
        
        <div className="bg-white p-8 rounded-xl shadow-lg w-full border border-slate-200">
          <h2 className="text-2xl font-semibold text-slate-700 text-center mb-6">Como Preparar e Analisar seu Arquivo</h2>
          <ol className="list-decimal list-inside space-y-4 text-slate-600 text-lg">
              <li><b>Prepare sua Planilha:</b> Certifique-se de que sua planilha (Excel, Google Sheets, etc.) tenha uma <b>linha de cabeçalho</b> com nomes para cada coluna.</li>
              <li><b>Exporte para CSV:</b> No seu software de planilha, vá em "Arquivo" &gt; "Salvar Como" e escolha o formato <b>.csv</b> (Valores Separados por Vírgula).</li>
              <li><b>Acesse a Análise:</b> Na página principal, use o seletor de arquivo para carregar o seu arquivo .csv.</li>
              <li>
                <b>Mapeie as Colunas:</b> Após o upload, o sistema mostrará os cabeçalhos do seu arquivo. Designe quais colunas correspondem ao <b>Valor do Torque (Obrigatório)</b> e <b>Valor do Ângulo (Obrigatório)</b>.
                <div className="mt-3 text-base bg-indigo-50 p-4 rounded-md border-l-4 border-indigo-400 text-slate-700">
                  <b>O que é o Status (Opcional)?</b> A coluna de status indica se um aperto foi aprovado (OK) ou reprovado (NOK). Se seu arquivo tiver essa informação, mapeie as colunas <b>Status do Torque</b> e <b>Status do Ângulo</b> para obter uma análise separada dos dados reprovados.
                </div>
              </li>
              <li><b>Analise os Dados:</b> Com tudo mapeado, clique em "Analisar Arquivo" para gerar seus resultados, estatísticas e gráficos.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}