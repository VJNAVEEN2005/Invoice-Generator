import { useState, useEffect, useRef } from "react";
import { twMerge } from "tailwind-merge";

export function GlassAutocomplete({ 
  className, 
  value, 
  onChange, 
  onSelect, 
  suggestions = [], 
  renderSuggestion,
  getSuggestionValue,
  ...props 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef(null);

  useEffect(() => {
    // Filter suggestions based on input value
    if (!value || value.trim() === "") {
      setFilteredSuggestions([]);
      return;
    }

    const lowerValue = String(value).toLowerCase();
    const filtered = suggestions.filter(item => {
      const itemValue = getSuggestionValue ? getSuggestionValue(item) : (typeof item === 'string' ? item : JSON.stringify(item));
      return itemValue && String(itemValue).toLowerCase().includes(lowerValue);
    });

    setFilteredSuggestions(filtered);
    // Only open if we have matches and the value isn't exactly one of the matches (to avoid reopening after selection)
    const exactMatch = filtered.length === 1 && (getSuggestionValue ? getSuggestionValue(filtered[0]) : filtered[0]) === value;
    setIsOpen(filtered.length > 0 && !exactMatch);
    setHighlightedIndex(-1);
  }, [value, suggestions, getSuggestionValue]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e) => {
    if (!isOpen) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex(prev => (prev < filteredSuggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : filteredSuggestions.length - 1));
    } else if (e.key === "Enter") {
      if (highlightedIndex >= 0) {
        e.preventDefault();
        handleSelect(filteredSuggestions[highlightedIndex]);
      } else {
          setIsOpen(false);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    } else if (e.key === "Tab") {
        if (highlightedIndex >= 0) {
            handleSelect(filteredSuggestions[highlightedIndex]);
        }
        setIsOpen(false);
    }
  };

  const handleSelect = (item) => {
    if (onSelect) {
      onSelect(item);
    } else {
        // Default behavior if no onSelect: just update the input text
        const text = getSuggestionValue ? getSuggestionValue(item) : item;
        onChange({ target: { value: text } });
    }
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <input
        className={twMerge("glass-input w-full", className)}
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
            if (filteredSuggestions.length > 0) setIsOpen(true);
        }}
        autoComplete="off"
        {...props}
      />
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white/90 backdrop-blur-md border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
          {filteredSuggestions.map((item, index) => (
            <div
              key={index}
              className={twMerge(
                "px-4 py-2 cursor-pointer transition-colors text-sm text-slate-700",
                index === highlightedIndex ? "bg-indigo-50 text-indigo-700" : "hover:bg-slate-50"
              )}
              onClick={() => handleSelect(item)}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              {renderSuggestion ? renderSuggestion(item) : (getSuggestionValue ? getSuggestionValue(item) : item)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
