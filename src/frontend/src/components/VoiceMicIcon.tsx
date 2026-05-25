interface VoiceMicIconProps {
  state?: "inactive" | "hover" | "active";
  size?: number;
}

export function VoiceMicIcon({ state = "inactive", size = 24 }: VoiceMicIconProps) {
  const getColors = () => {
    switch (state) {
      case "active":
        return {
          mic: "#4169E1",
          waves: "#4169E1",
          glow: "rgba(65, 105, 225, 0.3)",
        };
      case "hover":
        return {
          mic: "#3d2e7c",
          waves: "#3d2e7c",
          glow: "rgba(61, 46, 124, 0.2)",
        };
      default:
        return {
          mic: "#6B7280",
          waves: "#9CA3AF",
          glow: "transparent",
        };
    }
  };

  const colors = getColors();

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="transition-all duration-200"
    >
      {/* Glow effect for active state */}
      {state === "active" && (
        <circle cx="12" cy="12" r="10" fill={colors.glow} className="animate-pulse" />
      )}

      {/* Sound waves - left side */}
      {(state === "hover" || state === "active") && (
        <>
          <path
            d="M3 12C3 12 4 10 4 8"
            stroke={colors.waves}
            strokeWidth="1.5"
            strokeLinecap="round"
            className={state === "active" ? "animate-pulse" : ""}
            style={{ animationDelay: "0ms", opacity: state === "active" ? 1 : 0.5 }}
          />
          <path
            d="M3 12C3 12 4 14 4 16"
            stroke={colors.waves}
            strokeWidth="1.5"
            strokeLinecap="round"
            className={state === "active" ? "animate-pulse" : ""}
            style={{ animationDelay: "0ms", opacity: state === "active" ? 1 : 0.5 }}
          />
          <path
            d="M1 12C1 12 2 9 2 6"
            stroke={colors.waves}
            strokeWidth="1.5"
            strokeLinecap="round"
            className={state === "active" ? "animate-pulse" : ""}
            style={{ animationDelay: "150ms", opacity: state === "active" ? 0.8 : 0.3 }}
          />
          <path
            d="M1 12C1 12 2 15 2 18"
            stroke={colors.waves}
            strokeWidth="1.5"
            strokeLinecap="round"
            className={state === "active" ? "animate-pulse" : ""}
            style={{ animationDelay: "150ms", opacity: state === "active" ? 0.8 : 0.3 }}
          />
        </>
      )}

      {/* Sound waves - right side */}
      {(state === "hover" || state === "active") && (
        <>
          <path
            d="M21 12C21 12 20 10 20 8"
            stroke={colors.waves}
            strokeWidth="1.5"
            strokeLinecap="round"
            className={state === "active" ? "animate-pulse" : ""}
            style={{ animationDelay: "0ms", opacity: state === "active" ? 1 : 0.5 }}
          />
          <path
            d="M21 12C21 12 20 14 20 16"
            stroke={colors.waves}
            strokeWidth="1.5"
            strokeLinecap="round"
            className={state === "active" ? "animate-pulse" : ""}
            style={{ animationDelay: "0ms", opacity: state === "active" ? 1 : 0.5 }}
          />
          <path
            d="M23 12C23 12 22 9 22 6"
            stroke={colors.waves}
            strokeWidth="1.5"
            strokeLinecap="round"
            className={state === "active" ? "animate-pulse" : ""}
            style={{ animationDelay: "150ms", opacity: state === "active" ? 0.8 : 0.3 }}
          />
          <path
            d="M23 12C23 12 22 15 22 18"
            stroke={colors.waves}
            strokeWidth="1.5"
            strokeLinecap="round"
            className={state === "active" ? "animate-pulse" : ""}
            style={{ animationDelay: "150ms", opacity: state === "active" ? 0.8 : 0.3 }}
          />
        </>
      )}

      {/* Microphone body */}
      <g>
        {/* Mic capsule/head */}
        <rect
          x="9"
          y="4"
          width="6"
          height="9"
          rx="3"
          fill={state === "active" ? colors.mic : "none"}
          stroke={colors.mic}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Mic stand - vertical line */}
        <path
          d="M12 13V19"
          stroke={colors.mic}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Mic base */}
        <path
          d="M9 19H15"
          stroke={colors.mic}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Sound receptor arc */}
        <path
          d="M7 11C7 8.79086 8.79086 7 11 7H13C15.2091 7 17 8.79086 17 11V12C17 14.7614 14.7614 17 12 17C9.23858 17 7 14.7614 7 12V11Z"
          stroke={colors.mic}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>
    </svg>
  );
}
