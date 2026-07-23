"use client";

import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";

interface VariableInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    value: string;
    onValueChange: (val: string) => void;
    variables: Record<string, string>;
    placeholder?: string;
    className?: string;
}

export const VariableInput: React.FC<VariableInputProps> = ({
    value,
    onValueChange,
    variables,
    placeholder,
    className,
    ...props
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [filterText, setFilterText] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [triggerPos, setTriggerPos] = useState<number | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const availableVarKeys = Object.keys(variables);
    const filteredKeys = availableVarKeys.filter(k =>
        k.toLowerCase().includes(filterText.toLowerCase())
    );

    const checkAutocompleteTrigger = (val: string, selectionStart: number | null) => {
        if (selectionStart === null) return;
        const textBeforeCursor = val.slice(0, selectionStart);
        const lastDoubleBrace = textBeforeCursor.lastIndexOf("{{");

        if (lastDoubleBrace !== -1) {
            const textAfterBrace = textBeforeCursor.slice(lastDoubleBrace + 2);
            // Ensure no closing }} between {{ and cursor
            if (!textAfterBrace.includes("}}")) {
                setTriggerPos(lastDoubleBrace);
                setFilterText(textAfterBrace);
                setIsOpen(true);
                setSelectedIndex(0);
                return;
            }
        }
        setIsOpen(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        onValueChange(val);
        checkAutocompleteTrigger(val, e.target.selectionStart);
    };

    const handleSelect = (varKey: string) => {
        if (triggerPos === null || !inputRef.current) return;
        const selectionStart = inputRef.current.selectionStart || value.length;
        const beforeTrigger = value.slice(0, triggerPos);
        const afterCursor = value.slice(selectionStart);

        const newValue = `${beforeTrigger}{{${varKey}}}${afterCursor}`;
        onValueChange(newValue);
        setIsOpen(false);

        setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.focus();
                const newCursorPos = triggerPos + varKey.length + 4; // {{ + key + }}
                inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
            }
        }, 0);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (isOpen && filteredKeys.length > 0) {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % filteredKeys.length);
                return;
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + filteredKeys.length) % filteredKeys.length);
                return;
            } else if (e.key === "Enter" || e.key === "Tab") {
                e.preventDefault();
                handleSelect(filteredKeys[selectedIndex]);
                return;
            } else if (e.key === "Escape") {
                setIsOpen(false);
                return;
            }
        }
        if (props.onKeyDown) {
            props.onKeyDown(e);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div ref={containerRef} className="relative flex-1 w-full">
            <Input
                {...props}
                ref={inputRef}
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onClick={(e) => checkAutocompleteTrigger(value, (e.target as HTMLInputElement).selectionStart)}
                placeholder={placeholder}
                className={className}
            />

            {isOpen && availableVarKeys.length > 0 && (
                <div className="absolute left-0 top-full mt-1 z-50 w-full min-w-[200px] max-h-48 overflow-y-auto rounded-xl border border-white/10 bg-card/95 backdrop-blur-md shadow-2xl p-1.5 animate-in fade-in slide-in-from-top-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1 border-b border-white/5">
                        Variables Autocomplete ({filteredKeys.length})
                    </div>
                    {filteredKeys.length === 0 ? (
                        <div className="text-xs text-muted-foreground p-2">No matching variables</div>
                    ) : (
                        filteredKeys.map((key, idx) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => handleSelect(key)}
                                onMouseEnter={() => setSelectedIndex(idx)}
                                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono flex items-center justify-between transition-colors ${idx === selectedIndex
                                        ? "bg-primary/20 text-primary border border-primary/30"
                                        : "text-foreground hover:bg-white/5"
                                    }`}
                            >
                                <span className="font-bold text-cyan-400">{`{{${key}}}`}</span>
                                <span className="text-[10px] text-muted-foreground truncate max-w-[120px] ml-2">
                                    {variables[key]}
                                </span>
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};
