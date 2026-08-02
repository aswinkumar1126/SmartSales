"use client";

import { ThemeProvider } from "@/context/theme/themeContext";
import { Provider } from "@/components/ui/provider";
import AuthProvider from "@/context/auth/AuthProvider";
import { SidebarProvider } from "@/context/layout/SideBarContext";
import DashboardLayout from "@/component/layout/DashBoardLayout";
import QueryProvider from "@/context/query/providers";
import { PrintProvider } from "@/context/print/usePrintContext";
import { Toaster } from "@/components/ui/toaster";
import ProtectedRoute from "@/route/protected/ProtectedRoute";
import { PageNameProvider } from "@/context/header/PageNameContext";


export function AllProviders({ children }: { children: React.ReactNode }) {

  return (
    <ThemeProvider>
      <Provider >

        <QueryProvider>
          <AuthProvider>
            <PrintProvider>
              <SidebarProvider>
                <ProtectedRoute>
                  <PageNameProvider>
                    <DashboardLayout>
                      <Toaster />
                      {children}
                    </DashboardLayout>
                  </PageNameProvider>
                </ProtectedRoute>
              </SidebarProvider>
            </PrintProvider>

          </AuthProvider>
        </QueryProvider>
      </Provider>
    </ThemeProvider>
  );
}
