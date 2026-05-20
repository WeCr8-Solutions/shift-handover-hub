import { render, waitFor } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { describe, expect, it } from "vitest";

import { SEOHead } from "./SEOHead";

describe("SEOHead", () => {
  it("appends the brand once for plain page titles", async () => {
    render(
      <HelmetProvider>
        <SEOHead title="Learning Center" />
      </HelmetProvider>,
    );

    await waitFor(() => {
      expect(document.title).toBe("Learning Center | JobLine.ai");
    });
  });

  it("does not duplicate the brand when the title already includes it", async () => {
    render(
      <HelmetProvider>
        <SEOHead title="Learning Center | JobLine.ai" />
      </HelmetProvider>,
    );

    await waitFor(() => {
      expect(document.title).toBe("Learning Center | JobLine.ai");
    });
  });
});