import Dexie, { Table } from "dexie";

export interface QueuedRequest {
  id?: number;
  url: string;
  method: "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  body?: any;
  createdAt: number;
}

class OfflineDB extends Dexie {
  requests!: Table<QueuedRequest, number>;

  constructor() {
    super("offlineQueue");
    this.version(1).stores({
      // primary key ++id, index on createdAt
      requests: "++id, createdAt",
    });
  }
}

export const db = new OfflineDB();
