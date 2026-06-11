import React from 'react';

export type BlockTone =
  | 'cream'
  | 'lime'
  | 'lilac'
  | 'mint'
  | 'pink'
  | 'coral'
  | 'navy';

interface ColorBlockProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: BlockTone;
  /** When true, drop rounded corners and bleed to edges (poster mode below 768px). */
  bleed?: boolean;
  /** Reduce interior padding for inline / chat-turn contexts. */
  density?: 'comfortable' | 'compact';
}

const toneClass: Record<BlockTone, string> = {
  cream: 'bg-block-cream text-ink',
  lime:  'bg-block-lime  text-ink',
  lilac: 'bg-block-lilac text-ink',
  mint:  'bg-block-mint  text-ink',
  pink:  'bg-block-pink  text-ink',
  coral: 'bg-block-coral text-ink',
  navy:  'bg-block-navy  text-inverse-ink color-block-navy',
};

/**
 * Signature Figma color-block section. Full content-width pastel surface,
 * rounded-lg corners, generous interior padding. The defining surface of the
 * Figma marketing system — see DESIGN.md "Color-Block Sections (signature)".
 */
export function ColorBlock({
  tone = 'cream',
  bleed = false,
  density = 'comfortable',
  className,
  children,
  ...rest
}: ColorBlockProps) {
  const radius = bleed ? 'rounded-none' : 'rounded-lg';
  const padding = density === 'compact'
    ? 'px-6 py-6 md:px-10 md:py-8'
    : 'px-8 py-10 md:px-12 md:py-xxl';
  return (
    <section
      {...rest}
      className={[
        'color-block w-full',
        radius,
        padding,
        toneClass[tone],
        className ?? '',
      ].join(' ')}
    >
      {children}
    </section>
  );
}
