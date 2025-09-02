"use client";
import { memo } from "react";

/**
 * TodoList - displays todos with toggle + delete actions
 */
function TodoList({ todos = [], onToggle, onDelete }) {
  if (!todos.length) {
    return <p className="p-4 text-gray-500">No tasks found.</p>;
  }

  return (
    <ul className="space-y-2 p-4">
      {todos.map(({ id, title, description, completed, createdAt }) => (
        <li
          key={id}
          className="flex justify-between items-center border p-3 rounded shadow-sm hover:bg-gray-50 transition"
        >
          <div className="flex flex-col">
            <h3
              className={`font-semibold ${
                completed ? "line-through text-gray-500" : ""
              }`}
            >
              {title}
            </h3>
            {description && (
              <p className="text-sm text-gray-600">{description}</p>
            )}
            <p className="text-xs text-gray-400">
              Created: {new Date(createdAt).toLocaleString()}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => onToggle(id)}
              aria-label={completed ? "Mark as not done" : "Mark as done"}
              className={`px-3 py-1 rounded text-white ${
                completed ? "bg-gray-500" : "bg-green-600"
              }`}
            >
              {completed ? "Undo" : "Done"}
            </button>

            <button
              onClick={() => onDelete(id)}
              aria-label="Delete task"
              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default memo(TodoList);
