interface WindowControlsProps {
  onClose: () => void;
  onMinimize: () => void;
  onToggleMaximize: () => void;
}

const CONTROL_BASE =
  'relative z-[2] flex h-3 w-3 flex-[0_0_auto] cursor-pointer items-center justify-center rounded-full border-0 bg-[rgb(113_113_122/0.22)] p-0 transition-[transform,background-color] duration-[120ms] ease-[ease] active:scale-[0.92] dark:bg-[rgb(161_161_170/0.2)] max-sm:h-[1.125rem] max-sm:w-[1.125rem]';

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
        className={`${CONTROL_BASE} hover:bg-[rgb(239_68_68/0.72)]`}
        aria-label="Cerrar ventana"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={onClose}
      />
      <button
        type="button"
        className={`${CONTROL_BASE} hover:bg-[rgb(234_179_8/0.78)]`}
        aria-label="Minimizar ventana"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={onMinimize}
      />
      <button
        type="button"
        className={`${CONTROL_BASE} hover:bg-[rgb(113_113_122/0.55)] dark:hover:bg-[rgb(161_161_170/0.48)]`}
        aria-label="Maximizar ventana"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={onToggleMaximize}
      />
    </div>
  );
}
