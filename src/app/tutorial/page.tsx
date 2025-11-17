"use client";

import React from "react";

export default function TutorialPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
      <h1 className="text-4xl font-bold text-blue-700 mb-4">Página de Tutorial</h1>
      <p className="text-lg text-gray-700 text-center max-w-2xl">
        Bem-vindo à página de tutorial! Aqui você encontrará guias e informações úteis.
      </p>
      <div className="mt-8 p-6 bg-white rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Primeiros Passos</h2>
        <p className="text-gray-600">
          Siga as instruções para começar a usar nossa aplicação.
        </p>
        <ol className="list-decimal list-inside space-y-2 mt-4 text-gray-600">
            <li>Baixe a planilha como um arquivo <strong>CSV</strong>.</li>
            <li>Abra o site e selecione o arquivo na página de análise.</li>
        </ol>
      </div>
    </div>
  );
}