"use client"
import ReactQueryProvider from "@/components/ReactQuery/ReactQueryProvider";
import { client_id } from "@/lib/constants";
import "@/styles/globals.css";
import { ThirdwebProvider } from "@thirdweb-dev/react";
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
            <link rel="icon" href="/Images/icon-sm.png" />
          </head>
          <body>
            <main className="h-screen w-screen max-w-[99%] bg-gradient-to-b from-gray-900 to-gray-800">
              {children}
            </main>
          </body>
        </html>
      </ReactQueryProvider>
    </ThirdwebProvider>
  );
}
