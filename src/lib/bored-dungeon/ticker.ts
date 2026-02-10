export interface IntervalTicker {
  stop: () => void;
}

export function startIntervalTicker(callback: () => void, intervalMs: number): IntervalTicker {
  const id = window.setInterval(callback, intervalMs);
  return {
    stop: () => window.clearInterval(id),
  };
}
