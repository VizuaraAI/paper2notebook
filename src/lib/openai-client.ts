import OpenAI from "openai";

export function createOpenAIClient(apiKey: string): OpenAI {
  return new OpenAI({ apiKey });
}

export async function* streamNotebookGeneration(
  client: OpenAI,
  systemPrompt: string,
  userPrompt: string
): AsyncGenerator<{ type: "progress" | "content" | "error"; data: string }> {
  yield { type: "progress", data: "Analyzing paper structure..." };

  try {
    const stream = await client.chat.completions.create({
      model: "gpt-5.4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      stream: true,
      temperature: 0.3,
      max_completion_tokens: 32000,
    });

    yield { type: "progress", data: "Identifying key algorithms..." };

    let fullContent = "";
    let chunkCount = 0;

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || "";
      fullContent += delta;
      chunkCount++;

      if (chunkCount === 50) {
        yield { type: "progress", data: "Generating implementation code..." };
      }
      if (chunkCount === 150) {
        yield { type: "progress", data: "Creating synthetic datasets..." };
      }
      if (chunkCount === 300) {
        yield { type: "progress", data: "Building experiments and visualizations..." };
      }
      if (chunkCount === 500) {
        yield { type: "progress", data: "Finalizing notebook structure..." };
      }
    }

    yield { type: "progress", data: "Assembling notebook..." };
    yield { type: "content", data: fullContent };
  } catch (error) {
    if (error instanceof OpenAI.AuthenticationError) {
      yield { type: "error", data: "Invalid API key. Please check your OpenAI API key." };
    } else if (error instanceof OpenAI.RateLimitError) {
      yield { type: "error", data: "Rate limit exceeded. Please wait and try again." };
    } else if (error instanceof OpenAI.APIConnectionError) {
      yield { type: "error", data: "Connection failed. Please check your internet connection." };
    } else {
      yield { type: "error", data: "Generation failed. Please try again." };
    }
  }
}
