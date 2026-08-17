// Client-side text recognition using tesseract.js - fully in-browser, no
// server, no API key. It lazily fetches its language data from a public CDN
// the first time it runs, so the first recognition needs an internet
// connection and can take a few seconds. Accuracy on box-art fonts, angles
// and lighting varies a lot, so callers should treat a null/empty result as
// normal and let the user fill fields in manually.

import type { Worker } from 'tesseract.js';

let workerPromise: Promise<Worker> | null = null;

async function getWorker(): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = (async () => {
      const { createWorker } = await import('tesseract.js');
      return createWorker(['eng', 'heb']);
    })();
  }
  return workerPromise;
}

export async function recognizeText(image: File): Promise<string | null> {
  try {
    const worker = await getWorker();
    const { data } = await worker.recognize(image);
    const text = data.text?.trim();
    return text || null;
  } catch {
    workerPromise = null;
    return null;
  }
}
