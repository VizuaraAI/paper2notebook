import { NextRequest, NextResponse } from "next/server";
import { parsePdf } from "@/lib/pdf-parser";
import { apiRateLimiter } from "@/lib/rate-limiter";

const MAX_SIZE = 20 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!apiRateLimiter.check(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No PDF file provided" },
        { status: 400 }
      );
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "File must be a PDF" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File exceeds 20MB limit" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length === 0) {
      return NextResponse.json(
        { error: "PDF file is empty" },
        { status: 400 }
      );
    }

    const header = buffer.slice(0, 5).toString("ascii");
    if (header !== "%PDF-") {
      return NextResponse.json(
        { error: "File is not a valid PDF" },
        { status: 400 }
      );
    }

    const result = await parsePdf(buffer);

    if (!result.text || result.text.trim().length === 0) {
      return NextResponse.json(
        { error: "Could not extract text from PDF. The file may be scanned or image-based." },
        { status: 422 }
      );
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Failed to parse PDF. Please try a different file." },
      { status: 500 }
    );
  }
}
