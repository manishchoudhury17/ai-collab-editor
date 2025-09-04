import "./globals.css";
import { ReactNode } from "react";

export const metadata = {
  title: "AI Collab Editor (Demo)",
  description: "Live collaborative editor with AI chat and agent search",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="h-screen w-screen overflow-hidden bg-white text-gray-900">
        {children}
      </body>
    </html>
  );
}
