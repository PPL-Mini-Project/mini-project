import "@/styles/globals.css";
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>  
        <link rel="icon" href="/Images/icon-sm.png" />
      </head>
      <body>
        <main className="h-screen w-screen h-fit max-w-[99%] bg-gradient-to-b from-gray-900 to-gray-800">
          {children}
        </main>
      </body>
    </html>
  );
}
