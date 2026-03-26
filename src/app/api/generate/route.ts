import { NextRequest } from "next/server";
import { z } from "zod";
import { createOpenAIClient, streamNotebookGeneration } from "@/lib/openai-client";
import { buildNotebookPrompt } from "@/lib/prompt-builder";
import { assembleNotebook } from "@/lib/notebook-assembler";
import { apiRateLimiter } from "@/lib/rate-limiter";

const requestSchema = z.object({
  text: z.string().min(1, "Paper text is required"),
  apiKey: z.string().min(1, "API key is required"),
  title: z.string().default("Research Paper"),
});

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!apiRateLimiter.check(ip)) {
    return new Response(
      JSON.stringify({ error: "Too many requests. Please try again later." }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }
  const body = await request.json().catch(() => null);

  if (!body) {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: parsed.error.issues[0].message }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const { text, apiKey, title } = parsed.data;
  const client = createOpenAIClient(apiKey);
  const { system, user } = buildNotebookPrompt(text, title);

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        let notebookJson = "";

        for await (const event of streamNotebookGeneration(client, system, user)) {
          if (event.type === "progress") {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "progress", message: event.data })}\n\n`)
            );
          } else if (event.type === "content") {
            try {
              const notebook = assembleNotebook(event.data, title);
              notebookJson = JSON.stringify(notebook);
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "complete", notebook: notebookJson })}\n\n`
                )
              );
            } catch (assemblyError) {
              const msg = assemblyError instanceof Error ? assemblyError.message : "Assembly failed";
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "error", message: `Notebook assembly failed: ${msg}` })}\n\n`
                )
              );
            }
          } else if (event.type === "error") {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "error", message: event.data })}\n\n`
              )
            );
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Stream error";
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", message })}\n\n`
          )
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
