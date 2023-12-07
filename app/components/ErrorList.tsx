export type ErrorListErrors =
  | Array<string | null | undefined>
  | null
  | undefined;

export type ErrorListProps = {
  id?: string;
  errors?: ErrorListErrors;
};

const ErrorList = ({ id, errors }: ErrorListProps) => {
  if (!errors || errors.length < 1) return null;

  return (
    <ul id={id} className="flex flex-col gap-1">
      {errors.map((error, i) => (
        <li key={i} className="text-sm text-red-600 italic">
          {error}
        </li>
      ))}
    </ul>
  );
};

export default ErrorList;
