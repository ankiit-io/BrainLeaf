import { NextResponse } from "next/server";

import { searchBookSegments } from "@/lib/actions/book.actions";

type ToolCallPayload = {
  id?: string;
  name?: string;
  toolName?: string;
  parameters?: Record<string, unknown>;
  args?: Record<string, unknown>;
  arguments?: Record<string, unknown> | string;
  function?: {
    name?: string;
    arguments?: Record<string, unknown> | string;
  };
};

type NormalizedToolCall = {
  id?: string;
  name: string | null;
  parameters: Record<string, unknown>;
};

const SEARCH_TOOL_NAME = "search book";
const NO_INFORMATION_FOUND = "no information found about this topic";

const getToolCalls = (body: Record<string, unknown>) => {
  const candidates = [
    body.toolCalls,
    body.tool_calls,
    body.message && (body.message as Record<string, unknown>).toolCalls,
    body.message && (body.message as Record<string, unknown>).tool_calls,
    body.toolCall,
    body.tool_call,
    body.calls,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate as ToolCallPayload[];
    }
  }

  return [] as ToolCallPayload[];
};

const parseArguments = (
  args: ToolCallPayload["arguments"] | ToolCallPayload["function"],
): Record<string, unknown> => {
  if (!args) {
    return {};
  }

  const rawArgs =
    typeof args === "object" && "arguments" in args ? args.arguments : args;

  if (!rawArgs) {
    return {};
  }

  if (typeof rawArgs === "string") {
    try {
      return JSON.parse(rawArgs) as Record<string, unknown>;
    } catch {
      return {};
    }
  }

  if (typeof rawArgs === "object") {
    return rawArgs as Record<string, unknown>;
  }

  return {};
};

const normalizeToolCall = (call: ToolCallPayload): NormalizedToolCall => {
  const name =
    call.name ||
    call.toolName ||
    call.function?.name ||
    (typeof call.function === "string" ? call.function : null);

  const parameters =
    (call.parameters && typeof call.parameters === "object"
      ? call.parameters
      : null) ||
    (call.args && typeof call.args === "object" ? call.args : null) ||
    parseArguments(call.function ?? call.arguments);

  return {
    id: call.id,
    name: typeof name === "string" ? name : null,
    parameters,
  };
};

const getParam = (params: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = params[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return null;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const toolCalls = getToolCalls(body);
    const normalizedCalls = toolCalls.map(normalizeToolCall);
    const searchCalls = normalizedCalls.filter(
      (call) => call.name === SEARCH_TOOL_NAME,
    );

    if (searchCalls.length === 0) {
      return NextResponse.json({ results: [] });
    }

    const results = await Promise.all(
      searchCalls.map(async (call) => {
        const bookId = getParam(call.parameters, [
          "bookId",
          "book_id",
          "bookID",
          "book",
          "id",
        ]);
        const query = getParam(call.parameters, [
          "query",
          "q",
          "search",
          "text",
        ]);

        if (!bookId || !query) {
          return {
            toolCallId: call.id,
            result: NO_INFORMATION_FOUND,
          };
        }

        const searchResult = await searchBookSegments(bookId, query, 3);
        const segments = searchResult.success ? (searchResult.data ?? []) : [];
        const combinedText = Array.isArray(segments)
          ? segments
              .map((segment) =>
                typeof segment?.content === "string" ? segment.content : "",
              )
              .filter((content) => content.trim().length > 0)
              .join("\n\n")
          : "";

        return {
          toolCallId: call.id,
          result: combinedText.length > 0 ? combinedText : NO_INFORMATION_FOUND,
        };
      }),
    );

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Error handling VAPI search-book tool call:", error);
    return NextResponse.json(
      { error: "Failed to handle tool call." },
      { status: 500 },
    );
  }
}
