import { ImporterEvents } from '../../types';

type EventKey = keyof ImporterEvents;
type EventListener<K extends EventKey> = (data: ImporterEvents[K]) => void;

export class EventEmitter {
  private listeners: Map<EventKey, Set<EventListener<any>>> = new Map();

  on<K extends EventKey>(event: K, listener: EventListener<K>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);

    return () => {
      this.off(event, listener);
    };
  }

  once<K extends EventKey>(event: K, listener: EventListener<K>): () => void {
    const wrapped: EventListener<K> = (data) => {
      this.off(event, wrapped);
      listener(data);
    };
    return this.on(event, wrapped);
  }

  off<K extends EventKey>(event: K, listener: EventListener<K>): void {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(listener);
      if (set.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  emit<K extends EventKey>(event: K, data: ImporterEvents[K]): void {
    const set = this.listeners.get(event);
    if (set) {
      // Create a copy to prevent mutation issues during dispatch
      const items = Array.from(set);
      for (const listener of items) {
        try {
          listener(data);
        } catch (err) {
          console.error(`Error in event listener for ${String(event)}:`, err);
        }
      }
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}
