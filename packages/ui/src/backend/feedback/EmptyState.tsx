export interface EmptyStateProps {
  message?: string;
}

/** The only sanctioned empty-state renderer — compose this instead of bespoke empty text. */
export function EmptyState({ message = "Nothing here yet." }: EmptyStateProps) {
  return <p className="px-3 py-6 text-center text-sm text-muted-foreground">{message}</p>;
}
