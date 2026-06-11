/**
 * Editorial display headline. Static render — per-character animation
 * was breaking words mid-glyph at narrow widths and added measurable
 * paint cost on every mount. Now a plain heading that respects natural
 * word-wrapping and `white-space: pre-line` for explicit `\n` breaks.
 */

interface AnimatedHeadlineProps {
  /** Plain string OR pre-split lines via `\n`. */
  text: string;
  className?: string;
  /** Kept for API compatibility — unused. */
  step?: number;
  /** Kept for API compatibility — unused. */
  startDelay?: number;
  /** Render tag. Default 'h1'. */
  as?: 'h1' | 'h2' | 'h3' | 'div' | 'p';
}

export function AnimatedHeadline({
  text,
  className,
  as: Tag = 'h1',
}: AnimatedHeadlineProps) {
  return (
    <Tag className={className} style={{ whiteSpace: 'pre-line' }}>
      {text}
    </Tag>
  );
}
