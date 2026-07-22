import { useEffect, useState } from 'react';
import { calculateCutFill, type CutFillResult } from '../features/mine-design/cutFill';
import type { ActualTerrain, TerrainDesign } from '../features/mine-design/designTypes';

export function useCutFillWorker(design: TerrainDesign | null, actual: ActualTerrain) {
  const [result, setResult] = useState<CutFillResult | null>(() =>
    design ? calculateCutFill(design, actual) : null,
  );

  useEffect(() => {
    if (!design) {
      setResult(null);
      return;
    }
    if (typeof Worker === 'undefined') {
      setResult(calculateCutFill(design, actual));
      return;
    }
    const worker = new Worker(new URL('../workers/cutFill.worker.ts', import.meta.url), {
      type: 'module',
    });
    worker.addEventListener('message', (event: MessageEvent<CutFillResult>) =>
      setResult(event.data),
    );
    worker.addEventListener('error', (event) => {
      console.error('Cut/fill worker failed; using main-thread fallback.', event.message);
      setResult(calculateCutFill(design, actual));
    });
    worker.postMessage({ design, actual });
    return () => worker.terminate();
  }, [actual, design]);

  return result;
}
