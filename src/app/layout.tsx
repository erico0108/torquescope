import "./globals.css";
import Header from "./Header";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`antialiased bg-gray-100 text-slate-800`}
      >
        <Header />
        {/* O conteúdo da página (children) será renderizado aqui */}
        {children}
      </body>
    </html>
  );
}
