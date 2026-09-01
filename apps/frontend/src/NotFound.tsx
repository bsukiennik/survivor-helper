import { Link } from 'react-router';

export function NotFound(): React.JSX.Element {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-3 bg-slate-50 text-slate-700">
      <h1 className="text-lg font-semibold">Page introuvable</h1>
      <Link to="/" className="text-amber-700 underline">
        Retour à la carte
      </Link>
    </div>
  );
}
