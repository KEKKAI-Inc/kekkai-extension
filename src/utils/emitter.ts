import { pull } from 'lodash-es';

class Emitter {
  private events: Record<string, Function[]> = Object.create(null);

  public on = (e: string, fn: Function) => {
    if (!this.events[e]) this.events[e] = [];
    this.events[e].push(fn);
  }

  public off = (e: string, fn: Function) => {
    pull(this.events[e], fn);
  }

  public emit = (e: string, params: any) => {
    this.events[e]?.forEach((fn) => fn(params));
  }
}

export const emitter = new Emitter();
