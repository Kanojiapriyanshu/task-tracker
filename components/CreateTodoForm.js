"use client";
import { useState, useCallback, useRef, useEffect } from "react";

// Constants for validation and UI
const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 1000;
const MIN_TITLE_LENGTH = 1;

/**
 * CreateTodoForm - calls onCreated(newTodo) after success
 */
export default function CreateTodoForm({ onCreated, disabled = false, autoFocus = false }) {
  const [formData, setFormData] = useState({
    title: "",
    description: ""
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  
  const titleInputRef = useRef(null);
  const formRef = useRef(null);

  // Auto-focus title input when requested
  useEffect(() => {
    if (autoFocus && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [autoFocus]);

  // Memoized validation function
  const validateForm = useCallback(() => {
    const errors = {};
    const trimmedTitle = formData.title.trim();

    if (!trimmedTitle) {
      errors.title = "Title is required";
    } else if (trimmedTitle.length < MIN_TITLE_LENGTH) {
      errors.title = "Title must be at least 1 character";
    } else if (trimmedTitle.length > MAX_TITLE_LENGTH) {
      errors.title = `Title must be ${MAX_TITLE_LENGTH} characters or less`;
    }

    if (formData.description.length > MAX_DESCRIPTION_LENGTH) {
      errors.description = `Description must be ${MAX_DESCRIPTION_LENGTH} characters or less`;
    }

    return errors;
  }, [formData]);

  // Real-time validation
  useEffect(() => {
    const errors = validateForm();
    setValidationErrors(errors);
  }, [validateForm]);

  // Optimized input handler using single state update
  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear general error when user starts typing
    if (error) setError("");
  }, [error]);

  // Memoized submit handler
  const handleSubmit = useCallback(async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    
    // Prevent double submission
    if (isSubmitting || disabled) return;

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const requestBody = {
        title: formData.title.trim(),
        description: formData.description.trim()
      };

      const res = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}: ${res.statusText}`);
      }

      // Handle both old and new API response formats
      const todo = data.todo || data;
      
      // Reset form on success
      setFormData({ title: "", description: "" });
      setValidationErrors({});
      
      // Call success callback
      if (onCreated) {
        onCreated(todo);
      }

      // Focus back to title input for quick consecutive additions
      if (titleInputRef.current) {
        titleInputRef.current.focus();
      }

    } catch (err) {
      console.error("Error creating todo:", err);
      setError(err.message || "Failed to create todo. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, isSubmitting, disabled, validateForm, onCreated]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e) => {
    // Ctrl/Cmd + Enter to submit
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e);
    }
    // Escape to clear form
    if (e.key === 'Escape') {
      setFormData({ title: "", description: "" });
      setError("");
      setValidationErrors({});
    }
  }, [handleSubmit]);

  const isFormValid = Object.keys(validationErrors).length === 0 && formData.title.trim();
  const titleCharsLeft = MAX_TITLE_LENGTH - formData.title.length;
  const descCharsLeft = MAX_DESCRIPTION_LENGTH - formData.description.length;

  return (
    <div 
      ref={formRef}
      onKeyDown={handleKeyDown}
      className="space-y-4 p-6 border border-gray-200 rounded-lg bg-gray-50 shadow-sm"
    >
      <div className="space-y-2">
        <label htmlFor="todo-title" className="block text-sm font-medium text-gray-900">
          Title <span className="text-red-500" aria-label="required">*</span>
        </label>
        <div className="relative">
          <input
            id="todo-title"
            ref={titleInputRef}
            type="text"
            className={`
              w-full px-3 py-2 border rounded-md transition-colors duration-200
              focus:ring-2 focus:ring-blue-500 focus:border-transparent
              ${validationErrors.title 
                ? 'border-red-300 bg-red-50' 
                : formData.title.trim() 
                  ? 'border-green-300 bg-white' 
                  : 'border-gray-300 bg-white'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="What needs to be done?"
            maxLength={MAX_TITLE_LENGTH}
            disabled={disabled || isSubmitting}
            aria-invalid={!!validationErrors.title}
            aria-describedby={validationErrors.title ? "title-error" : "title-hint"}
            required
          />
          <div className="absolute right-3 top-2 text-xs text-gray-400">
            {titleCharsLeft < 20 && (
              <span className={titleCharsLeft < 0 ? 'text-red-500' : 'text-yellow-600'}>
                {titleCharsLeft}
              </span>
            )}
          </div>
        </div>
        {validationErrors.title && (
          <p id="title-error" className="text-sm text-red-600" role="alert">
            {validationErrors.title}
          </p>
        )}
        {!validationErrors.title && (
          <p id="title-hint" className="text-xs text-gray-500">
            Press Ctrl+Enter to quickly add task • Escape to clear
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="todo-description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <div className="relative">
          <textarea
            id="todo-description"
            className={`
              w-full px-3 py-2 border rounded-md transition-colors duration-200 resize-vertical min-h-[80px]
              focus:ring-2 focus:ring-blue-500 focus:border-transparent
              ${validationErrors.description 
                ? 'border-red-300 bg-red-50' 
                : 'border-gray-300 bg-white'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Add more details (optional)..."
            maxLength={MAX_DESCRIPTION_LENGTH}
            disabled={disabled || isSubmitting}
            aria-invalid={!!validationErrors.description}
            aria-describedby={validationErrors.description ? "desc-error" : "desc-hint"}
            rows={3}
          />
          <div className="absolute bottom-2 right-3 text-xs text-gray-400">
            {descCharsLeft < 100 && (
              <span className={descCharsLeft < 0 ? 'text-red-500' : 'text-yellow-600'}>
                {descCharsLeft}
              </span>
            )}
          </div>
        </div>
        {validationErrors.description && (
          <p id="desc-error" className="text-sm text-red-600" role="alert">
            {validationErrors.description}
          </p>
        )}
        {!validationErrors.description && formData.description && (
          <p id="desc-hint" className="text-xs text-gray-500">
            {formData.description.length} / {MAX_DESCRIPTION_LENGTH} characters
          </p>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md" role="alert">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500">
          {isFormValid ? "Ready to add task" : "Fill in the title to continue"}
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isFormValid || isSubmitting || disabled}
          className={`
            px-6 py-2 rounded-md font-medium transition-all duration-200
            focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            ${!isFormValid || isSubmitting || disabled
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md'
            }
          `}
        >
          {isSubmitting ? (
            <>
              <svg className="inline w-4 h-4 mr-2 animate-spin" viewBox="0 0 24 24">
                <circle 
                  className="opacity-25" 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="currentColor" 
                  strokeWidth="4"
                  fill="none"
                />
                <path 
                  className="opacity-75" 
                  fill="currentColor" 
                  d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Adding...
            </>
          ) : (
            "Add Task"
          )}
        </button>
      </div>
    </div>
  );
}