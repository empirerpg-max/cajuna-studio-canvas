import { motion } from 'framer-motion';

type Props = {
  src: string;          /* e.g. '/macoteprincipal.svg' */
  alt?: string;
  size?: number;        /* px, used for both width and height */
  float?: boolean;      /* gentle float animation */
  speedLines?: boolean; /* retro speed-line effect (hero mascot) */
  className?: string;
};

/**
 * Wrapper that animates a mascot SVG/PNG asset.
 * Preserves the original artwork 100% — no modifications to the SVG itself.
 *
 * float=true  → gentle up/down float + slight rotate (loop)
 * speedLines  → renders retro horizontal speed-line SVG behind the mascot
 */
export function CajuMascot({
  src,
  alt = 'Cajuna mascot',
  size = 220,
  float = true,
  speedLines = false,
  className = '',
}: Props) {
  const floatAnim = float
    ? { y: [0, -12, 0], rotate: [-1.5, 1.5, -1.5] }
    : {};

  const lineWidths = [120, 90, 140, 75, 110];

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Speed lines rendered behind the mascot */}
      {speedLines && (
        <svg
          aria-hidden
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 220 220"
          xmlns="http://www.w3.org/2000/svg"
        >
          {lineWidths.map((w, i) => (
            <rect
              key={i}
              className="speed-line"
              x={10}
              y={70 + i * 18}
              width={w}
              height={5}
              rx={3}
              fill="#1A1A1A"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </svg>
      )}

      {/* The actual mascot artwork */}
      <motion.img
        src={src}
        alt={alt}
        width={size}
        height={size}
        className="relative z-10 object-contain"
        animate={floatAnim}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        style={{ maxWidth: '100%', maxHeight: '100%' }}
      />
    </div>
  );
}
