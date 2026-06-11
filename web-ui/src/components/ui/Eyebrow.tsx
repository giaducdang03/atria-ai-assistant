import React from 'react';

interface EyebrowProps extends React.HTMLAttributes<HTMLSpanElement> {
  as?: 'span' | 'div' | 'p';
}

/**
 * Mono uppercase category label — Figma `{typography.eyebrow}` / `{typography.caption}`.
 * Reserved for taxonomy, never used for body copy.
 */
export function Eyebrow({ as: Tag = 'span', className, children, ...rest }: EyebrowProps) {
  return (
    <Tag
      {...rest}
      className={[
        'font-mono uppercase tracking-[0.54px] text-[12px] leading-none',
        'text-ink/70',
        className ?? '',
      ].join(' ')}
    >
      {children}
    </Tag>
  );
}
