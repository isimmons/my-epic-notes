import { type MetaFunction } from '@remix-run/node';
import { type NotesLoader } from './_notes';

export const meta: MetaFunction<
  null,
  {
    'routes/users+/$username_+/notes': NotesLoader;
  }
> = ({ params, matches }) => {
  const noteMatch = matches.find(
    m => m.id === 'routes/users+/$username_+/notes',
  );
  const displayName = noteMatch?.data.user.name ?? params.username;
  const noteCount = noteMatch?.data.notes.length || 0;
  const notesText = noteCount === 1 ? 'note' : 'notes';

  return [
    { title: `${displayName}'s Notes` },
    {
      name: 'description',
      content: `${noteCount} ${notesText} by: ${displayName}`,
    },
  ];
};

export default function NotesIndexRoute() {
  return (
    <div className="container pt-12">
      <p className="text-body-md">Select a note</p>
    </div>
  );
}
