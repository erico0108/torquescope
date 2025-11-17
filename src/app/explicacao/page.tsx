"use client";

import React from "react";

export default function ExplicacaoPage() {
  return ( 
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-slate-800 text-center mb-4">Entendendo as Análises Estatísticas</h1>
        <p className="text-lg text-slate-600 text-center max-w-3xl mx-auto mb-12">
          Esta seção oferece explicações detalhadas sobre as métricas utilizadas para avaliar a capacidade e performance do seu processo.
        </p>

        <div className="space-y-8">
          {/* Card para Estatísticas Descritivas */}
          <div className="p-6 bg-white rounded-lg shadow-md border border-slate-200">
            <h2 className="text-2xl font-semibold text-slate-700 mb-3">Estatísticas Descritivas Básicas</h2>
            <p className="text-slate-600 mb-4">
              Estas são as métricas fundamentais que resumem seus dados:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-600">
              <li><strong>Média (Mean):</strong> A soma de todos os valores dividida pela quantidade de valores. É o "ponto de equilíbrio" dos dados.</li>
              <li><strong>Mediana (Median):</strong> O valor que se encontra exatamente no meio do conjunto de dados, quando estão em ordem crescente. 50% dos dados estão abaixo e 50% estão acima da mediana. É menos sensível a valores extremos (outliers) do que a média.</li>
              <li><strong>Desvio Padrão (Standard Deviation):</strong> Mede o grau de dispersão ou "espalhamento" dos dados em torno da média. Um desvio padrão baixo indica que os dados estão agrupados perto da média, enquanto um desvio padrão alto indica que os dados estão mais espalhados.</li>
            </ul>
          </div>

          {/* Card para Histograma e Curva Normal */}
          <div className="p-6 bg-white rounded-lg shadow-md border border-slate-200">
            <h2 className="text-2xl font-semibold text-slate-700 mb-3">Histograma e Curva de Distribuição Normal</h2>
            <p className="text-slate-600 mb-4">
              Esses gráficos ajudam a visualizar a frequência e a forma da distribuição dos seus dados.
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-600">
              <li><strong>Histograma:</strong> As barras mostram a frequência (contagem) de dados que caem dentro de cada intervalo (ou "bin"). Ele permite ver rapidamente onde a maioria dos dados se concentra e como eles estão distribuídos.</li>
              <li><strong>Curva de Distribuição Normal:</strong> Também conhecida como "curva de sino", é uma curva teórica que descreve como os dados de um processo estável e sem influências externas deveriam se comportar. Comparar seu histograma com a curva normal ajuda a avaliar se a distribuição dos seus dados é a esperada.</li>
            </ul>
          </div>

          {/* Card para Boxplot */}
          <div className="p-6 bg-white rounded-lg shadow-md border border-slate-200">
            <h2 className="text-2xl font-semibold text-slate-700 mb-3">Boxplot (Gráfico de Caixa)</h2>
            <p className="text-slate-600 mb-4">
              O Boxplot é uma forma padronizada de exibir a distribuição de dados com base em cinco números: mínimo, primeiro quartil (Q1), mediana (Q2), terceiro quartil (Q3) e máximo.
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-600">
              <li>A <strong>caixa</strong> representa o "intervalo interquartil" (IQR), que contém 50% dos dados centrais (de Q1 a Q3).</li>
              <li>A <strong>linha dentro da caixa</strong> marca a mediana.</li>
              <li>As <strong>"hastes" (whiskers)</strong> estendem-se para mostrar o alcance dos dados, geralmente excluindo os outliers.</li>
              <li>Os <strong>pontos individuais</strong> fora das hastes são considerados <strong>outliers</strong> (valores atípicos).</li>
            </ul>
          </div>

          {/* Card para Cp/Cpk vs Pp/Ppk */}
          <div className="p-6 bg-white rounded-lg shadow-md border border-slate-200">
            <h2 className="text-2xl font-semibold text-slate-700 mb-3">Capacidade (Cp, Cpk) vs. Performance (Pp, Ppk)</h2>
            <p className="text-slate-600 mb-4">
              Ambos os conjuntos de índices comparam a variação do seu processo com os limites de especificação, mas eles contam histórias diferentes:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-600">
              <li><strong>Capacidade (Cp, Cpk):</strong> Mede a variação de <strong>curto prazo</strong>, usando apenas os dados "OK". Representa o <strong>potencial</strong> do seu processo, ou seja, o quão bom ele poderia ser se estivesse perfeitamente estável e centrado.</li>
              <li><strong>Performance (Pp, Ppk):</strong> Mede a variação de <strong>longo prazo</strong>, usando todos os dados da amostra ("OK" e "NOK"). Representa como o seu processo <strong>realmente se comportou</strong>, incluindo todas as fontes de variação (como trocas de turno, ajustes de máquina, etc.).</li>
            </ul>
            <p className="mt-4 text-slate-700 font-medium"><strong>Como interpretar:</strong> Se o seu <strong>Cpk é alto</strong>, mas o <strong>Ppk é baixo</strong>, isso é um sinal de alerta. Significa que seu processo tem um bom potencial, mas algo está causando instabilidade ou descentralização ao longo do tempo.</p>
          </div>

          {/* Card para Assimetria */}
          <div className="p-6 bg-white rounded-lg shadow-md border border-slate-200">
            <h2 className="text-2xl font-semibold text-slate-700 mb-3">Assimetria (Skewness)</h2>
            <p className="text-slate-600 mb-4">
              A assimetria mede a falta de simetria na distribuição dos seus dados.
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-600">
              <li><strong>Próximo de 0:</strong> A distribuição é praticamente simétrica (como uma curva de sino).</li>
              <li><strong>Positiva (&gt; 0.5):</strong> A "cauda" da distribuição é mais longa à direita. Indica uma concentração de dados em valores mais baixos, com alguns picos altos ocasionais.</li>
              <li><strong>Negativa (&lt; -0.5):</strong> A "cauda" da distribuição é mais longa à esquerda. Indica uma concentração de dados em valores mais altos, com algumas quedas baixas ocasionais.</li>
            </ul>
          </div>
          
          {/* Card para Carta de Controle */}
          <div className="p-6 bg-white rounded-lg shadow-md border border-slate-200">
            <h2 className="text-2xl font-semibold text-slate-700 mb-3">Carta de Controle</h2>
            <p className="text-slate-600 mb-4">
              A carta de controle é uma ferramenta para monitorar a estabilidade de um processo ao longo do tempo. Ela plota os pontos de dados em sequência e inclui três linhas principais:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-600">
              <li><strong>Linha Central:</strong> Representa a média do processo.</li>
              <li><strong>Limite Superior de Controle (LSC):</strong> Geralmente definido como a média mais 3 desvios padrão (+3σ).</li>
              <li><strong>Limite Inferior de Controle (LIC):</strong> Geralmente definido como a média menos 3 desvios padrão (-3σ).</li>
            </ul>
            <p className="mt-4 text-slate-700 font-medium"><strong>Como interpretar:</strong> Um processo é considerado estatisticamente "sob controle" se todos os pontos estiverem dentro dos limites (LSC e LIC) e não apresentarem padrões não aleatórios (como 8 pontos seguidos acima da média). Pontos fora dos limites indicam "causas especiais" de variação que devem ser investigadas.</p>
          </div>

          {/* Card para Curtose */}
          <div className="p-6 bg-white rounded-lg shadow-md border border-slate-200">
            <h2 className="text-2xl font-semibold text-slate-700 mb-3">Curtose (Kurtosis)</h2>
            <p className="text-slate-600 mb-4">
              A curtose mede o quão "pontuda" ou "achatada" é a sua distribuição, o que ajuda a identificar a probabilidade de ocorrência de valores extremos (outliers). O valor exibido é o "excesso de curtose", onde 0 é a referência de uma distribuição normal.
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-600">
              <li><strong>Positiva (&gt; 1):</strong> Distribuição "pontuda" com caudas pesadas. Isso significa que há uma <strong>maior probabilidade de outliers</strong> do que em uma distribuição normal.</li>
              <li><strong>Negativa (&lt; -1):</strong> Distribuição "achatada" com caudas leves. Indica uma <strong>menor probabilidade de outliers</strong>.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}