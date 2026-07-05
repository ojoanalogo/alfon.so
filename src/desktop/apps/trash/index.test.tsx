import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { makeAppContext, makeWindowChromeProps, makeWindowState } from '@test/factories';
import trashApp from './index';

function win() {
  return makeWindowChromeProps({ state: makeWindowState({ open: true }) });
}

describe('trash app', () => {
  it('resolves junk item icons from ctx.findApp when appId is set', () => {
    const happyApp = {
      id: 'happy',
      title: 'Happy',
      iconKey: 'video' as const,
      geometry: { defaultWidth: 400 },
      render: () => null,
    };
    const ctx = makeAppContext({
      findApp: vi.fn((id: string) => (id === 'happy' ? happyApp : undefined)),
      iconUrls: { video: '/icons/video.png' },
    });

    render(trashApp.render(ctx, win()));

    expect(ctx.findApp).toHaveBeenCalled();
    expect(screen.getByText('no_abrir.mp4')).toBeTruthy();
  });

  it('marks junk without appId as non-activatable in grid view', () => {
    const ctx = makeAppContext();
    render(trashApp.render(ctx, win()));

    const area51 = screen.getByText('area51.pdf');
    expect(area51.closest('button')).toBeNull();
  });
});
