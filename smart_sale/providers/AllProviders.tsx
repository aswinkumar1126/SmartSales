"use client";

import { ThemeProvider } from "@/context/theme/themeContext";
import { Provider } from "@/components/ui/provider";
import AuthProvider from "@/context/auth/AuthProvider";
import { SidebarProvider } from "@/context/layout/SideBarContext";
import DashboardLayout from "@/component/layout/DashBoardLayout";
import QueryProvider from "@/context/query/providers";

export function AllProviders({ children }: { children: React.ReactNode }) {

  return (
    <ThemeProvider>
      <Provider >
        <QueryProvider>
          <AuthProvider>

            <SidebarProvider>
              <DashboardLayout>
                {children}
              </DashboardLayout>
            </SidebarProvider>

          </AuthProvider>
        </QueryProvider>
      </Provider>
    </ThemeProvider>
  );
}
