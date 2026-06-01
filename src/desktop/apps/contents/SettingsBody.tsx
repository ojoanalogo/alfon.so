import type { SettingsSection } from '../defineApp';

interface SettingsBodyProps {
  sections: SettingsSection[];
}

/**
 * Renders an ordered list of SettingsSection. Each section gets a heading
 * derived from `title`, plus its `render()`-provided body.
 *
 * Apps assemble settings by composing sections — no need to subclass the
 * settings shell to add a new page.
 */
export default function SettingsBody({ sections }: SettingsBodyProps) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto px-4 pt-[0.875rem] pb-4">
      {sections.map((section) => (
        <section
          key={section.id}
          aria-labelledby={section.title ? `settings-${section.id}-heading` : undefined}
        >
          {section.title && (
            <h3
              id={`settings-${section.id}-heading`}
              className="m-0 mb-[0.375rem] px-[0.125rem] py-0 text-[0.625rem] font-semibold tracking-[0.04em] uppercase text-muted"
            >
              {section.title}
            </h3>
          )}
          {section.render()}
        </section>
      ))}
    </div>
  );
}
