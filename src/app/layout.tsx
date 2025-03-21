import "./globals.css";
import { AuthProvider } from "@/lib/contexts/AuthContext";

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
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
