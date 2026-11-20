import { FacebookIcon } from '@/components/ui/facebook-icon';
import { mindyContact } from '@/utils/mindy-contact';

export function FacebookLink() {
  return (
    <a
      href={mindyContact.facebook}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Facebook MinDy Coding (mở trong tab mới)"
      title="Facebook MinDy Coding"
      // Match the chat launcher's bottom offset so its panel opens above both controls.
      className="fixed bottom-[max(5.5rem,env(safe-area-inset-bottom))] left-4 z-40 flex size-14 items-center justify-center rounded-full bg-forest text-canvas shadow-lg shadow-forest/25 hover:bg-mint focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-forest sm:bottom-6 sm:left-6"
    >
      <FacebookIcon className="size-8" />
    </a>
  );
}
