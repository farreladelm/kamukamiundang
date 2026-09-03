import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { formErrorState } from "@/features/forms/action-state";
import { InvitationSlugForm } from "./invitation-slug-form";

afterEach(cleanup);

describe("InvitationSlugForm", () => {
  it("shows a returned slug error inline", async () => {
    render(
      <InvitationSlugForm
        action={async () => formErrorState("Periksa kembali URL publik.", { slug: ["URL publik sudah digunakan."] })}
        slug={null}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Simpan URL publik" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("URL publik sudah digunakan.");
  });
});
