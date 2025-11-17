"use client"

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();

  const linkClass = (href: string) => {
    const baseClasses = "text-lg font-medium transition-colors";
    const activeClasses = "text-indigo-300 border-b-2 border-indigo-300"; // Exemplo de estilo para link ativo
    const inactiveClasses = "hover:text-indigo-300";

    return `${baseClasses} ${pathname === href ? activeClasses : inactiveClasses}`;
  };

  return (
    <header className="bg-slate-800 text-white shadow-md">
      <div className="container mx-auto p-4 flex justify-between items-center">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            TorqueScope Web
          </h1>
        </div>
        <nav className="flex gap-4 md:gap-6">
          <Link href="/" className={linkClass('/')}>Analisar</Link>
          <Link href="/tutorial" className={linkClass('/tutorial')}>Tutorial</Link>
          <Link href="/explicacao" className={linkClass('/explicacao')}>Explicação</Link>
        </nav>
      </div>
    </header>
  );
}