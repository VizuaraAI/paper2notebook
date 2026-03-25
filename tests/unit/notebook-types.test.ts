import { describe, it, expect } from "vitest";
import { createEmptyNotebook } from "@/lib/notebook-types";

describe("createEmptyNotebook", () => {
  it("creates a valid notebook structure", () => {
    const nb = createEmptyNotebook("test.ipynb");
    expect(nb.nbformat).toBe(4);
    expect(nb.nbformat_minor).toBe(5);
    expect(nb.cells).toEqual([]);
    expect(nb.metadata.kernelspec.language).toBe("python");
    expect(nb.metadata.colab?.name).toBe("test.ipynb");
  });
});
