import { Database } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
}

export function EmptyState({ title = "No leads found", description = "Try adjusting your filters or upload some data to get started." }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="h-16 w-16 rounded-2xl bg-muted/60 flex items-center justify-center mb-4">
        <Database className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="font-display font-semibold text-lg mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground text-center max-w-xs">{description}</p>
    </div>
  );
}
