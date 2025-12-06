'use client';

export default function TestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-green-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-green-600 mb-4">
          ✅ Redirecionamento Funcionando!
        </h1>
        <p className="text-xl">Se você está vendo esta página, o redirect funcionou!</p>
        <a href="/admin/dashboard" className="mt-4 inline-block px-6 py-3 bg-green-600 text-white rounded-lg">
          Ir para Dashboard
        </a>
      </div>
    </div>
  );
}
