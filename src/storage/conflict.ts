export class ConflictError extends Error {
  constructor() { super('別のタブで変更されたため競合しました'); this.name = 'ConflictError'; }
}
