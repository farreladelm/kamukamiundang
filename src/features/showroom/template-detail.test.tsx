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

    expect(screen.getByText("Aruna & Bima", { selector: "h1" })).toBeInTheDocument();
    expect(screen.getByText("Gading", { selector: "button" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.queryByText("Terakota", { selector: "button" })).not.toBeInTheDocument();
    expect(renderedTemplate).toHaveStyle({ backgroundColor: "rgb(246, 240, 229)" });

    fireEvent.click(screen.getByText("Soga", { selector: "button" }));

    expect(screen.getByText("Soga", { selector: "button" })).toHaveAttribute(
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
});
