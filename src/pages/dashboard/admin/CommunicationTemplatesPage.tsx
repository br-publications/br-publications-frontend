import React, { useState, useEffect, useCallback } from "react";
import {
    Mail,
    Edit2,
    Eye,
    ToggleLeft,
    ToggleRight,
    X,
    Save,
    RefreshCw,
    Code2,
    BookOpen,
    Users,
    Briefcase,
    Shield,
    Layers,
    ZoomIn,
    ZoomOut,
    Maximize2,
} from "lucide-react";
import toast from "react-hot-toast";
import {
    templateService,
    type CommunicationTemplate,
} from "../../../services/template.service";
import AlertPopup from "../../../components/common/alertPopup";
import { RichEditor } from "../../../components/common/RichEditor";

// ─── Domain Config ────────────────────────────────────────────────────────────
const DOMAINS: {
    key: string;
    label: string;
    icon: React.ReactNode;
    color: string;
}[] = [
        {
            key: "all",
            label: "All Templates",
            icon: <Layers size={15} />,
            color: "text-gray-600",
        },
        {
            key: "Auth & General",
            label: "Auth & General",
            icon: <Shield size={15} />,
            color: "text-purple-600",
        },
        {
            key: "Book Chapter",
            label: "Book Chapter",
            icon: <BookOpen size={15} />,
            color: "text-blue-600",
        },
        {
            key: "Text Book",
            label: "Text Book",
            icon: <BookOpen size={15} />,
            color: "text-emerald-600",
        },
        {
            key: "Recruitment",
            label: "Recruitment",
            icon: <Users size={15} />,
            color: "text-amber-600",
        },
        {
            key: "Projects & Internships",
            label: "Projects & Internships",
            icon: <Briefcase size={15} />,
            color: "text-rose-600",
        },
    ];

type ViewMode = "list" | "edit" | "preview";



