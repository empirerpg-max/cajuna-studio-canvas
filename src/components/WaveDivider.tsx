type Props = {
  fill?: string;
  flip?: boolean;
  className?: string;
};

/**
 * Organic wavy SVG divider between sections.
 * `fill` = color of the NEXT section (the wave fills into it).
 * `flip` = mirror horizontally for variety.
 * NOTE: no stroke on path — avoids the straight border line artifact.
 */
export function WaveDivider({ fill = '#FFF8F2', flip = false, className = '' }: Props) {
  return (
    <div
      className={`w-full overflow-hidden leading-none block ${className}`}
      style={{
        transform: flip ? 'scaleX(-1)' : undefined,
        lineHeight: 0,
        fontSize: 0,
        display: 'block',
      }}
      aria-hidden
    >
      <svg
        viewBox="0 0 1440 80"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className="block w-full h-16 md:h-20"
        style={{ display: 'block', verticalAlign: 'bottom' }}
      >
        <path
          d="M0,40 C180,80 360,0 540,40 C720,80 900,0 1080,40 C1260,80 1350,20 1440,40 L1440,80 L0,80 Z"
          fill={fill}
          stroke="none"
        />
      </svg>
    </div>
  );
}
