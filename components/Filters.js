"use client";
import { useState } from "react";

/**
 * Filters - triggers onFilter({ status, query })
 */
export default function Filters({ onFilter }) {
  const [filters, setFilters] = useState({ status: "all", query: "" });

  const handleChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const applyFilters = () => onFilter?.(filters);

  return (
    <div className="flex gap-2 p-4 items-center">
      <select
        value={filters.status}
        onChange={e => handleChange("status", e.target.value)}
        className="border rounded p-2"
      >
        <option value="all">All</option>
        <option value="active">Active</option>
        <option value="completed">Completed</option>
      </select>

      <input
        placeholder="Search..."
        value={filters.query}
        onChange={e => handleChange("query", e.target.value)}
        className="border rounded p-2 flex-1"
      />

      <button
        onClick={applyFilters}
        className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded"
      >
        Apply
      </button>
    </div>
  );
}
