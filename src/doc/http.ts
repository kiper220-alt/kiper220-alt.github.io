export type Request = typeof fetch;

export async function readResponse<T>(
  url: string, init: RequestInit, request: Request,
  consume: (response: Response) => Promise<T>, timeoutMs = 30000,
): Promise<T> {
  const deadline = new AbortController();
  const signal = init.signal ? AbortSignal.any([init.signal, deadline.signal]) : deadline.signal;
  signal.throwIfAborted();
  const timer = setTimeout(() => deadline.abort(new DOMException(`Время ожидания источника истекло: ${url}`, 'TimeoutError')), timeoutMs);
  let onAbort = () => {};
  const aborted = new Promise<never>((_, reject) => {
    onAbort = () => reject(signal.reason);
    signal.addEventListener('abort', onAbort, { once: true });
  });
  try {
    // Bound both headers and body consumption, even for an injected transport
    // that ignores AbortSignal. Late results never escape this request.
    return await Promise.race([request(url, { ...init, signal }).then(consume), aborted]);
  } finally {
    clearTimeout(timer);
    signal.removeEventListener('abort', onAbort);
  }
}

export function pause(ms: number, signal: AbortSignal): Promise<void> {
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    const aborted = () => { clearTimeout(timer); reject(signal.reason); };
    const timer = setTimeout(() => { signal.removeEventListener('abort', aborted); resolve(); }, ms);
    signal.addEventListener('abort', aborted, { once: true });
  });
}

export function createHttpClient(options: {
  signal: AbortSignal; request?: Request; timeoutMs?: number; detailIntervalMs?: number;
  onRequest?: () => void; onBytes?: (count: number) => void; onRetry?: () => void;
}) {
  const { signal } = options;
  const request = options.request ?? fetch;
  let gate = Promise.resolve(), lastDetail = 0;
  async function bytes(url: string, detail = false, missingOK = false): Promise<Uint8Array | null> {
    for (let attempt = 0; attempt < 5; attempt++) {
      signal.throwIfAborted();
      if (detail) {
        const turn = gate.then(async () => {
          const delay = lastDetail + (options.detailIntervalMs ?? 250) - performance.now();
          if (delay > 0) await pause(delay, signal);
          signal.throwIfAborted();
          lastDetail = performance.now();
        });
        gate = turn.catch(() => {});
        await turn;
      }
      options.onRequest?.();
      const result = await readResponse(url, { signal, cache: 'no-store', credentials: 'omit' }, request, async response => {
        if (response.status === 429 && attempt < 4) {
          const retry = Number(response.headers.get('Retry-After'));
          await response.body?.cancel();
          return { retryMs: Math.min(30, retry > 0 ? retry : 2 ** (attempt + 1)) * 1000 };
        }
        if (response.status === 404 && missingOK) return { data: null };
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
        return { data: new Uint8Array(await response.arrayBuffer()) };
      }, options.timeoutMs);
      if ('retryMs' in result) {
        options.onRetry?.();
        await pause(result.retryMs!, signal);
        continue;
      }
      if (result.data) options.onBytes?.(result.data.byteLength);
      return result.data!;
    }
    throw new Error(`Не удалось получить ${url}`);
  }
  async function json(url: string, detail = false, missingOK = false) {
    const value = await bytes(url, detail, missingOK);
    return value ? JSON.parse(new TextDecoder().decode(value)) : null;
  }
  return { bytes, json };
}
