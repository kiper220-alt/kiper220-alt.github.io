export class RuntimePriority {
  private component = new Set<string>();
  private selected = '';
  setComponent(names: string[]) { this.component = new Set(names); }
  setPackage(name: string) { this.selected = name; }
  score(names: string[]) {
    return names.includes(this.selected) ? 100 : names.some(name => this.component.has(name)) ? 50 : 0;
  }
}

type Task = { key: string; names: string[]; weight: number; run: () => Promise<void> };
// All metadata workers share one dynamically prioritized queue. A newly
// opened package overtakes tasks not yet started, never cancels valid work.
export class VerificationQueue {
  private tasks: Task[] = [];
  private known = new Set<string>();
  private active = 0;
  private sealed = false;
  private resolve!: () => void;
  private reject!: (error: unknown) => void;
  readonly done: Promise<void>;
  private priority: RuntimePriority;
  private signal: AbortSignal;
  private changed: () => void;
  constructor(priority: RuntimePriority, signal: AbortSignal, changed: () => void) {
    this.priority = priority;
    this.signal = signal;
    this.changed = changed;
    this.done = new Promise((resolve, reject) => { this.resolve = resolve; this.reject = reject; });
    // Caller may still be acquiring Sisyphus when cancellation happens.
    void this.done.catch(() => {});
    signal.addEventListener('abort', () => { this.tasks = []; this.reject(signal.reason); }, { once: true });
  }
  add(task: Task) {
    if (this.signal.aborted || this.known.has(task.key)) return;
    this.known.add(task.key); this.tasks.push(task); this.changed(); this.pump();
  }
  seal() { this.sealed = true; this.pump(); }
  get pending() { return this.tasks.length + this.active; }
  private pump() {
    if (this.signal.aborted) return;
    while (this.active < 3 && this.tasks.length) {
      this.tasks.sort((a,b) => (this.priority.score(b.names) + b.weight) - (this.priority.score(a.names) + a.weight));
      const task = this.tasks.shift()!;
      this.active++;
      void task.run().catch(error => this.reject(error)).finally(() => {
        this.active--; this.changed(); this.pump();
      });
    }
    if (this.sealed && this.pending === 0) this.resolve();
  }
}
