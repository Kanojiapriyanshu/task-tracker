// lib/store.js
let todos = [];
let idCounter = 1;

// Cache for common queries to avoid repeated filtering
const queryCache = new Map();
const CACHE_SIZE_LIMIT = 50;

/**
 * Clear query cache when todos are modified
 */
function clearCache() {
  queryCache.clear();
}

/**
 * Generate cache key for query parameters
 */
function getCacheKey(filters) {
  return JSON.stringify(filters);
}

/**
 * Get todos with optional filters: { status: "all"|"active"|"completed", q: string }
 */
export function getTodos({ status = "all", q = "" } = {}) {
  const cacheKey = getCacheKey({ status, q });
  
  // Return cached result if available
  if (queryCache.has(cacheKey)) {
    return queryCache.get(cacheKey);
  }
  
  let results = todos;
  
  // Apply status filter first (more selective)
  if (status !== "all") {
    const isCompleted = status === "completed";
    results = results.filter(todo => todo.completed === isCompleted);
  }
  
  // Apply search filter
  if (q) {
    const query = q.toLowerCase();
    results = results.filter(todo => {
      return todo.title.toLowerCase().includes(query) ||
             (todo.description && todo.description.toLowerCase().includes(query));
    });
  }
  
  // Create a shallow copy to prevent external mutations
  const finalResults = [...results];
  
  // Cache the result (with size limit)
  if (queryCache.size >= CACHE_SIZE_LIMIT) {
    const firstKey = queryCache.keys().next().value;
    queryCache.delete(firstKey);
  }
  queryCache.set(cacheKey, finalResults);
  
  return finalResults;
}

/**
 * Create a new todo
 */
export function createTodo({ title, description = "" }) {
  const trimmedTitle = title?.trim();
  if (!trimmedTitle) {
    throw new Error("Title is required");
  }
  
  const newTodo = {
    id: idCounter++,
    title: trimmedTitle,
    description: description || "",
    completed: false,
    createdAt: new Date().toISOString(),
  };
  
  todos.push(newTodo);
  clearCache();
  
  return newTodo;
}

/**
 * Update an existing todo
 */
export function updateTodo(id, updates) {
  const todoIndex = todos.findIndex(todo => todo.id === Number(id));
  if (todoIndex === -1) return null;
  
  const todo = todos[todoIndex];
  const updatedTodo = { ...todo, ...updates };
  
  // Validate title if it's being updated
  if (updates.title !== undefined) {
    const trimmedTitle = updates.title?.trim();
    if (!trimmedTitle) {
      throw new Error("Title is required");
    }
    updatedTodo.title = trimmedTitle;
  }
  
  todos[todoIndex] = updatedTodo;
  clearCache();
  
  return updatedTodo;
}

/**
 * Toggle todo completion
 */
export function toggleTodo(id) {
  const todo = todos.find(t => t.id === Number(id));
  if (!todo) return null;
  
  todo.completed = !todo.completed;
  clearCache();
  
  return todo;
}

/**
 * Delete a todo by id
 */
export function deleteTodo(id) {
  const idx = todos.findIndex(t => t.id === Number(id));
  if (idx === -1) return null;
  
  const deletedTodo = todos.splice(idx, 1)[0];
  clearCache();
  
  return deletedTodo;
}

/**
 * Bulk operations for better performance
 */
export function bulkToggleTodos(ids) {
  const updatedTodos = [];
  const idSet = new Set(ids.map(id => Number(id)));
  
  todos.forEach(todo => {
    if (idSet.has(todo.id)) {
      todo.completed = !todo.completed;
      updatedTodos.push(todo);
    }
  });
  
  if (updatedTodos.length > 0) {
    clearCache();
  }
  
  return updatedTodos;
}

export function bulkDeleteTodos(ids) {
  const idSet = new Set(ids.map(id => Number(id)));
  const deletedTodos = [];
  
  todos = todos.filter(todo => {
    if (idSet.has(todo.id)) {
      deletedTodos.push(todo);
      return false;
    }
    return true;
  });
  
  if (deletedTodos.length > 0) {
    clearCache();
  }
  
  return deletedTodos;
}

/**
 * Get todo count by status
 */
export function getTodoStats() {
  const stats = {
    total: todos.length,
    active: 0,
    completed: 0
  };
  
  todos.forEach(todo => {
    if (todo.completed) {
      stats.completed++;
    } else {
      stats.active++;
    }
  });
  
  return stats;
}

/**
 * Clear all todos
 */
export function clearAllTodos() {
  const count = todos.length;
  todos = [];
  idCounter = 1;
  clearCache();
  return count;
}