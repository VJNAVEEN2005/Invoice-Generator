import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

export function CategorySelect({ value, onChange, categories, placeholder = "Category (optional)" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || "");
  const dropdownRef = useRef(null);

  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCategories = categories.filter(cat =>
    cat.toLowerCase().includes(inputValue.toLowerCase())
  );

  const handleSelect = (category) => {
    setInputValue(category);
    onChange({ target: { value: category } });
    setIsOpen(false);
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    onChange(e);
    setIsOpen(true);
  };

  return (
    <div ref={dropdownRef} className="relative">
      <div className="relative">
        <input
          type="text"
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-4 py-2.5 pr-10 text-slate-700 placeholder-slate-400 focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-all font-medium"
        />
        <ChevronDown
          size={16}
          className={`absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </div>

      {isOpen && filteredCategories.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-xl border border-slate-200 shadow-lg max-h-48 overflow-y-auto">
          {filteredCategories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => handleSelect(category)}
              className="w-full text-left px-4 py-2.5 text-slate-700 hover:bg-slate-50 hover:text-accent-primary transition-colors first:rounded-t-xl last:rounded-b-xl font-medium"
            >
              {category}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
