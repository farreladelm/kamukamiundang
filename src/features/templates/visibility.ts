import "server-only";

import { getVisibleTemplateCatalog } from "./catalog";
import type { TemplateCatalogItem } from "./types";

export async function getVisibleTemplateCatalogFromDatabase(): Promise<TemplateCatalogItem[]> {
  return getVisibleTemplateCatalog();
}
