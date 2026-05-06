import { AlertTriangle } from "lucide-react";

export function ResourceGrid<T>({
  loading,
  error,
  items,
  renderItem,
  emptyState,
}: {
  loading: boolean;
  error: string | null;
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  emptyState: React.ReactNode;
}) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-48 animate-pulse rounded-[1.5rem] border border-white/60 bg-white/70"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel rounded-[1.5rem] px-5 py-4 text-sm text-rose-700">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return <>{emptyState}</>;
  }

  return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{items.map(renderItem)}</div>;
}
