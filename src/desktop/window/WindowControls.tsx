interface WindowControlsProps {
  onClose: () => void;
  onMinimize: () => void;
  onToggleMaximize: () => void;
}

const CONTROL_BASE =
  'relative z-[2] flex h-3 w-3 flex-[0_0_auto] cursor-pointer items-center justify-center rounded-full border-0 p-0 transition-[transform,background-color] duration-[120ms] ease-[ease] active:scale-[0.92] max-sm:h-[1.125rem] max-sm:w-[1.125rem]';

export default function WindowControls({
  onClose,
  onMinimize,
  onToggleMaximize,
}: WindowControlsProps) {
  return (
    <div
      className="window-controls pointer-events-auto relative z-[2] flex flex-[0_0_auto] items-center gap-[0.4375rem] px-[0.625rem] max-sm:gap-[0.5rem] max-sm:px-[0.5rem]"
      role="group"
      aria-label="Controles de ventana"
    >
      <button
        type="button"
        className={`${CONTROL_BASE} bg-[#e07f77] hover:bg-[#cc6e66]`}
        aria-label="Cerrar ventana"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={onClose}
      />
      <button
        type="button"
        className={`${CONTROL_BASE} bg-[#d9b45c] hover:bg-[#c4a04c]`}
        aria-label="Minimizar ventana"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={onMinimize}
      />
      <button
        type="button"
        className={`${CONTROL_BASE} bg-[#6aaf72] hover:bg-[#5a9a62]`}
        aria-label="Maximizar ventana"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={onToggleMaximize}
      />
    </div>
  );
}
