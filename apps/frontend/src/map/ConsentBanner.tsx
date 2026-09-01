import { useEffect, useRef } from 'react';

interface ConsentBannerProps {
  onAccept: () => void;
  onDecline: () => void;
}

/**
 * Shown before any `navigator.geolocation` call (FR23). Declining never
 * blocks browsing — the map stays on its default France-wide view.
 */
export function ConsentBanner({ onAccept, onDecline }: ConsentBannerProps): React.JSX.Element {
  const headingRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    // Moves focus to the notice as it appears, so keyboard/screen-reader
    // users get a cue it exists rather than relying on stumbling into it.
    headingRef.current?.focus();
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="consent-heading"
      aria-describedby="consent-description"
      className="flex flex-col gap-2 border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <p id="consent-heading" tabIndex={-1} ref={headingRef} className="font-medium outline-none">
          Utiliser votre position pour centrer la carte ?
        </p>
        <p id="consent-description" className="text-amber-800">
          Avec votre accord, nous utilisons votre position uniquement pour centrer la carte près de
          chez vous — elle n'est pas envoyée à nos serveurs ni conservée. Vous pouvez refuser et
          continuer à parcourir la carte de France librement.
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={onDecline}
          className="rounded border border-amber-300 bg-white px-3 py-1.5 font-medium text-amber-900"
        >
          Refuser
        </button>
        <button
          type="button"
          onClick={onAccept}
          className="rounded bg-amber-600 px-3 py-1.5 font-medium text-white"
        >
          Accepter
        </button>
      </div>
    </div>
  );
}
