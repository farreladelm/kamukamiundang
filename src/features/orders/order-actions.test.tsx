import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OrderActions } from "./order-actions";

const { refresh, markOrderPaidAction, activateOrderAction } = vi.hoisted(() => ({
  refresh: vi.fn(),
  markOrderPaidAction: vi.fn().mockResolvedValue({ id: "order-1", status: "PAID" }),
  activateOrderAction: vi.fn().mockResolvedValue({ id: "invitation-1", slug: "invitation" }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock("@/app/admin/orders/actions", () => ({
  markOrderPaidAction,
  activateOrderAction,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("OrderActions", () => {
  it("offers payment confirmation for pending orders", () => {
    render(<OrderActions orderId="order-1" status="PENDING" invitationId={null} />);

    expect(screen.getByRole("button", { name: "Tandai paid" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Aktifkan" })).not.toBeInTheDocument();
  });

  it("marks pending order paid and refreshes the table", async () => {
    render(<OrderActions orderId="order-1" status="PENDING" invitationId={null} />);

    fireEvent.click(screen.getByRole("button", { name: "Tandai paid" }));

    await waitFor(() => expect(markOrderPaidAction).toHaveBeenCalledWith("order-1"));
    expect(refresh).toHaveBeenCalled();
  });

  it("offers activation for paid orders", async () => {
    render(<OrderActions orderId="order-1" status="PAID" invitationId={null} />);

    fireEvent.click(screen.getByRole("button", { name: "Aktifkan" }));

    await waitFor(() => expect(activateOrderAction).toHaveBeenCalledWith("order-1"));
    expect(refresh).toHaveBeenCalled();
  });

  it("links activated orders to invitation operations", () => {
    render(<OrderActions orderId="order-1" status="ACTIVATED" invitationId="invitation-1" />);

    expect(screen.getByRole("link", { name: "Invitation" })).toHaveAttribute(
      "href",
      "/admin/invitations/invitation-1",
    );
  });
});
