import { pull } from 'lodash-es';

class Emitter {
  private events: Record<string, ((params: any) => void)[]> = Object.create(null);

  public on = (e: string, fn: (params: any) => void) => {
    if (!this.events[e]) this.events[e] = [];
    this.events[e].push(fn);
  };

  public off = (e: string, fn: (params: any) => void) => {
    pull(this.events[e], fn);
  };

  public emit = (e: string, params: any) => {
    this.events[e]?.forEach((fn) => fn(params));
  };
}

export const emitter = new Emitter();
