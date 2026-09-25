import { ErrorProvider } from "./providers";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <ErrorProvider>{children}</ErrorProvider>
      </body>
    </html>
  );
}