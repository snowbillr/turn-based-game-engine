export class Player<Attributes> {
  public readonly id: string;
  public attributes: Attributes;

  constructor(id: string, attributes: Attributes) {
    this.id = id;
    this.attributes = attributes;
  }
}