import "./globals.css";
import { AuthProvider } from "@/lib/contexts/AuthContext";

export const metadata = {
  title: "biblepedia.io - A scholarly Bible wiki",
  description: "A scholarly Bible wiki for academic study and research",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
