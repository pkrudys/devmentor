import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import RootLayout, { metadata } from "./layout";

describe("RootLayout", () => {
  it("renders html > body > children", () => {
    const html = renderToStaticMarkup(
      <RootLayout>
        <main>hello</main>
      </RootLayout>
    );
    expect(html).toContain('<html lang="en">');
    expect(html).toContain("<body>");
    expect(html).toContain("hello");
  });

  it("exports metadata with a title", () => {
    expect(metadata.title).toBe("Next.js starter");
  });
});
