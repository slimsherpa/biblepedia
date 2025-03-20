import "./globals.css";
import { AuthProvider } from "@/lib/contexts/AuthContext";
import Link from "next/link";

export const metadata = {
  title: "biblepedia.io",
  description: "A scholarly Bible wiki for academic study and research",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
        <link href="https://cdn.scripture.api.bible/scripture.css" rel="stylesheet" />
        <style>
          {`
            .material-icons {
              font-size: 24px;
              font-weight: bold;
            }
          `}
        </style>
      </head>
      <body>
        <AuthProvider>
          <div className="flex items-center justify-between p-4 bg-indigo-700 text-white">
            <Link href="/" className="text-2xl font-bold">
              biblepedia.io
            </Link>
            <Link href="/debug" className="text-sm text-gray-300 hover:text-white">
              Debug
            </Link>
          </div>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
