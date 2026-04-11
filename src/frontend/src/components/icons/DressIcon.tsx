interface DressIconProps {
  className?: string;
  strokeWidth?: number;
}

export function DressIcon({ className = "w-6 h-6", strokeWidth = 1.5 }: DressIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Dress silhouette */}
      <path d="M8 4 L10 3 L14 3 L16 4" />
      <path d="M8 4 L6 8 L5 20 L19 20 L18 8 L16 4" />
      <path d="M10 3 L12 6 L14 3" />
      <line x1="5" y1="20" x2="19" y2="20" />
    </svg>
  );
}
