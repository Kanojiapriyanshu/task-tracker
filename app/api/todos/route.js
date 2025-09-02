// app/api/todos/route.js
import { NextResponse } from "next/server";
import { getTodos, createTodo, getTodoStats } from "@/lib/store";

// Constants for validation and caching
const MAX_QUERY_LENGTH = 100;
const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 1000;
const VALID_STATUSES = new Set(["all", "active", "completed"]);

/**
 * Validate and sanitize query parameters
 */
function validateQueryParams(searchParams) {
  const status = searchParams.get("status") || "all";
  const q = searchParams.get("q") || "";
  const includeStats = searchParams.get("includeStats") === "true";

  // Validate status
  if (!VALID_STATUSES.has(status)) {
    throw new Error(`Invalid status. Must be one of: ${Array.from(VALID_STATUSES).join(", ")}`);
  }

  // Validate and truncate query length
  const sanitizedQuery = q.length > MAX_QUERY_LENGTH ? q.substring(0, MAX_QUERY_LENGTH) : q;

  return { status, q: sanitizedQuery, includeStats };
}

/**
 * Validate request body for POST requests
 */
function validateTodoData(body) {
  if (!body || typeof body !== "object") {
    throw new Error("Request body must be a valid JSON object");
  }

  const { title, description = "" } = body;

  // Validate title
  if (typeof title !== "string") {
    throw new Error("Title must be a string");
  }

  if (title.length > MAX_TITLE_LENGTH) {
    throw new Error(`Title must be ${MAX_TITLE_LENGTH} characters or less`);
  }

  // Validate description
  if (description && typeof description !== "string") {
    throw new Error("Description must be a string");
  }

  if (description && description.length > MAX_DESCRIPTION_LENGTH) {
    throw new Error(`Description must be ${MAX_DESCRIPTION_LENGTH} characters or less`);
  }

  return {
    title: title.trim(),
    description: description.trim()
  };
}

/**
 * Create standardized error response
 */
function createErrorResponse(message, status = 400) {
  return NextResponse.json(
    { 
      error: message,
      timestamp: new Date().toISOString()
    }, 
    { 
      status,
      headers: {
        "Content-Type": "application/json"
      }
    }
  );
}

/**
 * Create standardized success response
 */
function createSuccessResponse(data, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": status === 200 ? "no-cache" : "no-store"
    }
  });
}

/**
 * GET /api/todos?status=all|active|completed&q=search&includeStats=true
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const { status, q, includeStats } = validateQueryParams(searchParams);

    // Get todos with validated parameters
    const todos = getTodos({ status, q });

    // Prepare response data
    const responseData = {
      todos,
      meta: {
        count: todos.length,
        query: q,
        status,
        timestamp: new Date().toISOString()
      }
    };

    // Include stats if requested
    if (includeStats) {
      responseData.stats = getTodoStats();
    }

    return createSuccessResponse(responseData);

  } catch (error) {
    console.error("GET /api/todos error:", error);
    return createErrorResponse(error.message);
  }
}

/**
 * POST /api/todos
 * body: { title, description? }
 */
export async function POST(req) {
  try {
    // Parse and validate request body
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      return createErrorResponse("Invalid JSON in request body");
    }

    const validatedData = validateTodoData(body);
    
    // Create the todo
    const todo = createTodo(validatedData);
    
    // Return created todo with metadata
    const responseData = {
      todo,
      meta: {
        created: true,
        timestamp: new Date().toISOString()
      }
    };

    return createSuccessResponse(responseData, 201);

  } catch (error) {
    console.error("POST /api/todos error:", error);
    
    // Return appropriate status code based on error type
    const status = error.message.includes("required") || 
                   error.message.includes("must be") ? 400 : 500;
    
    return createErrorResponse(error.message, status);
  }
}

/**
 * Handle unsupported HTTP methods
 */
export async function handler(req) {
  const method = req.method;
  
  if (!["GET", "POST"].includes(method)) {
    return NextResponse.json(
      { 
        error: `Method ${method} not allowed`,
        allowedMethods: ["GET", "POST"]
      },
      { 
        status: 405,
        headers: {
          "Allow": "GET, POST"
        }
      }
    );
  }
}