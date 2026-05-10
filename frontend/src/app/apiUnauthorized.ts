type Handler = () => void;

let handler: Handler | null = null;

export function setUnauthorizedHandler(next: Handler | null): void {
  handler = next;
}

export function notifyUnauthorized(): void {
  handler?.();
}
