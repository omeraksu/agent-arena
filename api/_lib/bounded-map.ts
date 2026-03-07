/**
 * A Map with a maximum size limit. When the limit is reached,
 * the oldest entry (first inserted) is evicted.
 */
export class BoundedMap<K, V> extends Map<K, V> {
  private maxSize: number;

  constructor(maxSize: number) {
    super();
    this.maxSize = maxSize;
  }

  set(key: K, value: V): this {
    // If key already exists, delete first so it moves to end
    if (this.has(key)) {
      this.delete(key);
    }
    // Evict oldest entries if at capacity
    while (this.size >= this.maxSize) {
      const oldest = this.keys().next().value;
      if (oldest !== undefined) this.delete(oldest);
      else break;
    }
    return super.set(key, value);
  }
}
