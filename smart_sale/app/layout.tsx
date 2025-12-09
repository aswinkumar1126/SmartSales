import "./globals.css";
import { AllProviders } from "@/providers/AllProviders";
import { fontVariables } from "@/context/theme/font";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <body>
        <AllProviders>
            {children}
        </AllProviders>
      </body>
    </html>
  );
}
