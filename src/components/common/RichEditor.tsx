import React, { useState, useRef, useEffect } from "react";
import {
    Link,
    Bold,
    Italic,
    Underline,
    Strikethrough,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    List,
    Highlighter,
    Tag
} from "lucide-react";
import AlertPopup from "./alertPopup";

// ─── Rich Text Toolbar Button ─────────────────────────────────────────────────
interface ToolbarBtnProps {
    onClick: () => void;
    title: string;
    active?: boolean;
    children: React.ReactNode;
}
export function ToolbarBtn({ onClick, title, active, children }: ToolbarBtnProps) {
    return (
        <button
            type="button"
            onMouseDown={(e) => {
                e.preventDefault();
                onClick();
            }}
            title={title}
            className={`h-7 w-7 flex items-center justify-center rounded transition-colors ${active ? "bg-indigo-100 text-indigo-700" : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"}`}
        >
            {children}
        </button>
    );
}

// ─── Rich Text Editor Component ───────────────────────────────────────────────
export interface RichEditorProps {
    html: string;
    onChange: (html: string) => void;
    variables?: string[];
}
export function RichEditor({ html, onChange, variables = [] }: RichEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const lastHtmlRef = useRef("");
    const savedSelectionRef = useRef<{ node: Node; offset: number } | null>(null);
    const savedRangeRef = useRef<Range | null>(null);
    const colorSavedRangeRef = useRef<Range | null>(null);
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // Prevents useEffect from resetting the DOM while user is actively typing
    const isTypingRef = useRef(false);
    const [linkModalOpen, setLinkModalOpen] = useState(false);
    const [linkUrl, setLinkUrl] = useState("");
    const [currFont, setCurrFont] = useState("'Times New Roman', Times, serif");
    const [currSize, setCurrSize] = useState<string>("10");
    const [currColor, setCurrColor] = useState<string>("#000000");
    const [currBgColor, setCurrBgColor] = useState<string>("#ffffff");

    // Reverse map to find nearest valid px size
    const findNearestSize = (px: number | string): string => {
        const size = typeof px === "string" ? parseInt(px, 10) : px;
        if (size <= 10) return "10";
        if (size <= 14) return "14";
        if (size <= 18) return "18";
        return "32";
    };

    // Only update the editor DOM when the template changes externally (e.g. opening a different template)
    // Never update while the user is typing — that would reset the cursor position
    useEffect(() => {
        if (editorRef.current && html !== lastHtmlRef.current && !isTypingRef.current) {
            editorRef.current.innerHTML = html;
            lastHtmlRef.current = html;
        }
    }, [html]);

    const exec = (command: string, value?: string) => {
        editorRef.current?.focus();
        document.execCommand(command, false, value);
        if (editorRef.current) {
            const newHtml = editorRef.current.innerHTML;
            lastHtmlRef.current = newHtml;
            onChange(newHtml);
        }
    };

    const saveCaretPosition = () => {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            savedSelectionRef.current = {
                node: range.startContainer,
                offset: range.startOffset,
            };
            savedRangeRef.current = range.cloneRange();
        }
    };

    const restoreCaretAndInsert = (text: string) => {
        editorRef.current?.focus();
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            range.deleteContents();
            // Create a span for the variable chip inside editor
            const span = document.createElement("span");
            span.className = "var-chip";
            span.style.cssText =
                "background:#eef2ff;color:#4338ca;border-radius:4px;padding:1px 5px;font-size:12px;font-family:monospace;";
            span.contentEditable = "false";
            span.textContent = text;
            range.insertNode(span);
            // Move cursor after chip
            const newRange = document.createRange();
            newRange.setStartAfter(span);
            newRange.collapse(true);
            sel.removeAllRanges();
            sel.addRange(newRange);
        } else {
            exec(
                "insertHTML",
                `<span style="background:#eef2ff;color:#4338ca;border-radius:4px;padding:1px 5px;font-size:12px;font-family:monospace;">${text}</span>`,
            );
        }
        if (editorRef.current) {
            const newHtml = editorRef.current.innerHTML;
            lastHtmlRef.current = newHtml;
            onChange(newHtml);
        }
    };

    const insertLink = () => {
        saveCaretPosition();
        setLinkUrl("");
        setLinkModalOpen(true);
    };

    const confirmLink = () => {
        setLinkModalOpen(false);
        if (linkUrl) {
            editorRef.current?.focus();
            const sel = window.getSelection();
            if (sel && savedRangeRef.current) {
                sel.removeAllRanges();
                sel.addRange(savedRangeRef.current);
            }
            exec("createLink", linkUrl);
        }
    };

    const insertMappedFontSize = (sizePxStr: string) => {
        setCurrSize(sizePxStr);
        const sizePx = parseInt(sizePxStr, 10);
        editorRef.current?.focus();
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;

        // Use dummy font size 7 to target the new selection
        document.execCommand("fontSize", false, "7");
        const fontElements = editorRef.current?.querySelectorAll<HTMLElement>('font[size="7"]');
        fontElements?.forEach((el) => {
            el.removeAttribute("size");
            el.style.fontSize = `${sizePx}px`;
        });

        if (editorRef.current) {
            const newHtml = editorRef.current.innerHTML;
            lastHtmlRef.current = newHtml;
            onChange(newHtml);
        }
    };

    const saveColorSelection = () => {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
            colorSavedRangeRef.current = sel.getRangeAt(0).cloneRange();
        }
        saveCaretPosition();
    };

    const handleColorChange = (command: string, color: string) => {
        if (command === "foreColor") setCurrColor(color);
        if (command === "backColor") setCurrBgColor(color);

        editorRef.current?.focus();
        const sel = window.getSelection();
        const rangeToRestore = colorSavedRangeRef.current || savedRangeRef.current;
        if (sel && rangeToRestore) {
            sel.removeAllRanges();
            sel.addRange(rangeToRestore);
        }
        exec(command, color);
    };

    const insertFontName = (font: string) => {
        setCurrFont(font);
        exec("fontName", font);
    };

    return (
        <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-400 focus-within:border-indigo-400 transition-all bg-white">
            {/* Toolbar */}
            <div className="flex items-center gap-1.5 px-2 py-2 bg-gray-50 border-b border-gray-200 flex-wrap min-h-[48px]">
                {/* Font Family */}
                <select
                    title="Font family"
                    value={currFont}
                    onChange={(e) => insertFontName(e.target.value)}
                    className="appearance-none text-xs text-gray-900 bg-white border border-gray-300 rounded pl-2 pr-8 py-1.5 min-h-[36px] cursor-pointer min-w-[130px] outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_0.5rem_center] bg-[size:1.25em_1.25em] bg-no-repeat"
                >
                    <option value="" disabled>
                        Font Family
                    </option>
                    <option value="'Times New Roman', Times, serif">
                        Times New Roman
                    </option>
                    <option value="Arial, Helvetica, sans-serif">Arial</option>
                    <option value="'Courier New', Courier, monospace">Courier New</option>
                    <option value="Georgia, serif">Georgia</option>
                    <option value="'Trebuchet MS', Helvetica, sans-serif">
                        Trebuchet MS
                    </option>
                    <option value="Verdana, Geneva, sans-serif">Verdana</option>
                    <option value="'Comic Sans MS', cursive, sans-serif">
                        Comic Sans MS
                    </option>
                    <option value="Impact, Charcoal, sans-serif">Impact</option>
                    <option value="'Lucida Console', Monaco, monospace">
                        Lucida Console
                    </option>
                    <option value="Tahoma, Geneva, sans-serif">Tahoma</option>
                </select>

                <div className="w-px h-6 bg-gray-300 mx-0.5" />

                {/* Text Style */}
                <div className="flex items-center gap-1">
                    <ToolbarBtn
                        active={document.queryCommandState("bold")}
                        onClick={() => exec("bold")}
                        title="Bold (Ctrl+B)"
                    >
                        <Bold size={15} />
                    </ToolbarBtn>
                    <ToolbarBtn
                        active={document.queryCommandState("italic")}
                        onClick={() => exec("italic")}
                        title="Italic (Ctrl+I)"
                    >
                        <Italic size={15} />
                    </ToolbarBtn>
                    <ToolbarBtn
                        active={document.queryCommandState("underline")}
                        onClick={() => exec("underline")}
                        title="Underline (Ctrl+U)"
                    >
                        <Underline size={15} />
                    </ToolbarBtn>
                    <ToolbarBtn
                        active={document.queryCommandState("strikethrough")}
                        onClick={() => exec("strikethrough")}
                        title="Strikethrough"
                    >
                        <Strikethrough size={15} />
                    </ToolbarBtn>
                </div>

                <div className="w-px h-6 bg-gray-300 mx-0.5" />

                {/* Font Size Dropdown (Gmail Style) */}
                <select
                    title="Font size"
                    value={currSize}
                    onChange={(e) => insertMappedFontSize(e.target.value)}
                    style={{
                        fontSize: 12,
                        color: '#111827',
                        background: '#fff',
                        border: '1px solid #d1d5db',
                        borderRadius: 4,
                        padding: '0 4px',
                        height: 28,
                        cursor: 'pointer',
                        outline: 'none',
                        width: 80,
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    }}
                >
                    <option value="10">Small</option>
                    <option value="14">Normal</option>
                    <option value="18">Large</option>
                    <option value="32">Huge</option>
                </select>

                <div className="w-px h-6 bg-gray-300 mx-0.5" />

                {/* Alignment */}
                <div className="flex items-center gap-1">
                    <ToolbarBtn onClick={() => exec("justifyLeft")} title="Align Left">
                        <AlignLeft size={15} />
                    </ToolbarBtn>
                    <ToolbarBtn
                        onClick={() => exec("justifyCenter")}
                        title="Align Center"
                    >
                        <AlignCenter size={15} />
                    </ToolbarBtn>
                    <ToolbarBtn onClick={() => exec("justifyRight")} title="Align Right">
                        <AlignRight size={15} />
                    </ToolbarBtn>
                    <ToolbarBtn onClick={() => exec("justifyFull")} title="Justify Full">
                        <AlignJustify size={15} />
                    </ToolbarBtn>
                </div>

                <div className="w-px h-6 bg-gray-300 mx-0.5" />

                {/* Lists & Other */}
                <div className="flex items-center gap-1">
                    <ToolbarBtn
                        onClick={() => exec("insertUnorderedList")}
                        title="Bullet List"
                    >
                        <List size={15} />
                    </ToolbarBtn>
                    <ToolbarBtn
                        onClick={() => exec("insertOrderedList")}
                        title="Numbered List"
                    >
                        <span className="text-[12px] font-bold leading-none h-4 flex items-center">
                            1.
                        </span>
                    </ToolbarBtn>
                    <ToolbarBtn onClick={insertLink} title="Insert Link">
                        <Link size={15} />
                    </ToolbarBtn>

                    <label
                        title="Text Color"
                        onMouseDown={saveColorSelection}
                        className="flex flex-col items-center justify-center cursor-pointer h-7 w-7 rounded hover:bg-gray-100 transition-colors relative pt-0.5"
                    >
                        <span className="text-[14px] font-bold leading-none">
                            A
                        </span>
                        <div className="w-4 h-1 mt-0.5 rounded-sm" style={{ backgroundColor: currColor || '#000000' }}></div>
                        <input
                            type="color"
                            className="absolute opacity-0 w-0 h-0"
                            value={currColor || '#000000'}
                            onChange={(e) => handleColorChange("foreColor", e.target.value)}
                        />
                    </label>

                    <label
                        title="Highlight Color"
                        onMouseDown={saveColorSelection}
                        className="flex flex-col items-center justify-center cursor-pointer h-7 w-7 rounded hover:bg-gray-100 transition-colors relative"
                    >
                        <Highlighter size={14} className="text-gray-700" />
                        <div className="w-4 h-1 mt-0.5 rounded-sm" style={{ backgroundColor: (!currBgColor || currBgColor === '#ffffff') ? 'transparent' : currBgColor, border: (!currBgColor || currBgColor === '#ffffff') ? '1px solid #e5e7eb' : 'none' }}></div>
                        <input
                            type="color"
                            className="absolute opacity-0 w-0 h-0"
                            value={currBgColor || '#ffffff'}
                            onChange={(e) => handleColorChange("backColor", e.target.value)}
                        />
                    </label>
                </div>
            </div>

            {/* Variable chips row */}
            {variables.length > 0 && (
                <div className="px-2 py-1.5 bg-indigo-50/60 border-b border-indigo-100 flex flex-wrap gap-1 items-center">
                    <span className="text-[10px] text-indigo-400 flex items-center gap-1 mr-1">
                        <Tag size={9} /> Insert variable:
                    </span>
                    {variables.map((v) => (
                        <button
                            key={v}
                            type="button"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                restoreCaretAndInsert(`{{${v}}}`);
                            }}
                            className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 border border-indigo-200 rounded text-[10px] font-mono hover:bg-indigo-200 transition-colors"
                        >
                            {`{{${v}}}`}
                        </button>
                    ))}
                </div>
            )}

            {/* Editable area */}
            <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={() => {
                    if (editorRef.current) {
                        isTypingRef.current = true;
                        // Always update the ref immediately so it's always fresh
                        lastHtmlRef.current = editorRef.current.innerHTML;
                        // Debounce the state push to prevent re-render lag
                        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
                        debounceTimerRef.current = setTimeout(() => {
                            isTypingRef.current = false;
                            onChange(lastHtmlRef.current);
                        }, 400);
                    }
                }}
                onBlur={() => {
                    isTypingRef.current = false;
                    // Flush immediately on blur so content is always saved when leaving editor
                    if (debounceTimerRef.current) {
                        clearTimeout(debounceTimerRef.current);
                        debounceTimerRef.current = null;
                    }
                    if (editorRef.current) {
                        onChange(editorRef.current.innerHTML);
                    }
                }}
                onMouseUp={() => {
                    saveCaretPosition();
                    // Only update font size display when clicking into explicitly-sized text
                    const sel = window.getSelection();
                    if (sel && sel.rangeCount > 0) {
                        let el: HTMLElement | null = sel.focusNode?.parentElement ?? null;
                        // Walk up to find an element with an explicit inline font-size
                        while (el && el !== editorRef.current) {
                            if (el.style?.fontSize) {
                                const sizeMatch = el.style.fontSize.match(/(\d+)px/);
                                if (sizeMatch) {
                                    const nearestSize = findNearestSize(sizeMatch[1]);
                                    if (nearestSize !== currSize) setCurrSize(nearestSize);
                                }
                                break;
                            }
                            el = el.parentElement;
                        }
                    }
                }}
                onKeyUp={saveCaretPosition}
                className="min-h-[260px] p-2 text-[10px] text-gray-800 outline-none leading-relaxed editor-content font-['Times_New_Roman',_Times,_serif]"
            />
            <style
                dangerouslySetInnerHTML={{
                    __html: `
                .editor-content ul { list-style-type: disc !important; padding-left: 1.5rem !important; margin-bottom: 1rem !important; }
                .editor-content ol { list-style-type: decimal !important; padding-left: 1.5rem !important; margin-bottom: 1rem !important; }
                .editor-content li { display: list-item !important; margin-bottom: 0.25rem !important; }
            `,
                }}
            />

            <AlertPopup
                isOpen={linkModalOpen}
                type="info"
                title="Insert Link"
                message="Enter the URL for this link:"
                showCancel
                cancelText="Cancel"
                confirmText="Insert Link"
                onClose={() => setLinkModalOpen(false)}
                onConfirm={confirmLink}
            >
                <div className="mt-2">
                    <input
                        type="url"
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        placeholder="https://example.com"
                        className="w-full text-xs px-2 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        autoFocus
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                confirmLink();
                            }
                        }}
                    />
                </div>
            </AlertPopup>
        </div>
    );
}

export default RichEditor;
