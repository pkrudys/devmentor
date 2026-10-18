export interface ErrorMessageProps {
  message: string;
}

/** The only sanctioned error renderer — compose this instead of bespoke error text. */
export function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <p role="alert" className="px-3 py-6 text-center text-sm text-destructive">
      {message}
    </p>
  );
}
