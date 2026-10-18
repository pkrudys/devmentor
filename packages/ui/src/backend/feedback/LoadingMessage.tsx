export interface LoadingMessageProps {
  message?: string;
}

/** The only sanctioned loading renderer — compose this instead of a bespoke spinner. */
export function LoadingMessage({ message = "Loading…" }: LoadingMessageProps) {
  return <p className="px-3 py-6 text-center text-sm text-muted-foreground">{message}</p>;
}
