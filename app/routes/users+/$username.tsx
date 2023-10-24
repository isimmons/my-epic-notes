import {
  json,
  type DataFunctionArgs,
  type MetaFunction,
} from '@remix-run/node';
import { Link, useLoaderData, useRouteError } from '@remix-run/react';
import { db } from '~/utils/db.server';
import { assertDefined, isErrorResponse } from '~/utils/misc';

export async function loader({ params }: DataFunctionArgs) {
  const user = db.user.findFirst({
    where: {
      username: { equals: params.username },
    },
  });

  assertDefined(user, 'User Not Found');

  return json({
    user: {
      username: user.username,
      name: user.name,
    },
  });
}

export type UsernameLoader = typeof loader;

export const meta: MetaFunction<typeof loader> = ({ data, params }) => {
  const displayName = data?.user.name ?? params.username;

  return [
    { title: `${displayName} | Epic Notes` },
    { name: 'description', content: `${displayName}'s Epic Notes profile` },
  ];
};

export function ErrorBoundary() {
  const error = useRouteError();

  const isError = isErrorResponse(error);

  return (
    <div className="w-full text-center p-10 bg-red-600">
      {isError && (
        <>
          <h2 className="mb-2 pt-12 text-h2 lg:mb-6">{error.status}</h2>
          <p className="whitespace-break-spaces text-sm md:text-lg">
            {error.data}
          </p>
        </>
      )}
    </div>
  );
}

export default function ProfileRoute() {
  const data = useLoaderData<typeof loader>();
  const { username, name } = data.user;

  return (
    <div className="container mb-48 mt-36">
      <h1 className="text-h1">{name ?? username}</h1>
      <Link to="notes" prefetch="intent" className="underline">
        Notes
      </Link>
    </div>
  );
}
