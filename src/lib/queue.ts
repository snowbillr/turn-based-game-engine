export class Queue<T> {
  private items: T[] = [];

  push(...items: T[]): void {
    this.items.push(...items);
  }

  pop(): T | undefined {
    return this.items.shift();
  }
  size(): number {
    return this.items.length;
  }
}