import { motion } from "framer-motion";

type Props = {
  size?: number;
  className?: string;
  animated?: boolean;
};

/**
 * Cajuna mascot — stylized cashew/comma shape with closed sleepy eyes,
 * recreated as SVG so we can animate it (float + blink).
 */
export function CajuLogo({ size = 220, className = "", animated = true }: Props) {
  const float = animated
    ? { y: [0, -10, 0], rotate: [-2, 2, -2] }
    : undefined;
  const blink = animated
    ? { scaleY: [1, 0.1, 1] }
    : undefined;

  return (
    <motion.svg
      viewBox="0 0 400 400"
      width={size}
      height={size}
      className={className}
      animate={float}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      aria-label="Cajuna Studio mascot"
      role="img"
    >
      {/* Cashew body */}
      <path
        d="M280 60
           C 350 70, 360 170, 320 230
           C 300 260, 280 270, 250 270
           C 235 270, 225 260, 215 252
           C 205 245, 195 245, 180 255
           C 160 270, 140 285, 110 290
           C 70 295, 40 270, 45 230
           C 50 195, 80 175, 115 175
           C 145 175, 160 185, 175 180
           C 195 173, 195 145, 195 120
           C 195 80, 230 53, 280 60 Z"
        fill="#E97933"
        stroke="#231715"
        strokeWidth="9"
        strokeLinejoin="round"
      />
      {/* Subtle highlight */}
      <path
        d="M250 90 C 230 90, 215 110, 215 135"
        stroke="#FFC79A"
        strokeWidth="10"
        strokeLinecap="round"
        fill="none"
        opacity="0.7"
      />
      <path
        d="M120 215 C 110 220, 105 235, 108 255"
        stroke="#FFC79A"
        strokeWidth="9"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
      />
      {/* Eyes — sleepy lashes */}
      <motion.g
        style={{ transformOrigin: "240px 140px" }}
        animate={blink}
        transition={{ duration: 0.3, repeat: Infinity, repeatDelay: 3.2, ease: "easeInOut" }}
      >
        <path
          d="M225 138 Q 240 152 255 138"
          stroke="#231715"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
      </motion.g>
      <motion.g
        style={{ transformOrigin: "295px 140px" }}
        animate={blink}
        transition={{ duration: 0.3, repeat: Infinity, repeatDelay: 3.2, ease: "easeInOut", delay: 0.08 }}
      >
        <path
          d="M280 138 Q 295 152 310 138"
          stroke="#231715"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
      </motion.g>
    </motion.svg>
  );
}
