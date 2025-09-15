export class LooseCaseMap<K extends string, V> extends Map<K, V> {
  public hasIgnoreCase(key: K): boolean {
    if (super.has(key)) {
      return true;
    }

    // TODO: memoizing lowercase keys?
    return super
      .keys()
      .some((x) => x.toLowerCase() === key.toLowerCase());
  }

  public getEntryIgnoreCase(key: K): [K, V] | undefined {
    const item = super.get(key);
    if (item) {
      return [key, item];
    }

    // TODO: memoizing lowercase keys?
    const entry = super
      .entries()
      .find(([entryKey]) => key.toLowerCase() === entryKey.toLowerCase());

    if (!entry) return undefined;

    return entry; // Flipped touple!
  }
}
