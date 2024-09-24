export class Stack<T> {
  private items: T[] = [];

  push(...items: T[]) {
    this.items.push(...items);
  }

  peek(): T {
    return this.items[this.items.length - 1];
  }

  pop(): T | undefined {
    return this.items.pop();
  }

  size(): number {
    return this.items.length;
  }
}
