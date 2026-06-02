export default function HappyContent() {
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted">archivo recuperado... te dijeron que no lo abrieras.</p>
      <div
        className="relative w-full overflow-hidden rounded-md border border-gray-400/40"
        style={{ aspectRatio: '16 / 9' }}
      >
        <iframe
          className="absolute inset-0 h-full w-full border-0"
          src="https://www.youtube.com/embed/I_NkBrDmGxM?si=aOwcN8js3gwgg5vE&controls=0"
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    </div>
  );
}
