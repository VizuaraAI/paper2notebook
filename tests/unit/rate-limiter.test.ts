import { describe, it, expect, beforeEach } from "vitest";
import { RateLimiter } from "@/lib/rate-limiter";

describe("RateLimiter", () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    limiter = new RateLimiter({ maxRequests: 3, windowMs: 60000 });
  });

  it("allows requests under the limit", () => {
    expect(limiter.check("192.168.1.1")).toBe(true);
    expect(limiter.check("192.168.1.1")).toBe(true);
    expect(limiter.check("192.168.1.1")).toBe(true);
  });

  it("blocks requests over the limit", () => {
    limiter.check("192.168.1.1");
    limiter.check("192.168.1.1");
    limiter.check("192.168.1.1");
    expect(limiter.check("192.168.1.1")).toBe(false);
  });

  it("tracks IPs independently", () => {
    limiter.check("192.168.1.1");
    limiter.check("192.168.1.1");
    limiter.check("192.168.1.1");
    expect(limiter.check("192.168.1.1")).toBe(false);
    expect(limiter.check("192.168.1.2")).toBe(true);
  });

  it("resets after window expires", () => {
    const shortLimiter = new RateLimiter({ maxRequests: 1, windowMs: 50 });
    shortLimiter.check("10.0.0.1");
    expect(shortLimiter.check("10.0.0.1")).toBe(false);

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(shortLimiter.check("10.0.0.1")).toBe(true);
        resolve();
      }, 60);
    });
  });
});
