import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SETTINGS_GROUP, SettingsRow, SegmentedControl } from './ui';

describe('SETTINGS_GROUP', () => {
  it('is a non-empty class string usable as a className', () => {
    expect(typeof SETTINGS_GROUP).toBe('string');
    expect(SETTINGS_GROUP.length).toBeGreaterThan(0);

    const { container } = render(<div className={SETTINGS_GROUP} />);
    expect(container.firstElementChild?.className).toBe(SETTINGS_GROUP);
  });
});

describe('SettingsRow', () => {
  it('renders the label and children', () => {
    render(
      <SettingsRow label="Tema">
        <button type="button">control</button>
      </SettingsRow>,
    );

    expect(screen.getByText('Tema')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'control' })).toBeTruthy();
  });

  it('renders the hint when provided', () => {
    render(
      <SettingsRow label="Tema" hint="sigue el SO">
        <span>x</span>
      </SettingsRow>,
    );

    expect(screen.getByText('sigue el SO')).toBeTruthy();
  });

  it('omits the hint element when no hint is passed', () => {
    const { container } = render(
      <SettingsRow label="Tema">
        <span>x</span>
      </SettingsRow>,
    );

    // Only the label span (plus the child span) — no hint span.
    const spans = container.querySelectorAll('span');
    expect(Array.from(spans).some((s) => s.textContent === 'Tema')).toBe(true);
    // The label is the only block span inside the left column.
    const labelColumn = container.querySelector('.min-w-0');
    expect(labelColumn?.querySelectorAll('span').length).toBe(1);
  });
});

describe('SegmentedControl', () => {
  const OPTIONS = [
    { value: 'a' as const, label: 'Option A' },
    { value: 'b' as const, label: 'Option B' },
    { value: 'c' as const, label: 'Option C' },
  ];

  it('renders a labelled group with one button per option', () => {
    render(
      <SegmentedControl options={OPTIONS} selected="a" onChange={() => {}} ariaLabel="Choose" />,
    );

    const group = screen.getByRole('group', { name: 'Choose' });
    expect(group).toBeTruthy();
    expect(group.querySelectorAll('button').length).toBe(3);
    expect(screen.getByText('Option A')).toBeTruthy();
    expect(screen.getByText('Option C')).toBeTruthy();
  });

  it('marks only the selected option with aria-pressed=true', () => {
    render(
      <SegmentedControl options={OPTIONS} selected="b" onChange={() => {}} ariaLabel="Choose" />,
    );

    const pressed = screen
      .getAllByRole('button')
      .filter((b) => b.getAttribute('aria-pressed') === 'true');
    expect(pressed.length).toBe(1);
    expect(pressed[0].textContent).toContain('Option B');
  });

  it('calls onChange with the option value on click', () => {
    const onChange = vi.fn();
    render(
      <SegmentedControl options={OPTIONS} selected="a" onChange={onChange} ariaLabel="Choose" />,
    );

    fireEvent.click(screen.getByText('Option C'));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('c');
  });

  it('still fires onChange when clicking the already-selected option', () => {
    const onChange = vi.fn();
    render(
      <SegmentedControl options={OPTIONS} selected="a" onChange={onChange} ariaLabel="Choose" />,
    );

    fireEvent.click(screen.getByText('Option A'));
    expect(onChange).toHaveBeenCalledWith('a');
  });

  it('renders an aria-hidden icon wrapper when an option supplies an icon', () => {
    const withIcon = [
      { value: 'x' as const, label: 'With', icon: <svg data-testid="ic" /> },
      { value: 'y' as const, label: 'Without' },
    ];

    const { container } = render(
      <SegmentedControl options={withIcon} selected="x" onChange={() => {}} ariaLabel="Icons" />,
    );

    const iconWrappers = container.querySelectorAll('[aria-hidden="true"]');
    expect(iconWrappers.length).toBe(1);
    expect(screen.getByTestId('ic')).toBeTruthy();
  });

  it('renders no icon wrapper when no option has an icon', () => {
    const { container } = render(
      <SegmentedControl options={OPTIONS} selected="a" onChange={() => {}} ariaLabel="Choose" />,
    );

    expect(container.querySelector('[aria-hidden="true"]')).toBeNull();
  });
});
