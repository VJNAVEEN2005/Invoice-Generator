import { useState, useEffect, useCallback } from "react";

/**
 * Custom hook for debounced search with fuzzy matching
 * @param {Array} items - Array of items to search
 * @param {Array} searchFields - Fields to search in (e.g., ['name', 'email'])
 * @param {number} delay - Debounce delay in ms (default: 300)
 */
export function useSearch(items, searchFields, delay = 300) {
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedTerm, setDebouncedTerm] = useState("");
    const [filteredItems, setFilteredItems] = useState(items);

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedTerm(searchTerm);
        }, delay);

        return () => clearTimeout(timer);
    }, [searchTerm, delay]);

    // Fuzzy search function
    const fuzzyMatch = useCallback((str, pattern) => {
        if (!pattern) return true;

        const strLower = str.toLowerCase();
        const patternLower = pattern.toLowerCase();

        // Exact match or substring match
        if (strLower.includes(patternLower)) return true;

        // Fuzzy match: check if all characters in pattern appear in order in str
        let patternIdx = 0;
        for (let i = 0; i < strLower.length && patternIdx < patternLower.length; i++) {
            if (strLower[i] === patternLower[patternIdx]) {
                patternIdx++;
            }
        }
        return patternIdx === patternLower.length;
    }, []);

    // Filter items based on debounced search term
    useEffect(() => {
        if (!debouncedTerm.trim()) {
            setFilteredItems(items);
            return;
        }

        const filtered = items.filter(item => {
            return searchFields.some(field => {
                const value = field.split('.').reduce((obj, key) => obj?.[key], item);
                return value && fuzzyMatch(String(value), debouncedTerm);
            });
        });

        setFilteredItems(filtered);
    }, [debouncedTerm, items, searchFields, fuzzyMatch]);

    return {
        searchTerm,
        setSearchTerm,
        filteredItems,
        isSearching: searchTerm !== debouncedTerm,
    };
}
