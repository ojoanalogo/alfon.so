interface WindowControlsProps {
  onClose: () => void;
  onMinimize: () => void;
  onToggleMaximize: () => void;
}

export default function WindowControls({ onClose, onMinimize, onToggleMaximize }: WindowControlsProps) {
  return (
    <div className="window-controls" role="group" aria-label="Controles de ventana">
      <button
        type="button"
        className="window-control window-control--close"
        aria-label="Cerrar ventana"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={onClose}
      />
      <button
        type="button"
        className="window-control window-control--min"
        aria-label="Minimizar ventana"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={onMinimize}
      />
      <button
        type="button"
        className="window-control window-control--max"
        aria-label="Maximizar ventana"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={onToggleMaximize}
      />
    </div>
  );
}
