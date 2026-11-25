import type { UserEvent } from "@vocabulando/domain";

export interface WidgetWordSnapshot {
  dayOffset: number;
  id: string;
  word: string;
  phoneticIpa: string;
  shortDefinition: string;
}

/**
 * Contrato de fila offline-first no Mobile (SQLite local + App Group / SharedPreferences).
 * Mantém eventos imutáveis até a API confirmar recebimento por eventId.
 */
export interface OfflineQueueAdapter {
  enqueueEvent(event: UserEvent): Promise<void>;
  flushPendingEvents(
    sender: (event: UserEvent) => Promise<{ ok: boolean }>,
  ): Promise<{ sent: number; remaining: number }>;
  writeWidgetCache14Days(days: WidgetWordSnapshot[]): Promise<void>;
}
