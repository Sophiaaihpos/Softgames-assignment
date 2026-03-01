export function requestFullscreen(): void {
  if (document.fullscreenElement) return;
}

export function exitFullscreen(): void {
  if (!document.fullscreenElement) return;
  if (document.exitFullscreen) {
    void document.exitFullscreen().catch(() => {});
  }
}

export function toggleFullscreen(): void {
  if (document.fullscreenElement) {
    exitFullscreen();
  } else {
    requestFullscreen();
  }
}

export function isFullscreen(): boolean {
  return !!document.fullscreenElement;
}

export function onFullscreenChange(cb: (isFull: boolean) => void): () => void {
  const handler = () => cb(isFullscreen());
  document.addEventListener("fullscreenchange", handler);
  document.addEventListener("webkitfullscreenchange", handler);
  return () => {
    document.removeEventListener("fullscreenchange", handler);
    document.removeEventListener("webkitfullscreenchange", handler);
  };
}

export function addFullscreenButton(): void {
  const size = 36;
  const margin = 12;

  const btn = document.createElement("button");
  btn.textContent = "⛶";
  Object.assign(btn.style, {
    position: "fixed",
    top: `${margin}px`,
    right: `${margin}px`,
    width: `${size}px`,
    height: `${size}px`,
    fontSize: "18px",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: "8px",
    color: "#fff",
    cursor: "pointer",
    zIndex: "9999",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: "1",
  });

  btn.addEventListener("click", () => toggleFullscreen());

  onFullscreenChange((isFull) => {
    btn.textContent = isFull ? "✕" : "⛶";
  });

  document.body.appendChild(btn);
}
