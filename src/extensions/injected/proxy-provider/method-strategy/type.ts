export interface ExecutionType {
  execute: (request: { method: string; params: Record<string, any> }) => Promise<void>;
}
