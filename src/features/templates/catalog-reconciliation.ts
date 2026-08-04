import "server-only";

import { db } from "@/lib/server/db";
import {
  reconcileTemplateCatalogWithClient,
  type TemplateCatalogReconciliationReport,
} from "./catalog-reconciliation-core";

export type { TemplateCatalogReconciliationReport } from "./catalog-reconciliation-core";

export async function reconcileTemplateCatalog(): Promise<TemplateCatalogReconciliationReport> {
  return db.$transaction((tx) => reconcileTemplateCatalogWithClient(tx));
}
