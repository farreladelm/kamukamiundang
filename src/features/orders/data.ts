import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { assertInvitationSlugAvailable } from "@/features/invitations/slug-claim";
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

type CustomerInput = {
  customerId?: string;
  name: string;
  whatsapp?: string;
  email?: string;
};

type CustomerClient = Pick<Prisma.TransactionClient, "customer">;

async function findOrCreateCustomerWith(client: CustomerClient, {
  customerId,
  name,
  whatsapp,
  email,
}: CustomerInput) {
  if (customerId) {
    const existing = await client.customer.findUnique({ where: { id: customerId } });
    if (!existing) throw new Error("Customer not found");
    return existing;
  }

  const normalizedEmail = email?.trim().toLowerCase() || undefined;
  const normalizedWhatsapp = whatsapp?.trim() || undefined;
  const existing = normalizedEmail || normalizedWhatsapp
    ? await client.customer.findFirst({
        where: {
          OR: [
            ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
            ...(normalizedWhatsapp ? [{ whatsapp: normalizedWhatsapp }] : []),
          ],
        },
      })
    : null;

  if (existing) {
    return client.customer.update({
      where: { id: existing.id },
      data: {
        name: name.trim() || existing.name,
        whatsapp: normalizedWhatsapp ?? existing.whatsapp,
        email: normalizedEmail ?? existing.email,
      },
    });
  }

  return client.customer.create({
    data: {
      name: cleanRequired(name, "Customer name"),
      whatsapp: normalizedWhatsapp,
      email: normalizedEmail,
    },
  });
}

export function findOrCreateCustomer(input: CustomerInput) {
  return findOrCreateCustomerWith(db, input);
}

export async function createPendingOrder({
  customer,
  templateKey,
  templateVersion,
  paletteKey,
  photoLimit,
  requestedInvitationSlug,
  storageQuotaBytes = DEFAULT_STORAGE_QUOTA_BYTES,
}: {
  customer: CustomerInput;
  templateKey: string;
  templateVersion: number;
  paletteKey: string;
  photoLimit: number;
  requestedInvitationSlug?: string;
  storageQuotaBytes?: bigint;
}) {
  const template = await resolveTemplateCatalogByIdentity(templateKey, templateVersion, {
    paletteKey,
    requireVisible: true,
  });

  if ("ok" in template) {
    if (template.reason === "NOT_VISIBLE") {
      throw new Error("Template status is not visible for order creation");
    }
    throw new Error("Unknown template version or palette");
  }
  if (!Number.isInteger(photoLimit) || photoLimit < 0) throw new Error("Invalid photo limit");
  if (storageQuotaBytes < BigInt(0)) throw new Error("Invalid storage quota");

  return db.$transaction(async (tx) => {
    if (requestedInvitationSlug) {
      await assertInvitationSlugAvailable(tx, requestedInvitationSlug);
    }

    const savedCustomer = await findOrCreateCustomerWith(tx, customer);
    return tx.order.create({
      data: {
        customerId: savedCustomer.id,
        templateKey: template.templateKey,
        templateVersion: template.templateVersion,
        contentSchemaVersion: template.contentSchemaVersion,
        paletteKey,
        requestedInvitationSlug,
        priceInRupiah: template.priceInRupiah,
        photoLimit,
        storageQuotaBytes,
        status: "PENDING",
      },
      include: { customer: true },
    });
  });
}
