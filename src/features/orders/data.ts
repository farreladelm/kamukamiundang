import "server-only";

import { db } from "@/lib/server/db";
import { resolveTemplateCatalogByIdentity } from "@/features/templates/catalog";

const DEFAULT_STORAGE_QUOTA_BYTES = BigInt(250) * BigInt(1024) * BigInt(1024);

export function parseTemplateSelection(selection: string): {
  templateKey: string;
  templateVersion: number;
  paletteKey: string;
} {
  const [templateKey, rawVersion, paletteKey] = selection.split("|");
  const templateVersion = Number(rawVersion);

  if (
    !templateKey ||
    !paletteKey ||
    !Number.isInteger(templateVersion) ||
    templateVersion < 0
  ) {
    throw new Error("Invalid template selection");
  }

  return { templateKey, templateVersion, paletteKey };
}

function cleanRequired(value: string, field: string): string {
  const cleaned = value.trim();
  if (!cleaned) throw new Error(`${field} is required`);
  return cleaned;
}

export async function findOrCreateCustomer({
  customerId,
  name,
  whatsapp,
  email,
}: {
  customerId?: string;
  name: string;
  whatsapp?: string;
  email?: string;
}) {
  if (customerId) {
    const existing = await db.customer.findUnique({ where: { id: customerId } });
    if (!existing) throw new Error("Customer not found");
    return existing;
  }

  const normalizedEmail = email?.trim().toLowerCase() || undefined;
  const normalizedWhatsapp = whatsapp?.trim() || undefined;
  const existing = normalizedEmail || normalizedWhatsapp
    ? await db.customer.findFirst({
        where: {
          OR: [
            ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
            ...(normalizedWhatsapp ? [{ whatsapp: normalizedWhatsapp }] : []),
          ],
        },
      })
    : null;

  if (existing) {
    return db.customer.update({
      where: { id: existing.id },
      data: {
        name: name.trim() || existing.name,
        whatsapp: normalizedWhatsapp ?? existing.whatsapp,
        email: normalizedEmail ?? existing.email,
      },
    });
  }

  return db.customer.create({
    data: {
      name: cleanRequired(name, "Customer name"),
      whatsapp: normalizedWhatsapp,
      email: normalizedEmail,
    },
  });
}

export async function createPendingOrder({
  customer,
  templateKey,
  templateVersion,
  paletteKey,
  photoLimit,
  storageQuotaBytes = DEFAULT_STORAGE_QUOTA_BYTES,
}: {
  customer: { customerId?: string; name: string; whatsapp?: string; email?: string };
  templateKey: string;
  templateVersion: number;
  paletteKey: string;
  photoLimit: number;
  storageQuotaBytes?: bigint;
}) {
  const template = await resolveTemplateCatalogByIdentity(templateKey, templateVersion, {
    paletteKey,
    requireVisible: true,
  });

  if ("ok" in template) throw new Error("Unknown template version or palette");
  if (!Number.isInteger(photoLimit) || photoLimit < 0) throw new Error("Invalid photo limit");
  if (storageQuotaBytes < BigInt(0)) throw new Error("Invalid storage quota");

  const savedCustomer = await findOrCreateCustomer(customer);

  return db.order.create({
    data: {
      customerId: savedCustomer.id,
      templateKey: template.templateKey,
      templateVersion: template.templateVersion,
      contentSchemaVersion: template.contentSchemaVersion,
      paletteKey,
      priceInRupiah: template.priceInRupiah,
      photoLimit,
      storageQuotaBytes,
      status: "PENDING",
    },
    include: { customer: true },
  });
}
