import { useCallback, useState } from 'react';
import { readStorageItem, writeStorageItem } from '@/lib/storage';

function storageName(gameId: string): string {
  return `game-highscore:${gameId}`;
}

export function readGameHighScore(gameId: string): number {
  const raw = readStorageItem(storageName(gameId));
  if (!raw) return 0;
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

export function writeGameHighScore(gameId: string, score: number): void {
  writeStorageItem(storageName(gameId), String(score));
}

export function useGameHighScore(gameId: string) {
  const [best, setBest] = useState(() => readGameHighScore(gameId));

  const reportScore = useCallback(
    (score: number) => {
      if (score <= best) return best;
      setBest(score);
      writeGameHighScore(gameId, score);
      return score;
    },
    [best, gameId],
  );

  return { best, reportScore };
}
