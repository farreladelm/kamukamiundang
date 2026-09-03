import { mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/server/db";
import {
  deleteImageAssetForCustomer,
  getImageVariantForCustomer,
  reconcileImageStorage,
  uploadImageAssetForCustomer,
} from "@/features/assets/image-service";

const storageRoots: string[] = [];

afterEach(async () => {
  await Promise.all(storageRoots.splice(0).map((storageRoot) => rm(storageRoot, { recursive: true, force: true })));
});

beforeEach(async () => {
  await db.$executeRawUnsafe(
    'TRUNCATE TABLE "SnapshotAsset", "PublishedSnapshot", "Asset", "InvitationContent", "MagicLink", "Session", "Invitation", "Order", "Customer", "Admin" CASCADE',
  );
});

async function createStorageRoot() {
  const storageRoot = await mkdtemp(join(tmpdir(), "undango-image-assets-"));
  storageRoots.push(storageRoot);
  return storageRoot;
}

async function setupInvitation({ photoLimit = 2, storageQuotaBytes = 250 * 1024 * 1024 } = {}) {
  const customer = await db.customer.create({ data: { name: "Customer" } });
  const order = await db.order.create({
    data: {
      customerId: customer.id,
      templateKey: "template-1",
      templateVersion: 1,
      contentSchemaVersion: 2,
      paletteKey: "gading",
      priceInRupiah: 100000,
      photoLimit,
      storageQuotaBytes: BigInt(storageQuotaBytes),
      status: "PAID",
    },
  });
  const invitation = await db.invitation.create({
    data: {
      customerId: customer.id,
      orderId: order.id,
      templateKey: order.templateKey,
      templateVersion: order.templateVersion,
      contentSchemaVersion: order.contentSchemaVersion,
      paletteKey: order.paletteKey,
      slug: `image-assets-${randomUUID()}`,
    },
  });

  return { customer, invitation };
}

async function createPng({ width = 32, height = 32 } = {}) {
  return sharp({
    create: { width, height, channels: 3, background: "#dec6a3" },
  }).png().toBuffer();
}

describe("image asset lifecycle", () => {
  it("rejects bytes with a spoofed image content type without creating files or assets", async () => {
    const { customer, invitation } = await setupInvitation();
    const storageRoot = await createStorageRoot();

    await expect(uploadImageAssetForCustomer({
      customerId: customer.id,
      invitationId: invitation.id,
      bytes: Buffer.from("not an image"),
      storageRoot,
    })).resolves.toMatchObject({ status: "invalid_image" });

    await expect(db.asset.count()).resolves.toBe(0);
    await expect(readdir(join(storageRoot, ".tmp"))).resolves.toEqual([]);
  });

  it("writes display and thumbnail variants and delivers only owned ready assets", async () => {
    const { customer, invitation } = await setupInvitation();
    const storageRoot = await createStorageRoot();

    const upload = await uploadImageAssetForCustomer({
      customerId: customer.id,
      invitationId: invitation.id,
      bytes: await createPng(),
      storageRoot,
    });

    expect(upload.status).toBe("ready");
    if (upload.status !== "ready") throw new Error("Expected image asset to become ready");

    const ownedVariant = await getImageVariantForCustomer({
      customerId: customer.id,
      assetId: upload.assetId,
      variant: "display",
      storageRoot,
    });
    expect(ownedVariant).toMatchObject({ contentType: "image/webp" });
    if (ownedVariant) {
      await new Promise<void>((resolve, reject) => {
        ownedVariant.stream.once("end", resolve);
        ownedVariant.stream.once("error", reject);
        ownedVariant.stream.resume();
      });
    }

    const otherCustomer = await db.customer.create({ data: { name: "Other customer" } });
    await expect(getImageVariantForCustomer({
      customerId: otherCustomer.id,
      assetId: upload.assetId,
      variant: "display",
      storageRoot,
    })).resolves.toBeNull();
  });

  it("stores dimensions reported by the generated variants", async () => {
    const { customer, invitation } = await setupInvitation();
    const storageRoot = await createStorageRoot();
    const upload = await uploadImageAssetForCustomer({
      customerId: customer.id,
      invitationId: invitation.id,
      bytes: await createPng({ width: 2560, height: 1280 }),
      storageRoot,
    });
    if (upload.status !== "ready") throw new Error("Expected image asset to become ready");

    await expect(db.asset.findUniqueOrThrow({ where: { id: upload.assetId } })).resolves.toMatchObject({
      metadata: {
        variants: {
          display: { width: 1600, height: 800 },
          thumbnail: { width: 480, height: 240 },
        },
      },
    });
  });

  it("enforces photo cap before creating another asset", async () => {
    const { customer, invitation } = await setupInvitation({ photoLimit: 1 });
    const storageRoot = await createStorageRoot();
    const bytes = await createPng();

    await expect(uploadImageAssetForCustomer({ customerId: customer.id, invitationId: invitation.id, bytes, storageRoot }))
      .resolves.toMatchObject({ status: "ready" });
    await expect(uploadImageAssetForCustomer({ customerId: customer.id, invitationId: invitation.id, bytes, storageRoot }))
      .resolves.toMatchObject({ status: "photo_limit" });
  });

  it("cleans final variants and marks the asset failed when the ready quota is exceeded", async () => {
    const { customer, invitation } = await setupInvitation({ storageQuotaBytes: 1 });
    const storageRoot = await createStorageRoot();

    await expect(uploadImageAssetForCustomer({
      customerId: customer.id,
      invitationId: invitation.id,
      bytes: await createPng(),
      storageRoot,
    })).resolves.toEqual({ status: "quota_exceeded" });

    await expect(db.asset.findFirstOrThrow()).resolves.toMatchObject({
      status: "FAILED",
      failureCode: "QUOTA_EXCEEDED",
    });
    await expect(readdir(join(storageRoot, invitation.id, "images"))).resolves.toEqual([]);
  });

  it("cleans partial files and marks the asset failed when decode fails after magic validation", async () => {
    const { customer, invitation } = await setupInvitation();
    const storageRoot = await createStorageRoot();

    await expect(uploadImageAssetForCustomer({
      customerId: customer.id,
      invitationId: invitation.id,
      bytes: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      storageRoot,
    })).resolves.toMatchObject({ status: "failed" });

    await expect(db.asset.findFirstOrThrow()).resolves.toMatchObject({ status: "FAILED" });
    await expect(readdir(join(storageRoot, ".tmp"))).resolves.toEqual([]);
  });

  it("reconciles storage left behind by failed assets", async () => {
    const { customer, invitation } = await setupInvitation();
    const storageRoot = await createStorageRoot();
    await expect(uploadImageAssetForCustomer({
      customerId: customer.id,
      invitationId: invitation.id,
      bytes: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      storageRoot,
    })).resolves.toMatchObject({ status: "failed" });
    const asset = await db.asset.findFirstOrThrow();
    const assetDirectory = join(storageRoot, asset.storagePath);
    await mkdir(assetDirectory, { recursive: true });
    await writeFile(join(assetDirectory, "display.webp"), "orphaned variant");

    await reconcileImageStorage(storageRoot);

    await expect(readdir(join(storageRoot, invitation.id, "images"))).resolves.toEqual([]);
  });

  it("fails stale in-flight assets and preserves active temporary uploads", async () => {
    const { invitation } = await setupInvitation();
    const storageRoot = await createStorageRoot();
    const asset = await db.asset.create({
      data: {
        invitationId: invitation.id,
        type: "IMAGE",
        storagePath: `${invitation.id}/images/${randomUUID()}`,
      },
    });
    await db.asset.update({
      where: { id: asset.id },
      data: { updatedAt: new Date(Date.now() - 25 * 60 * 60 * 1000) },
    });
    const orphanedDirectory = join(storageRoot, asset.storagePath);
    await mkdir(orphanedDirectory, { recursive: true });
    await writeFile(join(orphanedDirectory, "display.webp"), "orphaned variant");
    await mkdir(join(storageRoot, ".tmp"), { recursive: true });
    await writeFile(join(storageRoot, ".tmp", "active.upload"), "active upload");

    await reconcileImageStorage(storageRoot);

    await expect(db.asset.findUniqueOrThrow({ where: { id: asset.id } })).resolves.toMatchObject({
      status: "FAILED",
      failureCode: "STALE_PROCESSING",
    });
    await expect(readdir(join(storageRoot, invitation.id, "images"))).resolves.toEqual([]);
    await expect(readdir(join(storageRoot, ".tmp"))).resolves.toEqual(["active.upload"]);
  });

  it("denies deletion when a published snapshot references the asset", async () => {
    const { customer, invitation } = await setupInvitation();
    const storageRoot = await createStorageRoot();
    const upload = await uploadImageAssetForCustomer({
      customerId: customer.id,
      invitationId: invitation.id,
      bytes: await createPng(),
      storageRoot,
    });
    if (upload.status !== "ready") throw new Error("Expected image asset to become ready");

    const snapshot = await db.publishedSnapshot.create({
      data: {
        invitationId: invitation.id,
        templateKey: invitation.templateKey,
        templateVersion: invitation.templateVersion,
        contentSchemaVersion: invitation.contentSchemaVersion,
        paletteKey: invitation.paletteKey,
        content: {},
      },
    });
    await db.snapshotAsset.create({ data: { snapshotId: snapshot.id, assetId: upload.assetId } });

    await expect(deleteImageAssetForCustomer({
      customerId: customer.id,
      assetId: upload.assetId,
      storageRoot,
    })).resolves.toEqual({ status: "published_reference" });
    await expect(db.asset.findUniqueOrThrow({ where: { id: upload.assetId } })).resolves.toMatchObject({ status: "READY" });
  });

  it("rejects non-ready assets from published snapshots at the database boundary", async () => {
    const { invitation } = await setupInvitation();
    const asset = await db.asset.create({
      data: {
        invitationId: invitation.id,
        type: "IMAGE",
        storagePath: `${invitation.id}/images/${randomUUID()}`,
      },
    });
    const snapshot = await db.publishedSnapshot.create({
      data: {
        invitationId: invitation.id,
        templateKey: invitation.templateKey,
        templateVersion: invitation.templateVersion,
        contentSchemaVersion: invitation.contentSchemaVersion,
        paletteKey: invitation.paletteKey,
        content: {},
      },
    });

    await expect(db.snapshotAsset.create({ data: { snapshotId: snapshot.id, assetId: asset.id } }))
      .rejects.toThrow("only ready assets can enter a published snapshot");
  });

  it("rejects retargeting a published snapshot asset to a non-ready asset", async () => {
    const { customer, invitation } = await setupInvitation();
    const storageRoot = await createStorageRoot();
    const upload = await uploadImageAssetForCustomer({
      customerId: customer.id,
      invitationId: invitation.id,
      bytes: await createPng(),
      storageRoot,
    });
    if (upload.status !== "ready") throw new Error("Expected image asset to become ready");
    const pendingAsset = await db.asset.create({
      data: {
        invitationId: invitation.id,
        type: "IMAGE",
        storagePath: `${invitation.id}/images/${randomUUID()}`,
      },
    });
    const snapshot = await db.publishedSnapshot.create({
      data: {
        invitationId: invitation.id,
        templateKey: invitation.templateKey,
        templateVersion: invitation.templateVersion,
        contentSchemaVersion: invitation.contentSchemaVersion,
        paletteKey: invitation.paletteKey,
        content: {},
      },
    });
    await db.snapshotAsset.create({ data: { snapshotId: snapshot.id, assetId: upload.assetId } });

    await expect(db.snapshotAsset.update({
      where: { snapshotId_assetId: { snapshotId: snapshot.id, assetId: upload.assetId } },
      data: { assetId: pendingAsset.id },
    })).rejects.toThrow("only ready assets can enter a published snapshot");
  });

  it("serializes concurrent ready transitions against the invitation storage quota", async () => {
    const probe = await setupInvitation();
    const probeStorageRoot = await createStorageRoot();
    const bytes = await createPng();
    const probeUpload = await uploadImageAssetForCustomer({
      customerId: probe.customer.id,
      invitationId: probe.invitation.id,
      bytes,
      storageRoot: probeStorageRoot,
    });
    if (probeUpload.status !== "ready") throw new Error("Expected image asset to become ready");
    const probeAsset = await db.asset.findUniqueOrThrow({ where: { id: probeUpload.assetId } });

    await db.$executeRawUnsafe(
      'TRUNCATE TABLE "SnapshotAsset", "PublishedSnapshot", "Asset", "InvitationContent", "MagicLink", "Session", "Invitation", "Order", "Customer", "Admin" CASCADE',
    );
    const { customer, invitation } = await setupInvitation({ storageQuotaBytes: Number(probeAsset.byteSize) });
    const storageRoot = await createStorageRoot();

    const results = await Promise.all([
      uploadImageAssetForCustomer({ customerId: customer.id, invitationId: invitation.id, bytes, storageRoot }),
      uploadImageAssetForCustomer({ customerId: customer.id, invitationId: invitation.id, bytes, storageRoot }),
    ]);

    expect(results.map((result) => result.status).sort()).toEqual(["quota_exceeded", "ready"]);
  });
});
