"use client";
import { useEffect, useState, useCallback } from "react";
import CreateTodoForm from "@/components/CreateTodoForm";
import Filters from "@/components/Filters";
import TodoList from "@/components/TodoList";

/**
 * Main page client component
 */
export default function Page() {
  const [todos, setTodos] = useState([]);
  const [filters, setFilters] = useState({ status: "all", query: "" });

  // ✅ useCallback to prevent re-creating function on every render
const fetchTodos = useCallback(async (custom = filters) => {
  // Ensure defaults
  const status = custom.status ?? "all";
  const query = custom.query ?? "";
  try {
    const url = `/api/todos?status=${encodeURIComponent(status)}&q=${encodeURIComponent(query)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch todos");
    const data = await res.json();
    setTodos(data.todos || data); // If our API returns { todos: [...] }
  } catch (error) {
    console.error("Error fetching todos:", error);
  }
}, [filters]);

  // fetch once on mount
  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  const handleToggle = async (id) => {
    try {
      const res = await fetch(`/api/todos/${id}`, { method: "PATCH" });
      if (!res.ok) throw new Error("Failed to toggle todo");
      fetchTodos();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/todos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete todo");
      fetchTodos();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Task Tracker</h1>

      {/* Form */}
      <CreateTodoForm onCreated={fetchTodos} />

      {/* Filters */}
      <Filters
        onFilter={(f) => {
          setFilters(f);
          fetchTodos(f);
        }}
      />

      {/* Todo List */}
      <TodoList todos={todos} onToggle={handleToggle} onDelete={handleDelete} />
    </main>
  );
}
