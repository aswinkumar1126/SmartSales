"use client";

import { ThemeProvider } from "@/context/theme/themeContext";
import { Provider } from "@/components/ui/provider";
import AuthProvider from "@/context/auth/AuthProvider";
import { SidebarProvider } from "@/context/layout/SideBarContext";
import { DashboardLayout } from "@/pages/layout/DashBoardLayout";

export function AllProviders({ children }: { children: React.ReactNode }) {

  return (
    <ThemeProvider>
        <Provider >
          <AuthProvider>
     
            <SidebarProvider>
              <DashboardLayout>
              {children}
            </DashboardLayout>
          </SidebarProvider>
        
        </AuthProvider>
          </Provider>
    </ThemeProvider>
  );
}
