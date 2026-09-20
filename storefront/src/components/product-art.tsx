import type { ReactNode } from "react";

const GRADIENTS = [
  "linear-gradient(160deg, #eef1f5 0%, #d9dee6 100%)",
  "linear-gradient(160deg, #f3ece2 0%, #e3d5bf 100%)",
  "linear-gradient(160deg, #e8f0f2 0%, #c9dee3 100%)",
  "linear-gradient(160deg, #f1eef7 0%, #d8cfe9 100%)",
  "linear-gradient(160deg, #eef4ea 0%, #d3e3c9 100%)",
];

function pickGradient(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return GRADIENTS[hash % GRADIENTS.length];
}

function pickIcon(label: string) {
  const value = label.toLowerCase();
  if (/(phone|celular|móvil|movil)/.test(value)) return "phone";
  if (/(watch|reloj)/.test(value)) return "watch";
  if (/(audio|earbud|auricular|audífono|audifono|speaker|parlante)/.test(value))
    return "audio";
  if (/(laptop|notebook|mac|portátil|portatil)/.test(value)) return "laptop";
  if (/(tablet|pad)/.test(value)) return "tablet";
  return "device";
}

const ICONS: Record<string, ReactNode> = {
  phone: (
    <rect x="8" y="3" width="8" height="18" rx="2" strokeWidth="1.3" />
  ),
  watch: (
    <>
      <rect x="8" y="8" width="8" height="8" rx="2.4" strokeWidth="1.3" />
      <path d="M9.5 8V5.6a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V8M9.5 16v2.4a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1V16" strokeWidth="1.3" />
    </>
  ),
  audio: (
    <>
      <path d="M4 13v-1a8 8 0 0 1 16 0v1" strokeWidth="1.3" />
      <rect x="3" y="13" width="4" height="6" rx="1.5" strokeWidth="1.3" />
      <rect x="17" y="13" width="4" height="6" rx="1.5" strokeWidth="1.3" />
    </>
  ),
  laptop: (
    <>
      <rect x="4" y="5" width="16" height="10" rx="1.2" strokeWidth="1.3" />
      <path d="M2.5 19h19" strokeWidth="1.3" />
    </>
  ),
  tablet: (
    <rect x="5" y="3" width="14" height="18" rx="2" strokeWidth="1.3" />
  ),
  device: (
    <rect x="4" y="4" width="16" height="16" rx="3" strokeWidth="1.3" />
  ),
};

export function ProductArt({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  const icon = pickIcon(label);
  return (
    <div
      className={className}
      style={{ background: pickGradient(label) }}
      aria-hidden
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="#1d1d1f"
        strokeOpacity={0.28}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-1/3 w-1/3"
      >
        {ICONS[icon]}
      </svg>
    </div>
  );
}
