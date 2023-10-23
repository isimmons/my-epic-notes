import { json, type DataFunctionArgs } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import { db } from '~/utils/db.server';
import { assertDefined } from '~/utils/misc';

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
