// app/api/todos/[id]/route.js
import { NextResponse } from "next/server";
import { toggleTodo, deleteTodo, updateTodo, getTodos } from "@/lib/store";

// Constants for validation
const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 1000;
const MAX_ID_VALUE = Number.MAX_SAFE_INTEGER;

/**
 * Validate and parse todo ID
 */
function validateTodoId(id) {
  // Check if id exists
  if (!id) {
    throw new Error("Todo ID is required");
  }

  // Convert to number and validate
  const numericId = Number(id);
  
  if (isNaN(numericId) || numericId <= 0 || numericId > MAX_ID_VALUE) {
    throw new Error("Invalid todo ID format");
  }

  return numericId;
}

/**
 * Validate update data for PATCH requests
 */
function validateUpdateData(body) {
  if (!body || typeof body !== "object") {
    throw new Error("Request body must be a valid JSON object");
  }

  const allowedFields = ['title', 'description', 'completed'];
  const updates = {};

  // Only process allowed fields
  for (const [key, value] of Object.entries(body)) {
    if (!allowedFields.includes(key)) {
      throw new Error(`Field '${key}' is not allowed for updates`);
    }

    // Validate specific field types and constraints
    switch (key) {
      case 'title':
        if (typeof value !== 'string') {
          throw new Error('Title must be a string');
        }
        if (value.length > MAX_TITLE_LENGTH) {
          throw new Error(`Title must be ${MAX_TITLE_LENGTH} characters or less`);
        }
        updates.title = value.trim();
        break;

      case 'description':
        if (value !== null && typeof value !== 'string') {
          throw new Error('Description must be a string or null');
        }
        if (value && value.length > MAX_DESCRIPTION_LENGTH) {
          throw new Error(`Description must be ${MAX_DESCRIPTION_LENGTH} characters or less`);
        }
        updates.description = value ? value.trim() : '';
        break;

      case 'completed':
        if (typeof value !== 'boolean') {
          throw new Error('Completed status must be a boolean');
        }
        updates.completed = value;
        break;
    }
  }

  if (Object.keys(updates).length === 0) {
    throw new Error('No valid fields provided for update');
  }

  return updates;
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
function createSuccessResponse(data, status = 200, action = null) {
  const response = {
    ...data,
    meta: {
      timestamp: new Date().toISOString()
    }
  };

  if (action) {
    response.meta.action = action;
  }

  return NextResponse.json(response, {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache"
    }
  });
}

/**
 * Handle todo not found
 */
function handleNotFound(id) {
  return createErrorResponse(`Todo with ID ${id} not found`, 404);
}

/**
 * GET /api/todos/:id - Get a specific todo
 */
export async function GET(req, { params }) {
  try {
    const id = validateTodoId(params.id);
    
    // Get all todos and find the specific one
    const allTodos = getTodos();
    const todo = allTodos.find(t => t.id === id);
    
    if (!todo) {
      return handleNotFound(id);
    }

    return createSuccessResponse({ todo });

  } catch (error) {
    console.error(`GET /api/todos/${params.id} error:`, error);
    return createErrorResponse(error.message);
  }
}

/**
 * PATCH /api/todos/:id - Update todo (including toggle completion)
 */
export async function PATCH(req, { params }) {
  try {
    const id = validateTodoId(params.id);
    
    // Handle both toggle (empty body) and update (with body) operations
    let updates = {};
    
    try {
      const body = await req.json();
      
      // If body is empty or only contains a toggle flag, treat as toggle
      if (!body || (Object.keys(body).length === 1 && 'toggle' in body)) {
        const todo = toggleTodo(id);
        if (!todo) {
          return handleNotFound(id);
        }
        return createSuccessResponse({ todo }, 200, 'toggled');
      } else {
        // Handle regular updates
        updates = validateUpdateData(body);
      }
    } catch (parseError) {
      // If JSON parsing fails, treat as toggle operation
      const todo = toggleTodo(id);
      if (!todo) {
        return handleNotFound(id);
      }
      return createSuccessResponse({ todo }, 200, 'toggled');
    }

    // Perform update
    const updatedTodo = updateTodo(id, updates);
    
    if (!updatedTodo) {
      return handleNotFound(id);
    }

    return createSuccessResponse({ todo: updatedTodo }, 200, 'updated');

  } catch (error) {
    console.error(`PATCH /api/todos/${params.id} error:`, error);
    return createErrorResponse(error.message);
  }
}

/**
 * DELETE /api/todos/:id - Delete a todo
 */
export async function DELETE(req, { params }) {
  try {
    const id = validateTodoId(params.id);
    const deletedTodo = deleteTodo(id);
    
    if (!deletedTodo) {
      return handleNotFound(id);
    }

    return createSuccessResponse({ 
      todo: deletedTodo,
      message: `Todo with ID ${id} has been deleted`
    }, 200, 'deleted');

  } catch (error) {
    console.error(`DELETE /api/todos/${params.id} error:`, error);
    return createErrorResponse(error.message);
  }
}

/**
 * PUT /api/todos/:id - Complete replacement of todo
 */
export async function PUT(req, { params }) {
  try {
    const id = validateTodoId(params.id);
    
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      return createErrorResponse("Invalid JSON in request body");
    }

    // Validate required fields for complete replacement
    if (!body.title) {
      return createErrorResponse("Title is required for complete replacement");
    }

    const updates = validateUpdateData({
      title: body.title,
      description: body.description || '',
      completed: Boolean(body.completed)
    });

    const updatedTodo = updateTodo(id, updates);
    
    if (!updatedTodo) {
      return handleNotFound(id);
    }

    return createSuccessResponse({ todo: updatedTodo }, 200, 'replaced');

  } catch (error) {
    console.error(`PUT /api/todos/${params.id} error:`, error);
    return createErrorResponse(error.message);
  }
}

/**
 * Handle unsupported HTTP methods
 */
export async function handler(req) {
  const method = req.method;
  
  if (!["GET", "PATCH", "PUT", "DELETE"].includes(method)) {
    return NextResponse.json(
      { 
        error: `Method ${method} not allowed`,
        allowedMethods: ["GET", "PATCH", "PUT", "DELETE"]
      },
      { 
        status: 405,
        headers: {
          "Allow": "GET, PATCH, PUT, DELETE"
        }
      }
    );
  }
}