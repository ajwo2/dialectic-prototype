import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { PlainTextRenderer } from "../components/PlainTextRenderer";

describe("PlainTextRenderer", () => {
  it("renders a single span covering full text when no highlights", () => {
    const { container } = render(
      <PlainTextRenderer content="Hello world" messageId="m1" highlights={[]} />,
    );

    const spans = container.querySelectorAll("span[data-offset-start]");
    expect(spans).toHaveLength(1);
    expect(spans[0].getAttribute("data-offset-start")).toBe("0");
    expect(spans[0].getAttribute("data-offset-end")).toBe("11");
    expect(spans[0].textContent).toBe("Hello world");
  });

  it("renders correct data-offset attributes with highlights", () => {
    const { container } = render(
      <PlainTextRenderer
        content="Hello world, this is a test message"
        messageId="m2"
        highlights={[{ start: 13, end: 24, color: "bg-amber-400/30" }]}
      />,
    );

    const spans = container.querySelectorAll("span[data-offset-start]");
    expect(spans).toHaveLength(3);

    // Before highlight
    expect(spans[0].getAttribute("data-offset-start")).toBe("0");
    expect(spans[0].getAttribute("data-offset-end")).toBe("13");
    expect(spans[0].textContent).toBe("Hello world, ");

    // Highlight
    expect(spans[1].getAttribute("data-offset-start")).toBe("13");
    expect(spans[1].getAttribute("data-offset-end")).toBe("24");
    expect(spans[1].textContent).toBe("this is a t");

    // After highlight
    expect(spans[2].getAttribute("data-offset-start")).toBe("24");
    expect(spans[2].getAttribute("data-offset-end")).toBe("35");
    expect(spans[2].textContent).toBe("est message");
  });

  it("highlighted spans get the correct CSS class", () => {
    const { container } = render(
      <PlainTextRenderer
        content="Hello world"
        messageId="m3"
        highlights={[{ start: 0, end: 5, color: "bg-red-400/30 underline" }]}
      />,
    );

    const spans = container.querySelectorAll("span[data-offset-start]");
    const highlighted = spans[0];
    expect(highlighted.className).toContain("bg-red-400/30");
    expect(highlighted.className).toContain("underline");

    // Non-highlighted span should have no color class
    const plain = spans[1];
    expect(plain.className).toBe("");
  });

  it("renders the message-id data attribute on the p element", () => {
    const { container } = render(
      <PlainTextRenderer content="Test" messageId="s7" highlights={[]} />,
    );

    const p = container.querySelector("p[data-message-id]");
    expect(p).not.toBeNull();
    expect(p!.getAttribute("data-message-id")).toBe("s7");
  });

  it("handles multiple highlights", () => {
    const { container } = render(
      <PlainTextRenderer
        content="ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        messageId="m4"
        highlights={[
          { start: 2, end: 5, color: "bg-amber" },
          { start: 10, end: 15, color: "bg-red" },
        ]}
      />,
    );

    const spans = container.querySelectorAll("span[data-offset-start]");
    // [0,2) [2,5) [5,10) [10,15) [15,26)
    expect(spans).toHaveLength(5);
    expect(spans[0].textContent).toBe("AB");
    expect(spans[1].textContent).toBe("CDE");
    expect(spans[2].textContent).toBe("FGHIJ");
    expect(spans[3].textContent).toBe("KLMNO");
    expect(spans[4].textContent).toBe("PQRSTUVWXYZ");
  });
});
