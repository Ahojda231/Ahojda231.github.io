import "./globals.css";
import React from "react";
import AuthProvider from "@/components/AuthProvider";
import Sidebar from "@/components/Sidebar";
import FloatingParticles from "@/components/FloatingParticles";

export const metadata = {
  title: "Legacy RP",
  description: "Legacy RP web - Nejlepší MTA roleplay server v ČR",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="cs">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>
          <div className="app-layout">
            {/* Floating particles background */}
            <FloatingParticles />

            {/* Sidebar */}
            <Sidebar />

            {/* Main content area */}
            <div className="main-content">
              <main className="content-wrapper">{children}</main>

              {/* Footer */}
              <footer className="app-footer">
                <div className="footer-content">
                  <div className="footer-brand">
                    <span className="brand-text">Legacy RP</span>
                    <span className="brand-year">
                      © {new Date().getFullYear()}
                    </span>
                  </div>
                  <div className="footer-links">
                    <span>Nejlepší MTA roleplay server v České republice</span>
                  </div>
                </div>
              </footer>
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
