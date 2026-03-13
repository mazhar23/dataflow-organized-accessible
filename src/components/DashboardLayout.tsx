import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  headerExtra?: ReactNode;
}

export function DashboardLayout({ children, title, searchValue, onSearchChange, headerExtra }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between gap-4 border-b border-border/50 px-6 bg-background/80 backdrop-blur-xl shrink-0">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              <h1 className="font-display text-lg font-semibold">{title}</h1>
            </div>
            <div className="flex items-center gap-3">
              {onSearchChange && (
                <div className="relative w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search leads..."
                    value={searchValue}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-9 h-9 bg-muted/50 border-border/50"
                  />
                </div>
              )}
              {headerExtra}
            </div>
          </header>
          <main className="flex-1 p-6 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
