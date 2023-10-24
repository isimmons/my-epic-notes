import {
  isRouteErrorResponse,
  useParams,
  useRouteError,
} from '@remix-run/react';
import { type ErrorResponse } from '@remix-run/router';
import { type ReactNode } from 'react';
import { getErrorMessage } from '~/utils/misc.tsx';

type StatusHandler = (info: {
  error: ErrorResponse;
  params: Record<string, string | undefined>;
}) => ReactNode;

export type GeneralErrorBoundaryProps = {
  defaultStatusHandler?: StatusHandler;
  statusHandlers?: Record<number, StatusHandler>;
  unexpectedErrorHandler?: (error: unknown) => ReactNode;
};

export function GeneralErrorBoundary({
  defaultStatusHandler = ({ error }) => (
    <p>
      {error.status} {error.data}
    </p>
  ),
  statusHandlers,
  unexpectedErrorHandler = error => <p>{getErrorMessage(error)}</p>,
}: GeneralErrorBoundaryProps) {
  const error = useRouteError();
  const params = useParams();

  if (typeof document !== 'undefined') {
    console.error(error);
  }

  return (
    <div className="container mx-auto flex h-full w-full items-center justify-center bg-destructive p-20 text-h2 text-destructive-foreground">
      {isRouteErrorResponse(error)
        ? (statusHandlers?.[error.status] ?? defaultStatusHandler)({
            error,
            params,
          })
        : unexpectedErrorHandler(error)}
    </div>
  );
}
