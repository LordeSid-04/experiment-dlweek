import { render, screen } from "@testing-library/react";
import { GlassCard } from "./GlassCard";
import { PillButton } from "./PillButton";

describe("design system ui components", () => {
  it("renders primary pill button tokens", () => {
    render(<PillButton variant="primary">Start now</PillButton>);
    const button = screen.getByRole("button", { name: "Start now" });
    expect(button).toHaveClass("rounded-full");
    expect(button).toHaveClass("bg-white");
    expect(button).toHaveClass("text-black");
  });

  it("renders glass card with hover glow class by default", () => {
    const { container } = render(
      <GlassCard>
        <p>Card body</p>
      </GlassCard>
    );

    const card = container.firstElementChild;
    expect(card).toHaveClass("backdrop-blur-sm");
    expect(card).toHaveClass("hover:shadow-[0_0_18px_rgba(56,189,248,0.14)]");
  });
});
