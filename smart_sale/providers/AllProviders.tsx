"use client";

import { ThemeProvider } from "@/context/theme/themeContext";
import { Provider } from "@/components/ui/provider";
import AuthProvider from "@/context/auth/AuthProvider";
import { SidebarProvider } from "@/context/layout/SideBarContext";
import DashboardLayout from "@/component/layout/DashBoardLayout";
import QueryProvider from "@/context/query/providers";
import { PrintProvider } from "@/context/print/usePrintContext";
export function AllProviders({ children }: { children: React.ReactNode }) {

  return (
    <ThemeProvider>
      <Provider >
        <QueryProvider>
          <AuthProvider>
              <PrintProvider>
            <SidebarProvider>
              <DashboardLayout>
                {children}
              </DashboardLayout>
            </SidebarProvider>
            </PrintProvider>

          </AuthProvider>
        </QueryProvider>
      </Provider>
    </ThemeProvider>
  );
}
