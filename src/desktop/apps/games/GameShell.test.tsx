import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GameShell, { GameOverOverlay } from './GameShell';

describe('GameShell', () => {
  it('renders hint and score in the HUD', () => {
    render(
      <GameShell hint="move with arrows" score="puntos: 5">
        <div>stage</div>
      </GameShell>,
    );
    expect(screen.getByText('move with arrows')).toBeTruthy();
    expect(screen.getByText('puntos: 5')).toBeTruthy();
    expect(screen.getByText('stage')).toBeTruthy();
  });

  it('omits the HUD when neither hint nor score is given', () => {
    const { container } = render(
      <GameShell>
        <div>stage</div>
      </GameShell>,
    );
    expect(container.querySelector('.game-shell__hud')).toBeNull();
  });
});

describe('GameOverOverlay', () => {
  it('is hidden when show is false', () => {
    const { container } = render(<GameOverOverlay show={false} onRestart={vi.fn()} />);
    expect(container.querySelector('button')).toBeNull();
  });

  it('renders a restart button and fires onRestart on click', () => {
    const onRestart = vi.fn();
    render(<GameOverOverlay show onRestart={onRestart} />);
    fireEvent.click(screen.getByRole('button', { name: 'jugar de nuevo' }));
    expect(onRestart).toHaveBeenCalledOnce();
  });
});