// ─── Component ────────────────────────────────────────────────────────────────
export default function CommunicationTemplatesPage() {
    const [templates, setTemplates] = useState<CommunicationTemplate[]>([]);
    const [grouped, setGrouped] = useState<
        Record<string, CommunicationTemplate[]>
    >({});
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeDomain, setActiveDomain] = useState("all");
    const [selectedTemplate, setSelectedTemplate] =
        useState<CommunicationTemplate | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>("list");

    // Edit state — each mode is fully independent
    const [editSubject, setEditSubject] = useState("");
    const [editContent, setEditContent] = useState("");         // Rich Text tab
    const [editHtmlContent, setEditHtmlContent] = useState(""); // HTML tab
    const [saving, setSaving] = useState(false);
    const [editorMode, setEditorMode] = useState<'rich' | 'html'>('rich');

    // Preview state
    const [previewVars, setPreviewVars] = useState<Record<string, string>>({});
    const [previewResult, setPreviewResult] = useState<{
        subject: string;
        content: string;
    } | null>(null);
    const [previewing, setPreviewing] = useState(false);
    const [previewZoom, setPreviewZoom] = useState(0.75);

    const fetchTemplates = useCallback(async () => {
        setLoading(true);
        try {
            const res = await templateService.listTemplates({
                search: searchTerm || undefined,
            });
            if (res.success && res.data) {
                setTemplates(res.data.templates);
                setGrouped(res.data.grouped);
            }
        } catch (err) {
            toast.error("Failed to load templates");
        } finally {
            setLoading(false);
        }
    }, [searchTerm]);

    useEffect(() => {
        const timer = setTimeout(() => fetchTemplates(), 300);
        return () => clearTimeout(timer);
    }, [fetchTemplates]);

    const displayedTemplates =
        activeDomain === "all" ? templates : (grouped[activeDomain] ?? []);

    // ── Open edit ─────────────────────────────────────────────────
    const openEdit = (tpl: CommunicationTemplate) => {
        const richContent = tpl.content || "";
        setSelectedTemplate(tpl);
        setEditSubject(tpl.subject);
        // Rich text content — unwrap plain text into HTML if needed
        const isHtml = /<[a-z][\s\S]*>/i.test(richContent);
        setEditContent(isHtml ? richContent : richContent.replace(/\n/g, "<br>"));
        // HTML content — load saved htmlContent (or empty if not set yet)
        setEditHtmlContent(tpl.htmlContent || "");
        // Default to HTML mode if rich-text content itself is a full HTML template
        // and no separate htmlContent exists yet (legacy templates)
        const isFullHtmlEmail = /<style[\s\S]*?>|<!DOCTYPE/i.test(richContent) && !tpl.htmlContent;
        setEditorMode(isFullHtmlEmail ? 'html' : 'rich');
        setViewMode("edit");
    };

    // ── Open preview ──────────────────────────────────────────────
    const openPreview = async (tpl: CommunicationTemplate) => {
        setSelectedTemplate(tpl);
        const initVars: Record<string, string> = {};
        (tpl.variables || []).forEach((v) => {
            initVars[v] = "";
        });
        setPreviewVars(initVars);
        setPreviewResult(null);
        setViewMode("preview");
        runPreview(tpl.id, initVars, tpl.contentMode);  // preview the active (sending) content by default
    };

    const runPreview = async (id: number, vars: Record<string, string>, mode?: 'rich' | 'html') => {
        setPreviewing(true);
        try {
            const res = await templateService.previewTemplate(id, vars, mode);
            if (res.success && res.data) setPreviewResult(res.data);
        } catch {
            toast.error("Preview failed");
        } finally {
            setPreviewing(false);
        }
    };

    // ── Save ──────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!selectedTemplate) return;
        setSaving(true);
        try {
            const res = await templateService.updateTemplate(selectedTemplate.id, {
                subject: editSubject,
                content: editContent,
                htmlContent: editHtmlContent || null,
            });
            if (res.success) {
                toast.success("Template saved successfully!");
                await fetchTemplates();
                setViewMode("list");
            } else {
                toast.error("Failed to save template");
            }
        } catch {
            toast.error("Failed to save template");
        } finally {
            setSaving(false);
        }
    };

    // ── Toggle Content Mode ────────────────────────────────────────
    const handleToggleContentMode = async () => {
        if (!selectedTemplate) return;
        if (selectedTemplate.contentMode === 'rich' && !editHtmlContent && !selectedTemplate.htmlContent) {
            toast.error('Save an HTML version first before switching to HTML mode.');
            return;
        }
        try {
            const res = await templateService.toggleContentMode(selectedTemplate.id);
            if (res.success && res.data) {
                const newMode = res.data.contentMode;
                setSelectedTemplate(prev => prev ? { ...prev, contentMode: newMode } : prev);
                setTemplates(prev => prev.map(t =>
                    t.id === selectedTemplate.id ? { ...t, contentMode: newMode } : t
                ));
                toast.success(
                    newMode === 'html'
                        ? '📄 Emails will now use the HTML content.'
                        : '✏️ Emails will now use the Rich Text content.'
                );
            } else {
                toast.error(res.message || 'Could not switch content mode');
            }
        } catch {
            toast.error('Failed to switch content mode');
        }
    };

    // ── Toggle ────────────────────────────────────────────────────

    const handleToggle = async (
        tpl: CommunicationTemplate,
        e: React.MouseEvent,
    ) => {
        e.stopPropagation();
        try {
            const res = await templateService.toggleTemplate(tpl.id);
            if (res.success) {
                toast.success(
                    `${tpl.code} ${res.data?.isActive ? "enabled" : "disabled"}`,
                );
                fetchTemplates();
            }
        } catch {
            toast.error("Failed to toggle template");
        }
    };

    // ── Close panel ───────────────────────────────────────────────
    const closePanel = () => {
        setViewMode("list");
        setSelectedTemplate(null);
        setPreviewResult(null);
    };

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <Mail size={18} className="text-primary-600" />
                        Communication Templates
                    </h1>
                    <p className="text-gray-500 mt-0.5 text-[10px]">
                        Manage email templates used across all workflows
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400">
                        {templates.length} templates
                    </span>
                    <button
                        onClick={() => fetchTemplates()}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw size={15} />
                    </button>
                </div>
            </div>

            <div className="flex gap-3">
                {/* ── LEFT: Domain Sidebar ─────────────────────────────── */}
                <div className="w-48 shrink-0 space-y-0.5">
                    {DOMAINS.map((d) => (
                        <button
                            key={d.key}
                            onClick={() => {
                                setActiveDomain(d.key);
                                closePanel();
                            }}
                            className={`w-full text-left px-2 py-2 rounded-lg text-[10px] font-medium flex items-center gap-2 transition-colors
                                ${activeDomain === d.key
                                    ? "bg-primary-50 text-primary-700 border border-primary-200"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                }`}
                        >
                            <span
                                className={
                                    activeDomain === d.key ? "text-primary-600" : d.color
                                }
                            >
                                {d.icon}
                            </span>
                            <span className="truncate">{d.label}</span>
                            {activeDomain !== "all" && d.key !== "all" && grouped[d.key] && (
                                <span className="ml-auto text-[10px] text-gray-400 font-normal">
                                    {grouped[d.key].length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* ── RIGHT: Main Panel ────────────────────────────────── */}
                <div className="flex-1 min-w-0">
                    {/* Search */}
                    <div className="relative mb-3">

                        <input
                            type="text"
                            placeholder="Search templates by code..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 h-9 w-full text-[10px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                    </div>

                    <div className="flex gap-3">
                        {/* Template table */}
                        <div
                            className={`bg-white rounded-xl border border-gray-200 overflow-hidden transition-all ${viewMode !== "list" ? "flex-1 min-w-0" : "w-full"}`}
                        >
                            {loading ? (
                                <div className="flex items-center justify-center py-10">
                                    <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-primary-500" />
                                </div>
                            ) : displayedTemplates.length === 0 ? (
                                <div className="text-center py-10 text-gray-400">
                                    <Mail size={32} className="mx-auto mb-2 opacity-30" />
                                    <p className="text-xs">No templates found</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto w-full">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-gray-100 bg-gray-50/60">
                                                <th className="px-2 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                                                    Code / Description
                                                </th>
                                                <th className="px-2 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                                                    Subject
                                                </th>
                                                <th className="px-2 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                                                    Status
                                                </th>
                                                <th className="px-2 py-2.5 text-right text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {displayedTemplates.map((tpl) => (
                                                <tr
                                                    key={tpl.id}
                                                    className={`hover:bg-gray-50 transition-colors ${selectedTemplate?.id === tpl.id ? "bg-primary-50/50" : ""}`}
                                                >
                                                    <td className="px-2 py-2.5">
                                                        <div className="flex items-center gap-2">
                                                            <Code2
                                                                size={13}
                                                                className="text-gray-400 shrink-0"
                                                            />
                                                            <div>
                                                                <p className="text-[10px] font-mono font-medium text-gray-800">
                                                                    {tpl.code}
                                                                </p>
                                                                {tpl.description && (
                                                                    <p className="text-[10px] text-gray-400 mt-0.5 truncate max-w-[180px]">
                                                                        {tpl.description}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-2 py-2.5 hidden sm:table-cell">
                                                        <p className="text-[10px] text-gray-600 truncate max-w-[220px]">
                                                            {tpl.subject}
                                                        </p>
                                                    </td>
                                                    <td className="px-2 py-2.5">
                                                        <button
                                                            onClick={(e) => handleToggle(tpl, e)}
                                                            className="flex items-center gap-1.5 group"
                                                            title={
                                                                tpl.isActive
                                                                    ? "Click to disable"
                                                                    : "Click to enable"
                                                            }
                                                        >
                                                            {tpl.isActive ? (
                                                                <ToggleRight
                                                                    size={18}
                                                                    className="text-green-500 group-hover:text-green-700 transition-colors"
                                                                />
                                                            ) : (
                                                                <ToggleLeft
                                                                    size={18}
                                                                    className="text-gray-300 group-hover:text-gray-500 transition-colors"
                                                                />
                                                            )}
                                                            <span
                                                                className={`text-[10px] font-medium ${tpl.isActive ? "text-green-600" : "text-gray-400"}`}
                                                            >
                                                                {tpl.isActive ? "Active" : "Inactive"}
                                                            </span>
                                                        </button>
                                                    </td>
                                                    <td className="px-2 py-2.5 text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <button
                                                                onClick={() => openPreview(tpl)}
                                                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                title="Preview"
                                                            >
                                                                <Eye size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => openEdit(tpl)}
                                                                className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                                                title="Edit"
                                                            >
                                                                <Edit2 size={14} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                    {/* ── MODAL OVERLAY ─────────────────────────────────── */}
                    {(viewMode === "edit" || viewMode === "preview") &&
                        selectedTemplate && (
                            <div
                                className="fixed inset-0 z-999 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-2 overflow-y-auto"
                                onMouseDown={(e) => {
                                    if (e.target === e.currentTarget) closePanel();
                                }}
                            >
                                {/* Edit Panel Modal */}
                                {viewMode === "edit" && (
                                    <div
                                        className="w-full max-w-4xl bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh]"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {/* Panel header */}
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-2 py-2 border-b border-gray-100 gap-3">
                                            <div>
                                                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                                                    <Edit2 size={18} className="text-indigo-600" />
                                                    Edit Template:{" "}
                                                    <span className="font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-xs">
                                                        {selectedTemplate.code}
                                                    </span>
                                                </h3>
                                                <p className="text-[10px] text-gray-500 mt-1">
                                                    {selectedTemplate.description}
                                                </p>
                                            </div>
                                            <button
                                                onClick={closePanel}
                                                className="p-2 text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>

                                        {/* Form */}
                                        <div className="p-2 flex-1 overflow-y-auto space-y-3">
                                            {/* Subject field */}
                                            <div>
                                                <label className="block text-[10px] font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
                                                    Email Subject
                                                </label>
                                                <input
                                                    type="text"
                                                    value={editSubject}
                                                    onChange={(e) => setEditSubject(e.target.value)}
                                                    placeholder="e.g. Your application has been received"
                                                    className="w-full text-sm px-2 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                                                />
                                                {/* Subject variable hints */}
                                                {selectedTemplate.variables?.length > 0 && (
                                                    <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                                                        <span className="text-[11px] text-gray-500 font-medium mr-1 uppercase tracking-wider">
                                                            Variables:
                                                        </span>
                                                        {selectedTemplate.variables.map((v) => (
                                                            <button
                                                                key={v}
                                                                type="button"
                                                                onClick={() =>
                                                                    setEditSubject((prev) => prev + `{{${v}}}`)
                                                                }
                                                                className="px-2 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded text-[10px] font-mono hover:bg-indigo-100 hover:border-indigo-200 transition-colors"
                                                                title={`Insert {{${v}}} into subject`}
                                                            >
                                                                {`{{${v}}}`}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Rich text / HTML editor */}
                                            <div className="pt-2">
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <label className="block text-[10px] font-semibold text-gray-700 uppercase tracking-wide">
                                                        Message Body
                                                    </label>
                                                    {/* Mode toggle */}
                                                    <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => setEditorMode('rich')}
                                                            className={`px-2.5 py-1 text-[10px] font-semibold rounded-md transition-colors ${editorMode === 'rich'
                                                                ? 'bg-white text-indigo-700 shadow-sm'
                                                                : 'text-gray-500 hover:text-gray-700'
                                                                }`}
                                                        >
                                                            Rich Text
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setEditorMode('html')}
                                                            className={`px-2.5 py-1 text-[10px] font-semibold rounded-md transition-colors flex items-center gap-1 ${editorMode === 'html'
                                                                ? 'bg-white text-indigo-700 shadow-sm'
                                                                : 'text-gray-500 hover:text-gray-700'
                                                                }`}
                                                        >
                                                            <Code2 size={11} />
                                                            HTML
                                                        </button>
                                                    </div>
                                                </div>
                                                <p className="text-[10px] text-gray-500 mb-3 flex items-center gap-2 flex-wrap">
                                                    {editorMode === 'rich'
                                                        ? 'Write your email content below. Use the toolbar to format text and insert dynamic variables.'
                                                        : 'Edit the raw HTML source directly. Variables like {{name}} still work here.'}
                                                    {editorMode === 'html' && /(<style[\s\S]*?>|<!DOCTYPE)/i.test(editHtmlContent || editContent) && (
                                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 rounded text-[10px] font-medium">
                                                            <Code2 size={9} /> Auto-detected full HTML
                                                        </span>
                                                    )}
                                                </p>
                                                {editorMode === 'rich' ? (
                                                    <div className="border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all shadow-sm">
                                                        <RichEditor
                                                            html={editContent}
                                                            onChange={setEditContent}
                                                            variables={selectedTemplate.variables || []}
                                                        />
                                                    </div>
                                                ) : (
                                                    <textarea
                                                        value={editHtmlContent}
                                                        onChange={(e) => setEditHtmlContent(e.target.value)}
                                                        spellCheck={false}
                                                        className="w-full min-h-[380px] p-3 text-[11px] font-mono bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-y leading-relaxed shadow-inner placeholder:text-gray-400"
                                                        placeholder="<p>Hello {{name}},</p>\n<p>Your email content goes here...</p>"
                                                    />
                                                )}
                                            </div>
                                        </div>

                                        {/* Footer with Sending Mode + Save */}
                                        <div className="border-t border-gray-100 bg-gray-50 rounded-b-xl shrink-0 mt-auto">
                                            {/* Sending Mode row */}
                                            <div className="px-3 py-2 flex items-center justify-between gap-3 border-b border-gray-100">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wide">
                                                        Sending Mode
                                                    </span>
                                                    <span className="text-[10px] text-gray-400">
                                                        Choose which content version is sent to users
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    {/* Status badge */}
                                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold border ${selectedTemplate.contentMode === 'html'
                                                        ? 'bg-violet-50 border-violet-200 text-violet-700'
                                                        : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                                        }`}>
                                                        {selectedTemplate.contentMode === 'html' ? (
                                                            <><Code2 size={9} /> HTML</>
                                                        ) : (
                                                            <><Edit2 size={9} /> Rich Text</>
                                                        )}
                                                    </span>
                                                    {/* Toggle pill */}
                                                    <button
                                                        type="button"
                                                        onClick={handleToggleContentMode}
                                                        disabled={selectedTemplate.contentMode === 'rich' && !editHtmlContent && !selectedTemplate.htmlContent}
                                                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed ${selectedTemplate.contentMode === 'html' ? 'bg-violet-600' : 'bg-gray-300'
                                                            }`}
                                                        title={selectedTemplate.contentMode === 'html'
                                                            ? 'Currently using HTML — click to switch to Rich Text'
                                                            : selectedTemplate.htmlContent || editHtmlContent
                                                                ? 'Currently using Rich Text — click to switch to HTML'
                                                                : 'Save HTML content first to enable HTML mode'}
                                                    >
                                                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${selectedTemplate.contentMode === 'html' ? 'translate-x-4' : 'translate-x-0.5'
                                                            }`} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Save / Cancel row */}
                                            <div className="px-3 py-2 flex items-center justify-between">
                                                <p className="text-[10px] text-gray-500 flex items-center gap-1.5">
                                                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                                                    Changes will be applied immediately.
                                                </p>
                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={closePanel}
                                                        className="px-2 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={handleSave}
                                                        disabled={saving}
                                                        className="px-2 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-2 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
                                                    >
                                                        {saving ? (
                                                            <RefreshCw size={16} className="animate-spin" />
                                                        ) : (
                                                            <Save size={16} />
                                                        )}
                                                        {saving ? "Saving..." : "Save Template"}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                )}

                                {/* Preview Panel Modal */}
                                {viewMode === "preview" && (
                                    <div
                                        className="w-full max-w-4xl bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh]"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {/* Panel header */}
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-2 py-2 border-b border-gray-100 gap-3">
                                            <div>
                                                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2 flex-wrap">
                                                    <Eye size={18} className="text-blue-600" />
                                                    Preview Template:{" "}
                                                    <span className="font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs">
                                                        {selectedTemplate.code}
                                                    </span>
                                                    {/* Active sending mode indicator */}
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${selectedTemplate.contentMode === 'html'
                                                        ? 'bg-violet-50 border-violet-200 text-violet-700'
                                                        : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                                        }`}>
                                                        {selectedTemplate.contentMode === 'html' ? (
                                                            <><Code2 size={9} /> Sending: HTML</>
                                                        ) : (
                                                            <><Edit2 size={9} /> Sending: Rich Text</>
                                                        )}
                                                    </span>
                                                </h3>
                                                <p className="text-[10px] text-gray-500 mt-1">
                                                    Previewing the <strong>active</strong> content version. Test with sample data below.
                                                </p>
                                            </div>
                                            <button
                                                onClick={closePanel}
                                                className="p-2 text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>

                                        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                                            {/* Variable inputs - Sidebar */}
                                            {selectedTemplate.variables?.length > 0 && (
                                                <div className="w-full md:w-64 border-r border-gray-100 bg-gray-50/80 p-2 overflow-y-auto shrink-0 space-y-3">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center">
                                                            <Code2 size={12} className="text-blue-600" />
                                                        </div>
                                                        <h4 className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">
                                                            Test Data
                                                        </h4>
                                                    </div>

                                                    <div className="space-y-3">
                                                        {selectedTemplate.variables.map((v) => (
                                                            <div key={v}>
                                                                <label className="block text-[11px] font-medium text-gray-600 mb-1 font-mono">{`{{${v}}}`}</label>
                                                                <input
                                                                    type="text"
                                                                    placeholder={`Enter ${v}`}
                                                                    value={previewVars[v] || ""}
                                                                    onChange={(e) =>
                                                                        setPreviewVars((prev) => ({
                                                                            ...prev,
                                                                            [v]: e.target.value,
                                                                        }))
                                                                    }
                                                                    className="w-full text-xs px-2 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-white shadow-sm"
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <button
                                                        onClick={() =>
                                                            runPreview(selectedTemplate.id, previewVars, editorMode)
                                                        }
                                                        disabled={previewing}
                                                        className="mt-2 w-full py-2.5 text-xs font-semibold bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                                                    >
                                                        {previewing ? (
                                                            <RefreshCw size={14} className="animate-spin" />
                                                        ) : (
                                                            <Eye size={14} />
                                                        )}
                                                        Generate Preview
                                                    </button>
                                                </div>
                                            )}

                                            {/* Rendered preview - Main Content */}
                                            <div className="flex-1 overflow-y-auto p-2 bg-white">
                                                {previewResult ? (
                                                    <div className="space-y-3">
                                                        {/* Subject */}
                                                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 shadow-sm">
                                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1.5">
                                                                Subject Line
                                                            </p>
                                                            <p className="text-sm font-semibold text-gray-900">
                                                                {previewResult.subject}
                                                            </p>
                                                        </div>

                                                        {/* Email Body */}
                                                        <div className="border border-gray-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
                                                            {/* Browser-chrome bar */}
                                                            <div className="bg-gray-50 px-2 py-2 border-b border-gray-200 flex items-center justify-between gap-2">
                                                                <div className="flex gap-1.5">
                                                                    <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                                                                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                                                                    <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                                                                </div>
                                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex-1">
                                                                    Email Body
                                                                </p>
                                                                {/* Zoom controls */}
                                                                <div className="flex items-center gap-0.5 bg-white border border-gray-200 rounded-lg px-1 py-0.5 shadow-sm">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setPreviewZoom(z => Math.max(0.25, +(z - 0.1).toFixed(2)))}
                                                                        className="p-1 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                                                                        title="Zoom out"
                                                                    >
                                                                        <ZoomOut size={13} />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setPreviewZoom(0.75)}
                                                                        className="px-1.5 text-[10px] font-mono text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors min-w-[38px] text-center"
                                                                        title="Reset zoom"
                                                                    >
                                                                        {Math.round(previewZoom * 100)}%
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setPreviewZoom(z => Math.min(2, +(z + 0.1).toFixed(2)))}
                                                                        className="p-1 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                                                                        title="Zoom in"
                                                                    >
                                                                        <ZoomIn size={13} />
                                                                    </button>
                                                                    <div className="w-px h-4 bg-gray-200 mx-0.5" />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setPreviewZoom(1)}
                                                                        className="p-1 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                                                                        title="Fit to 100%"
                                                                    >
                                                                        <Maximize2 size={13} />
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            {/* iframe preview - renders HTML email properly */}
                                                            <div
                                                                className="bg-gray-100 overflow-auto"
                                                                style={{ minHeight: 300 }}
                                                            >
                                                                <iframe
                                                                    key={previewResult.content}
                                                                    srcDoc={previewResult.content}
                                                                    sandbox="allow-same-origin"
                                                                    title="Email Preview"
                                                                    style={{
                                                                        width: `${(1 / previewZoom) * 100}%`,
                                                                        minHeight: 400,
                                                                        border: 'none',
                                                                        display: 'block',
                                                                        transform: `scale(${previewZoom})`,
                                                                        transformOrigin: 'top left',
                                                                        background: '#fff',
                                                                    }}
                                                                    onLoad={(e) => {
                                                                        const iframe = e.currentTarget;
                                                                        try {
                                                                            const body = iframe.contentDocument?.body;
                                                                            if (body) {
                                                                                const h = body.scrollHeight;
                                                                                iframe.style.minHeight = h + 'px';
                                                                                iframe.parentElement!.style.height = Math.ceil(h * previewZoom) + 32 + 'px';
                                                                            }
                                                                        } catch { /* cross-origin safety */ }
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : previewing ? (
                                                    <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-3">
                                                        <div className="relative w-12 h-12">
                                                            <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
                                                            <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
                                                        </div>
                                                        <p className="text-xs font-medium">
                                                            Generating preview...
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="h-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50 p-8 text-center m-4">
                                                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 mb-2">
                                                            <Eye size={28} className="text-gray-300" />
                                                        </div>
                                                        <h4 className="text-sm font-semibold text-gray-700 mb-1">
                                                            No Preview Generated
                                                        </h4>
                                                        <p className="text-xs max-w-xs">
                                                            Fill in the sample values on the left and click
                                                            "Generate Preview" to see how your email will
                                                            look.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                </div>
            </div>
        </div>
    );
}
