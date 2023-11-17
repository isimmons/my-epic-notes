import {
  json,
  type DataFunctionArgs,
  type MetaFunction,
} from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import { GeneralErrorBoundary } from '~/components';
import { Button } from '~/components/ui';
import { prisma } from '~/utils/db.server';
import { assertDefined, getUserImgSrc } from '~/utils/misc';

export async function loader({ params }: DataFunctionArgs) {
  const user = await prisma.user.findUnique({
    select: {
      name: true,
      username: true,
      createdAt: true,
      image: { select: { id: true } },
    },
    where: { username: params.username },
  });

  assertDefined(user, 'User Not Found');

  return json({ user });
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
  return (
    <GeneralErrorBoundary
      statusHandlers={{
        404: ({ params }) => (
          <p>{params.username}??? We don't know that fool!</p>
        ),
      }}
    />
  );
}

export default function ProfileRoute() {
  const data = useLoaderData<typeof loader>();
  const user = data.user;
  const userDisplayName = user.name ?? user.username;
  const userJoinedDate = new Date(user.createdAt).toLocaleDateString();

  return (
    <div className="container mb-48 mt-36 flex flex-col items-center justify-center">
      <div className="h-4" />
      <div className="container flex flex-col items-center rounded-3xl bg-muted p-12">
        <div className="relative w-52">
          <div className="absolute -top-40">
            <div className="relative">
              <img
                src={getUserImgSrc(data.user.image?.id)}
                alt={userDisplayName}
                className="h-52 w-52 rounded-full object-cover"
              />
            </div>
          </div>
        </div>

        <div className="h-20" />

        <div className="flex flex-col items-center">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <h1 className="text-center text-h2">{userDisplayName}</h1>
          </div>
          <p className="mt-2 text-center text-muted-foreground">
            Joined {userJoinedDate}
          </p>
          <div className="mt-10 flex gap-4">
            <Button asChild>
              <Link to="notes" prefetch="intent">
                {userDisplayName}'s notes
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
