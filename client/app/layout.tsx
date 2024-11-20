"use client"
import ReactQueryProvider from "@/components/ReactQuery/ReactQueryProvider";
import Image from "next/image";
import { client_id } from "@/lib/constants";
import "@/styles/globals.css";
import { ThirdwebProvider } from "@thirdweb-dev/react";
import Icon from "@/public/Logo.png"
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThirdwebProvider activeChain="ethereum"
      clientId={client_id}>
      <ReactQueryProvider>
        <html lang="en">
          <head>
            <link rel="icon" href={Icon.src} />
          </head>
          <body>
            <main className="h-screen w-full max-w-[99%] bg-gradient-to-b from-gray-900 to-gray-800">
              {children}
            </main>
          </body>
        </html>
      </ReactQueryProvider>
    </ThirdwebProvider>
  );
}
