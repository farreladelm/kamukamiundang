import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { TemplateDetail } from "@/features/showroom/template-detail";

describe("TemplateDetail", () => {
  afterEach(cleanup);

  it("renders pinned demo and applies only selected compatible palette colors", () => {
    render(
      <TemplateDetail
        templateKey="template-1"
        templateVersion={1}
        canonicalUrl="https://undango.test/templates/larasati"
      />,
    );

    const demo = screen.getByTestId("template-demo");
    const renderedTemplate = demo.firstElementChild;

    expect(screen.getByRole("heading", { name: "Larasati" })).toBeInTheDocument();
    expect(screen.getByText("Aruna")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Buka pilihan palet" }));
    expect(screen.getByRole("button", { name: /^Gading/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.queryByRole("button", { name: "Terakota" })).not.toBeInTheDocument();
    expect(renderedTemplate).toHaveStyle({ backgroundColor: "rgb(246, 240, 229)" });

    fireEvent.click(screen.getByRole("button", { name: "Soga" }));

    expect(screen.getByRole("button", { name: "Buka pilihan palet" })).toHaveTextContent("Soga");
    fireEvent.click(screen.getByRole("button", { name: "Buka pilihan palet" }));
    expect(screen.getByRole("button", { name: /^Soga/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(demo.firstElementChild).toBe(renderedTemplate);
    expect(renderedTemplate).toHaveStyle({ backgroundColor: "rgb(240, 231, 217)" });
    expect(screen.getByRole("link", { name: "Pesan via WhatsApp" })).toHaveAttribute(
      "href",
      expect.stringContaining("wa.me/6282131401640"),
    );
  }, 15_000);

  it("renders as a mobile invitation with desktop cover and fixed palette control", () => {
    render(
      <TemplateDetail
        templateKey="template-1"
        templateVersion={1}
        canonicalUrl="https://undango.test/templates/larasati"
      />,
    );

    expect(screen.getByTestId("preview-cover")).toBeInTheDocument();
    expect(screen.getByTestId("invitation-frame")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Buka pilihan palet" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.queryByRole("dialog", { name: "Pilihan palet" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Buka pilihan palet" }));

    expect(screen.getByRole("dialog", { name: "Pilihan palet" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Soga" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });
});
