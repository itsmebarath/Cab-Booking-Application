import { useWebSocketStatus } from "../../hooks/useRideWebSocket";
import { Radio } from "lucide-react";

export default function LiveConnectionBadge() {
  const { status, isConnected, isConnecting } = useWebSocketStatus();

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "4px 10px",
        borderRadius: "9999px",
        fontSize: "0.75rem",
        fontWeight: "500",
        backgroundColor: isConnected
          ? "rgba(16, 185, 129, 0.12)"
          : isConnecting
          ? "rgba(245, 158, 11, 0.12)"
          : "rgba(239, 68, 68, 0.12)",
        color: isConnected
          ? "#059669"
          : isConnecting
          ? "#d97706"
          : "#dc2626",
        border: `1px solid ${
          isConnected
            ? "rgba(16, 185, 129, 0.25)"
            : isConnecting
            ? "rgba(245, 158, 11, 0.25)"
            : "rgba(239, 68, 68, 0.25)"
        }`,
      }}
      title={`Real-Time WebSocket: ${status}`}
    >
      <span
        style={{
          width: "7px",
          height: "7px",
          borderRadius: "50%",
          backgroundColor: isConnected ? "#10b981" : isConnecting ? "#f59e0b" : "#ef4444",
          boxShadow: isConnected ? "0 0 6px #10b981" : "none",
        }}
      />
      <Radio size={12} />
      <span>{isConnected ? "Live" : isConnecting ? "Connecting" : "Offline"}</span>
    </div>
  );
}
