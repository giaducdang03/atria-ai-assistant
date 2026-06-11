import type { Message } from '../../types';

export function ImageMessage({ message }: { message: Message }) {
  if (!message.image_src) return null;
  return (
    <div className="my-3 max-w-lg">
      <div className="rounded-lg overflow-hidden border border-border-300/15 bg-bg-000">
        <img
          src={message.image_src}
          alt={message.image_caption || 'Image from assistant'}
          className="block w-full h-auto"
        />
        {message.image_caption && (
          <div className="px-3 py-2 text-sm text-text-300 border-t border-border-300/15">
            {message.image_caption}
          </div>
        )}
      </div>
    </div>
  );
}
