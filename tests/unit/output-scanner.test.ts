import { describe, it, expect } from "vitest";
import { scanAndSanitizeCode } from "@/lib/output-scanner";

describe("scanAndSanitizeCode", () => {
  it("blocks os.system calls", () => {
    const code = 'os.system("rm -rf /")';
    const result = scanAndSanitizeCode(code);
    expect(result).toContain("# SECURITY: blocked");
    expect(result).not.toMatch(/^os\.system/m);
  });

  it("blocks subprocess calls", () => {
    const code = 'subprocess.run(["curl", "evil.com"])';
    const result = scanAndSanitizeCode(code);
    expect(result).toContain("# SECURITY: blocked");
  });

  it("blocks eval()", () => {
    const code = 'result = eval(user_input)';
    const result = scanAndSanitizeCode(code);
    expect(result).toContain("# SECURITY: blocked");
  });

  it("blocks exec()", () => {
    const code = 'exec(malicious_code)';
    const result = scanAndSanitizeCode(code);
    expect(result).toContain("# SECURITY: blocked");
  });

  it("blocks __import__", () => {
    const code = '__import__("os").system("whoami")';
    const result = scanAndSanitizeCode(code);
    expect(result).toContain("# SECURITY: blocked");
  });

  it("blocks shutil.rmtree", () => {
    const code = 'shutil.rmtree("/important/data")';
    const result = scanAndSanitizeCode(code);
    expect(result).toContain("# SECURITY: blocked");
  });

  it("preserves safe code", () => {
    const code = "import numpy as np\nx = np.array([1, 2, 3])\nprint(x.mean())";
    const result = scanAndSanitizeCode(code);
    expect(result).toBe(code);
  });

  it("preserves subprocess in comments", () => {
    const code = "# This uses subprocess internally\nresult = run_model()";
    const result = scanAndSanitizeCode(code);
    expect(result).toBe(code);
  });

  it("blocks open() with write mode on system paths", () => {
    const code = 'open("/etc/passwd", "w")';
    const result = scanAndSanitizeCode(code);
    expect(result).toContain("# SECURITY: blocked");
  });

  it("allows open() for normal data files", () => {
    const code = 'open("results.csv", "r")';
    const result = scanAndSanitizeCode(code);
    expect(result).toBe(code);
  });
});
