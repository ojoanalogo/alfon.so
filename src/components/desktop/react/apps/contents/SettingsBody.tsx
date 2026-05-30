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
    <div className="settings-panel">
      {sections.map((section) => (
        <section
          key={section.id}
          className="settings-block"
          aria-labelledby={section.title ? `settings-${section.id}-heading` : undefined}
        >
          {section.title && (
            <h3 id={`settings-${section.id}-heading`} className="settings-block__title">
              {section.title}
            </h3>
          )}
          {section.render()}
        </section>
      ))}
    </div>
  );
}
