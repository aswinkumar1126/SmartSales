"use client";

import { ThemeProvider } from "@/context/theme/themeContext";
import { Provider } from "@/components/ui/provider";

export function AllProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
        <Provider >
      {children}
          </Provider>
    </ThemeProvider>
  );
}
