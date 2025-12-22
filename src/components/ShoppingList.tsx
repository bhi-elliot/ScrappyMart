import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Layout } from './Layout';
import { useMultiList, type PresetFile, type ShoppingListCategory } from '../hooks/useMultiList';
import { getAllItems, type Item } from '../data/items';
import { ItemCard, ItemRow } from './ItemCard';
import { Tutorial, useTutorial } from './Tutorial';
import { ItemDetailModal } from './ItemDetailModal';
import { 
    Search, 
    Share2, 
    Check, 
    Trash2, 
    Plus, 
    ListTodo, 
    Package, 
    X,
    Copy,
    ExternalLink,
    MoreVertical,
    Edit3,
    FolderPlus,
    FileDown,
    FileUp,
    Download,
    Upload,
    ChevronDown,
    ChevronRight,
    GripVertical,
    FolderOpen,
    RefreshCw,
    Heart,
    Shield,
    Users,
    Github
} from 'lucide-react';
import { clsx } from 'clsx';
import { AnimatePresence, motion, Reorder } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';

type ViewMode = 'list' | 'cards';

export const ShoppingListApp = () => {
    const { 
        lists,
        activeList,
        activeListId,
        setActiveListId,
        createList,
        createListWithItems,
        deleteList,
        updateListName,
        updateQuantity, 
        toggleCheck, 
        clearChecked,
        getShareLink, 
        isLoaded,
        importedListId,
        dismissImportNotice,
        addCategory,
        renameCategory,
        deleteCategory,
        moveItemToPhase,
        // Pending import handling
        pendingImport,
        confirmImportOverwrite,
        confirmImportAsNew,
        cancelPendingImport,
        importPreset,
        importPresetFromData
    } = useMultiList();
    
    const { showTutorial, completeTutorial, resetTutorial } = useTutorial();
    
    const allItems = useMemo(() => getAllItems(), []);

    const [searchTerm, setSearchTerm] = useState("");
    const [showSearch, setShowSearch] = useState(false);
    const [copied, setCopied] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareUrl, setShareUrl] = useState("");
    const [editingListId, setEditingListId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState("");
    const [showMobileSidebar, setShowMobileSidebar] = useState(false);
    const [listMenuOpen, setListMenuOpen] = useState<string | null>(null);
    const [selectedItem, setSelectedItem] = useState<Item | null>(null);
    const [showPresets, setShowPresets] = useState(false);
    const [presets, setPresets] = useState<PresetFile[]>([]);
    const [loadingPreset, setLoadingPreset] = useState(false);
    const [pendingPreset, setPendingPreset] = useState<string | null>(null); // For confirmation dialog
    const [presetSearch, setPresetSearch] = useState('');
    const [collapsedPresetCategories, setCollapsedPresetCategories] = useState<Set<string>>(new Set());
    const [collapsedCategories, setCollapsedCategories] = useState<Set<number>>(new Set());
    const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
    const [editingCategoryName, setEditingCategoryName] = useState("");
    const [showAddCategory, setShowAddCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [draggedItemId, setDraggedItemId] = useState<number | null>(null);
    const [isDraggingFile, setIsDraggingFile] = useState(false);
    const [showAbout, setShowAbout] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const editInputRef = useRef<HTMLInputElement>(null);
    const categoryInputRef = useRef<HTMLInputElement>(null);
    const newCategoryInputRef = useRef<HTMLInputElement>(null);

    // Focus search input when opened
    useEffect(() => {
        if (showSearch && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [showSearch]);

    // Focus edit input when editing
    useEffect(() => {
        if (editingListId && editInputRef.current) {
            editInputRef.current.focus();
            editInputRef.current.select();
        }
    }, [editingListId]);

    // Close modals on ESC key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setShowSearch(false);
                setShowShareModal(false);
                setShowMobileSidebar(false);
                setEditingListId(null);
                setListMenuOpen(null);
                setSelectedItem(null);
            }
        };
        
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClick = () => setListMenuOpen(null);
        if (listMenuOpen) {
            document.addEventListener('click', handleClick);
            return () => document.removeEventListener('click', handleClick);
        }
    }, [listMenuOpen]);

    // Load presets list
    useEffect(() => {
        const loadPresets = async () => {
            try {
                const response = await fetch('/data/presets/index.json');
                if (response.ok) {
                    const data = await response.json();
                    setPresets(data);
                }
            } catch (e) {
                console.error('Failed to load presets:', e);
            }
        };
        loadPresets();
    }, []);

    // Focus category input when editing
    useEffect(() => {
        if (editingCategoryId && categoryInputRef.current) {
            categoryInputRef.current.focus();
            categoryInputRef.current.select();
        }
    }, [editingCategoryId]);

    // Focus new category input
    useEffect(() => {
        if (showAddCategory && newCategoryInputRef.current) {
            newCategoryInputRef.current.focus();
        }
    }, [showAddCategory]);

    // Filter items for search
    const filteredItems = useMemo(() => {
        if (!searchTerm.trim()) return [];
        const lower = searchTerm.toLowerCase();
        return allItems.filter(item =>
            item.name.toLowerCase().includes(lower) ||
            item.category.toLowerCase().includes(lower) ||
            item.rarity.toLowerCase().includes(lower)
        ).slice(0, 15);
    }, [allItems, searchTerm]);

    // Derived state - items in our list with full details
    const myItemsDetails = useMemo(() => {
        if (!activeList) return [];
        return activeList.items.map(listItem => {
            const details = allItems.find(i => i.id === listItem.itemId);
            return { ...listItem, details };
        }).filter(i => i.details);
    }, [activeList, allItems]);

    // Group items by phase/category
    const itemsByPhase = useMemo(() => {
        const groups: Record<string, typeof myItemsDetails> = { uncategorized: [] };
        
        // Initialize groups for each category
        if (activeList?.categories) {
            activeList.categories.forEach(cat => {
                groups[`phase_${cat.phase}`] = [];
            });
        }
        
        // Sort items into groups
        myItemsDetails.forEach(item => {
            if (item.phase !== undefined && groups[`phase_${item.phase}`]) {
                groups[`phase_${item.phase}`].push(item);
            } else {
                groups.uncategorized.push(item);
            }
        });
        
        return groups;
    }, [myItemsDetails, activeList?.categories]);

    // Check if list has categories
    const hasCategories = activeList?.categories && activeList.categories.length > 0;

    // Stats
    const totalItems = myItemsDetails.reduce((sum, item) => sum + item.quantity, 0);
    const checkedCount = myItemsDetails.filter(i => i.checked).length;
    const uncheckedItems = myItemsDetails.filter(i => !i.checked);
    const checkedItems = myItemsDetails.filter(i => i.checked);

    // Filtered and grouped presets
    const filteredPresets = useMemo(() => {
        if (!presetSearch.trim()) return presets;
        const lower = presetSearch.toLowerCase();
        return presets.filter(p => 
            p.name.toLowerCase().includes(lower) || 
            p.description.toLowerCase().includes(lower) ||
            (p.category?.toLowerCase() || '').includes(lower)
        );
    }, [presets, presetSearch]);

    const presetsByCategory = useMemo(() => {
        const groups: Record<string, PresetFile[]> = {};
        filteredPresets.forEach(preset => {
            const category = preset.category || 'UNCATEGORIZED';
            if (!groups[category]) groups[category] = [];
            groups[category].push(preset);
        });
        // Sort categories alphabetically, but put UNCATEGORIZED at the end
        const sortedCategories = Object.keys(groups).sort((a, b) => {
            if (a === 'UNCATEGORIZED') return 1;
            if (b === 'UNCATEGORIZED') return -1;
            return a.localeCompare(b);
        });
        return { groups, sortedCategories };
    }, [filteredPresets]);

    const togglePresetCategory = (category: string) => {
        setCollapsedPresetCategories(prev => {
            const next = new Set(prev);
            if (next.has(category)) {
                next.delete(category);
            } else {
                next.add(category);
            }
            return next;
        });
    };

    const handleShare = () => {
        const url = getShareLink();
        setShareUrl(url);
        setShowShareModal(true);
    };

    const copyToClipboard = async () => {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleStartEdit = (listId: string, name: string) => {
        setEditingListId(listId);
        setEditingName(name);
        setListMenuOpen(null);
    };

    const handleSaveEdit = () => {
        if (editingListId && editingName.trim()) {
            updateListName(editingListId, editingName.trim());
        }
        setEditingListId(null);
    };

    const handleDeleteList = (listId: string) => {
        if (lists.length === 1) {
            return;
        }
        deleteList(listId);
        setListMenuOpen(null);
    };

    const handleCreateList = () => {
        createList("New List");
    };

    const handleSelectList = (listId: string) => {
        setActiveListId(listId);
        setShowMobileSidebar(false);
    };

    const handleImportPreset = async (filename: string, skipConfirm: boolean = false) => {
        // If there are items in the active list and we haven't confirmed, show warning
        if (!skipConfirm && activeList && activeList.items.length > 0) {
            setPendingPreset(filename);
            return;
        }
        
        setLoadingPreset(true);
        await importPreset(filename);
        setLoadingPreset(false);
        setShowPresets(false);
        setPendingPreset(null);
    };

    const confirmPresetImport = async () => {
        if (pendingPreset) {
            setLoadingPreset(true);
            await importPreset(pendingPreset);
            setLoadingPreset(false);
            setShowPresets(false);
            setPendingPreset(null);
        }
    };

    const cancelPresetImport = () => {
        setPendingPreset(null);
    };

    // Export list as JSON file (preset format)
    const handleExportJSON = useCallback(() => {
        if (!activeList) return;
        
        const exportData = {
            name: activeList.name,
            description: `Exported from Scrappy Mart`,
            Category: "CUSTOM",
            items: activeList.items
                .filter(item => item.quantity > 0)
                .map(item => ({
                    id: item.itemId,
                    quantity: item.quantity,
                    phase: item.phase ?? 1
                }))
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 4)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${activeList.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, [activeList]);

    // Import JSON file
    const handleImportJSON = useCallback(async (file: File) => {
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            if (!data.items || !Array.isArray(data.items)) {
                alert('Invalid preset file format');
                return;
            }
            
            // If no name in the data, use the filename
            if (!data.name) {
                data.name = file.name.replace('.json', '');
            }
            
            // Import using the preset import function
            importPresetFromData(data);
        } catch (error) {
            console.error('Failed to import JSON:', error);
            alert('Failed to import file. Make sure it\'s a valid JSON preset.');
        }
    }, [importPresetFromData]);

    // Handle file input change
    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleImportJSON(file);
            // Reset the input so the same file can be imported again
            e.target.value = '';
        }
    };

    // Drag and drop handlers
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.types.includes('Files')) {
            setIsDraggingFile(true);
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingFile(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingFile(false);
        
        const files = Array.from(e.dataTransfer.files);
        const jsonFile = files.find(f => f.name.endsWith('.json'));
        
        if (jsonFile) {
            handleImportJSON(jsonFile);
        }
    };

    const toggleCategoryCollapse = (phase: number) => {
        setCollapsedCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(phase)) {
                newSet.delete(phase);
            } else {
                newSet.add(phase);
            }
            return newSet;
        });
    };

    const handleStartCategoryEdit = (categoryId: string, name: string) => {
        setEditingCategoryId(categoryId);
        setEditingCategoryName(name);
    };

    const handleSaveCategoryEdit = () => {
        if (editingCategoryId && editingCategoryName.trim()) {
            renameCategory(editingCategoryId, editingCategoryName.trim());
        }
        setEditingCategoryId(null);
    };

    const handleAddCategory = () => {
        if (newCategoryName.trim()) {
            addCategory(newCategoryName.trim());
            setNewCategoryName("");
            setShowAddCategory(false);
        }
    };

    const handleDragStart = (itemId: number) => {
        setDraggedItemId(itemId);
    };

    const handleDragEnd = () => {
        setDraggedItemId(null);
    };

    const handleDropOnCategory = (phase: number | undefined) => {
        if (draggedItemId !== null) {
            moveItemToPhase(draggedItemId, phase);
            setDraggedItemId(null);
        }
    };

    // Sidebar content - shared between desktop and mobile
    const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
        <>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-mono text-text-muted uppercase tracking-wider">
                    My Lists
                </h2>
                <button
                    onClick={handleCreateList}
                    className="p-1.5 text-text-muted hover:text-arc-orange hover:bg-bg-card rounded transition-colors"
                    title="Create new list"
                >
                    <FolderPlus size={16} />
                </button>
            </div>
            
            <nav className="space-y-1">
                {lists.map((list, index) => (
                    <div key={list.id} className="relative group">
                        {editingListId === list.id ? (
                            <input
                                ref={editInputRef}
                                type="text"
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                onBlur={handleSaveEdit}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveEdit();
                                    if (e.key === 'Escape') setEditingListId(null);
                                }}
                                className={clsx(
                                    "w-full px-3 py-2 rounded-lg text-sm",
                                    "bg-bg-card border border-arc-orange",
                                    "text-text-primary focus:outline-none"
                                )}
                            />
                        ) : (
                            <div 
                                className="flex items-center gap-1"
                                {...(index === 0 ? { 'data-tutorial': 'list-item' } : {})}
                            >
                                {/* Main list button */}
                                <button
                                    onClick={() => isMobile ? handleSelectList(list.id) : setActiveListId(list.id)}
                                    className={clsx(
                                        "flex-1 flex items-center gap-3 px-3 py-2.5 rounded-lg text-left",
                                        "transition-all duration-150",
                                        list.id === activeListId
                                            ? "bg-arc-orange text-text-inverse font-medium"
                                            : "text-text-secondary hover:bg-bg-card hover:text-text-primary"
                                    )}
                                >
                                    <ListTodo size={16} className="shrink-0" />
                                    <span className="flex-1 truncate text-sm">{list.name}</span>
                                    {/* Item count badge */}
                                    <span className={clsx(
                                        "px-1.5 py-0.5 rounded text-[10px] font-mono font-bold min-w-[1.25rem] text-center",
                                        list.id === activeListId 
                                            ? "bg-black/20 text-white" 
                                            : "bg-bg-tertiary text-text-muted"
                                    )}>
                                        {list.items.length}
                                    </span>
                                </button>
                                
                                {/* Menu button - always visible */}
                                <div className="relative">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setListMenuOpen(listMenuOpen === list.id ? null : list.id);
                                        }}
                                        className={clsx(
                                            "p-2 rounded-lg transition-colors",
                                            list.id === activeListId
                                                ? "text-text-inverse/60 hover:text-text-inverse hover:bg-white/20"
                                                : "text-text-muted hover:text-text-primary hover:bg-bg-card",
                                            listMenuOpen === list.id && "bg-bg-card text-text-primary"
                                        )}
                                        title="List options"
                                    >
                                        <MoreVertical size={16} />
                                    </button>
                                    
                                    {/* Dropdown Menu */}
                                    {listMenuOpen === list.id && (
                                        <div 
                                            className="absolute right-0 top-full mt-1 w-40 bg-bg-secondary border border-border-primary rounded-lg shadow-xl py-1 z-20"
                                            style={{ backgroundColor: 'var(--bg-secondary)' }}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <button
                                                onClick={() => handleStartEdit(list.id, list.name)}
                                                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-text-secondary hover:bg-bg-card hover:text-text-primary transition-colors"
                                            >
                                                <Edit3 size={14} />
                                                Rename
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setShareUrl(getShareLink(list.id));
                                                    setShowShareModal(true);
                                                    setListMenuOpen(null);
                                                    if (isMobile) setShowMobileSidebar(false);
                                                }}
                                                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-text-secondary hover:bg-bg-card hover:text-text-primary transition-colors"
                                            >
                                                <Share2 size={14} />
                                                Share
                                            </button>
                                            {lists.length > 1 && (
                                                <>
                                                    <div className="border-t border-border-primary my-1" />
                                                    <button
                                                        onClick={() => handleDeleteList(list.id)}
                                                        className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-arc-red hover:bg-arc-red/10 transition-colors"
                                                    >
                                                        <Trash2 size={14} />
                                                        Delete List
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        {/* Imported badge */}
                        {importedListId === list.id && (
                            <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -top-1 left-0 px-1.5 py-0.5 bg-arc-green text-[9px] font-bold text-white uppercase rounded"
                            >
                                New
                            </motion.span>
                        )}
                    </div>
                ))}
            </nav>
        </>
    );

    if (!isLoaded) {
    return (
            <div className="min-h-screen bg-bg-primary flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-4 bg-arc-orange rounded-lg animate-pulse-glow" />
                    <p className="font-mono text-text-muted text-sm tracking-wider">LOADING SYSTEMS...</p>
                </div>
            </div>
        );
    }

    return (
        <Layout 
            onMenuClick={() => setShowMobileSidebar(true)}
            showMenuButton={true}
            onHelpClick={resetTutorial}
            onAboutClick={() => setShowAbout(true)}
        >
            {/* Hidden file input for import */}
                        <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleFileInputChange}
            />
            
            {/* Drag overlay */}
            <AnimatePresence>
                {isDraggingFile && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-bg-primary/90 backdrop-blur-sm flex items-center justify-center pointer-events-none"
                    >
                        <div className="text-center">
                            <div className="w-24 h-24 mx-auto mb-4 rounded-2xl border-4 border-dashed border-arc-green bg-arc-green/10 flex items-center justify-center">
                                <Upload size={40} className="text-arc-green" />
                    </div>
                            <p className="text-xl font-display font-bold text-text-primary uppercase">Drop JSON File</p>
                            <p className="text-sm text-text-muted mt-1">Release to import preset</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div 
                className="flex gap-6"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {/* Desktop Sidebar with Tabs */}
                <aside className="hidden lg:block w-64 shrink-0" data-tutorial="sidebar">
                    <div className="sticky top-24">
                        <SidebarContent />
                    </div>
                </aside>

                {/* Mobile Sidebar Drawer */}
                <AnimatePresence>
                    {showMobileSidebar && (
                        <>
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                                onClick={() => setShowMobileSidebar(false)}
                            />
                            
                            {/* Drawer */}
                            <motion.aside
                                initial={{ x: '-100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '-100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                className="lg:hidden fixed top-0 left-0 bottom-0 z-50 w-72 bg-bg-secondary border-r border-border-primary shadow-2xl"
                                style={{ backgroundColor: 'var(--bg-secondary)' }}
                                data-tutorial="sidebar"
                            >
                                {/* Drawer Header */}
                                <div className="flex items-center justify-between p-4 border-b border-border-primary">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-arc-orange flex items-center justify-center rounded">
                                            <ListTodo size={16} className="text-text-inverse" />
                                        </div>
                                        <span className="font-display font-bold text-text-primary uppercase tracking-wide">
                                            Lists
                                        </span>
                                    </div>
                    <button
                                        onClick={() => setShowMobileSidebar(false)}
                                        className="p-2 text-text-muted hover:text-text-primary rounded-lg hover:bg-bg-tertiary transition-colors"
                    >
                                        <X size={20} />
                    </button>
                </div>
                                
                                {/* Drawer Content */}
                                <div className="p-4 overflow-y-auto h-[calc(100%-65px)]">
                                    <SidebarContent isMobile={true} />
            </div>
                            </motion.aside>
                        </>
                    )}
                </AnimatePresence>

                {/* Main Content */}
                <div className="flex-1 min-w-0">
                    {/* Imported list notice */}
                    {importedListId === activeListId && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-6 p-4 bg-arc-green/10 border border-arc-green/30 rounded-lg"
                        >
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <ExternalLink size={18} className="text-arc-green shrink-0" />
                                    <p className="text-sm text-text-primary">
                                        <span className="font-semibold">List imported!</span>
                                        <span className="text-text-secondary ml-2 hidden sm:inline">
                                            This shared list has been saved to your browser.
                                        </span>
                                    </p>
                                </div>
                <button
                                    onClick={dismissImportNotice}
                                    className="p-1 text-text-muted hover:text-text-primary"
                >
                                    <X size={16} />
                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Header Section */}
                    <div className="mb-6">
                        {/* List Name */}
                        <div className="mb-4">
                            <label className="text-xs font-mono text-text-muted uppercase tracking-wider mb-2 block">
                                List Name
                            </label>
                            <input
                                value={activeList?.name || ""}
                                onChange={(e) => activeListId && updateListName(activeListId, e.target.value)}
                                className={clsx(
                                    "bg-transparent text-2xl sm:text-3xl font-display font-bold",
                                    "text-text-primary uppercase tracking-wide w-full",
                                    "focus:outline-none border-b-2 border-transparent",
                                    "focus:border-arc-orange transition-colors",
                                    "placeholder:text-text-muted/50"
                                )}
                                placeholder="My Loadout"
                            />
                        </div>

                        {/* Stats Bar */}
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                            <div className="flex items-center gap-2 text-text-secondary">
                                <Package size={16} />
                                <span className="font-mono">{totalItems} items</span>
                            </div>
                            {checkedCount > 0 && (
                                <div className="flex items-center gap-2 text-arc-green">
                                    <Check size={16} />
                                    <span className="font-mono">{checkedCount}/{myItemsDetails.length} collected</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex flex-wrap items-center gap-3 mb-6">
                        {/* Add Items Button */}
                <button
                            onClick={() => setShowSearch(true)}
                            data-tutorial="add-items"
                            className={clsx(
                                "flex items-center gap-2 px-4 py-2.5 rounded-lg",
                                "bg-arc-orange text-text-inverse font-semibold",
                                "hover:bg-arc-orange-hover transition-colors",
                                "shadow-glow-sm"
                            )}
                        >
                            <Plus size={18} />
                            <span>Add Items</span>
                        </button>

                        {/* Presets Button */}
                        <button
                            onClick={() => setShowPresets(true)}
                            data-tutorial="presets"
                            className={clsx(
                                "flex items-center gap-2 px-4 py-2.5 rounded-lg",
                                "bg-bg-card border border-border-primary",
                                "text-text-primary font-medium",
                                "hover:border-arc-green hover:text-arc-green transition-colors"
                            )}
                        >
                            <FileDown size={18} />
                            <span className="hidden sm:inline">Presets</span>
                        </button>

                        {/* Share Button */}
                        <button
                            data-tutorial="share"
                            onClick={handleShare}
                            disabled={myItemsDetails.length === 0}
                            className={clsx(
                                "flex items-center gap-2 px-4 py-2.5 rounded-lg",
                                "bg-bg-card border border-border-primary",
                                "text-text-primary font-medium",
                                "hover:border-arc-orange hover:text-arc-orange transition-colors",
                                "disabled:opacity-50 disabled:cursor-not-allowed"
                            )}
                        >
                            <Share2 size={18} />
                            <span className="hidden sm:inline">Share</span>
                        </button>

                        {/* Export JSON Button */}
                        <button
                            onClick={handleExportJSON}
                            disabled={myItemsDetails.length === 0}
                            data-tutorial="export"
                            className={clsx(
                                "flex items-center gap-2 px-4 py-2.5 rounded-lg",
                                "bg-bg-card border border-border-primary",
                                "text-text-primary font-medium",
                                "hover:border-arc-blue hover:text-arc-blue transition-colors",
                                "disabled:opacity-50 disabled:cursor-not-allowed"
                            )}
                            title="Export list as JSON file"
                        >
                            <Download size={18} />
                            <span className="hidden sm:inline">Export</span>
                        </button>

                        {/* Import JSON Button */}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className={clsx(
                                "flex items-center gap-2 px-4 py-2.5 rounded-lg",
                                "bg-bg-card border border-border-primary",
                                "text-text-primary font-medium",
                                "hover:border-arc-green hover:text-arc-green transition-colors"
                            )}
                            title="Import JSON preset file"
                        >
                            <Upload size={18} />
                            <span className="hidden sm:inline">Import</span>
                        </button>

                        {/* Clear Checked */}
                        {checkedCount > 0 && (
                            <button
                                onClick={clearChecked}
                                className={clsx(
                                    "flex items-center gap-2 px-4 py-2.5 rounded-lg",
                                    "bg-arc-red/10 border border-arc-red",
                                    "text-arc-red font-semibold",
                                    "hover:bg-arc-red hover:text-white transition-colors"
                                )}
                            >
                                <Trash2 size={18} />
                                <span>Remove {checkedCount} Collected</span>
                            </button>
                        )}

                        {/* Add Categories (for lists without categories, only show if there are items) */}
                        {!hasCategories && viewMode === 'list' && myItemsDetails.length > 0 && (
                            <button
                                onClick={() => setShowAddCategory(true)}
                                className={clsx(
                                    "flex items-center gap-2 px-3 py-2 rounded-lg",
                                    "bg-bg-card border border-border-primary",
                                    "text-text-secondary font-medium text-sm",
                                    "hover:border-arc-orange hover:text-arc-orange transition-colors"
                                )}
                                title="Organize items into categories"
                            >
                                <FolderPlus size={16} />
                                <span className="hidden sm:inline">Categories</span>
                            </button>
                        )}

                        {/* View Toggle */}
                        <div className="flex items-center gap-1 ml-auto bg-bg-card border border-border-primary rounded-lg p-1">
                            <button
                                onClick={() => setViewMode('list')}
                                className={clsx(
                                    "p-2 rounded transition-colors",
                                    viewMode === 'list' 
                                        ? "bg-arc-orange text-text-inverse" 
                                        : "text-text-muted hover:text-text-primary"
                                )}
                                aria-label="List view"
                            >
                                <ListTodo size={16} />
                            </button>
                            <button
                                onClick={() => setViewMode('cards')}
                                className={clsx(
                                    "p-2 rounded transition-colors",
                                    viewMode === 'cards' 
                                        ? "bg-arc-orange text-text-inverse" 
                                        : "text-text-muted hover:text-text-primary"
                                )}
                                aria-label="Card view"
                            >
                                <Package size={16} />
                </button>
                        </div>
            </div>

                    {/* Shopping List Content */}
                    <div data-tutorial="items-area">
                    {myItemsDetails.length === 0 ? (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-16 px-4"
                        >
                            <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-bg-card border border-border-primary flex items-center justify-center">
                                <Package size={32} className="text-text-muted" />
                        </div>
                            <h3 className="text-lg font-semibold text-text-primary mb-2">
                                No items yet
                            </h3>
                            <p className="text-text-secondary mb-6 max-w-sm mx-auto">
                                Start building your loadout by adding items from the ARC database.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <button
                                    onClick={() => setShowSearch(true)}
                                    className={clsx(
                                        "inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg",
                                        "bg-arc-orange text-text-inverse font-semibold",
                                        "hover:bg-arc-orange-hover transition-colors"
                                    )}
                                >
                                    <Plus size={18} />
                                    Add Your First Item
                                </button>
                                {presets.length > 0 && (
                                    <button
                                        onClick={() => setShowPresets(true)}
                                        className={clsx(
                                            "inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg",
                                            "bg-bg-card border border-border-primary",
                                            "text-text-primary font-semibold",
                                            "hover:border-arc-green hover:text-arc-green transition-colors"
                                        )}
                                    >
                                        <FileDown size={18} />
                                        Load Preset
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    ) : viewMode === 'list' ? (
                        /* List View with Categories */
                        <div className="space-y-4">
                            {/* If list has categories, show categorized view */}
                            {hasCategories ? (
                                <>
                                    {/* Render each category */}
                                    {activeList?.categories.sort((a, b) => a.phase - b.phase).map(category => {
                                        const categoryItems = itemsByPhase[`phase_${category.phase}`] || [];
                                        const uncheckedCategoryItems = categoryItems.filter(i => !i.checked);
                                        const checkedCategoryItems = categoryItems.filter(i => i.checked);
                                        const isCollapsed = collapsedCategories.has(category.phase);
                                        
                                        return (
                                            <div 
                                                key={category.id}
                                                className={clsx(
                                                    "bg-bg-card border rounded-lg overflow-hidden transition-colors",
                                                    draggedItemId ? "border-arc-orange border-dashed" : "border-border-primary"
                                                )}
                                                onDragOver={(e) => {
                                                    e.preventDefault();
                                                    e.currentTarget.classList.add('bg-arc-orange/10');
                                                }}
                                                onDragLeave={(e) => {
                                                    e.currentTarget.classList.remove('bg-arc-orange/10');
                                                }}
                                                onDrop={(e) => {
                                                    e.preventDefault();
                                                    e.currentTarget.classList.remove('bg-arc-orange/10');
                                                    handleDropOnCategory(category.phase);
                                                }}
                                            >
                                                {/* Category Header */}
                                                <div 
                                                    className="flex items-center gap-2 px-4 py-3 bg-bg-tertiary border-b border-border-primary cursor-pointer select-none"
                                                    onClick={() => toggleCategoryCollapse(category.phase)}
                                                >
                                                    <button className="text-text-muted hover:text-text-primary transition-colors">
                                                        {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                                                    </button>
                                                    
                                                    {editingCategoryId === category.id ? (
                                                        <input
                                                            ref={categoryInputRef}
                                                            type="text"
                                                            value={editingCategoryName}
                                                            onChange={(e) => setEditingCategoryName(e.target.value)}
                                                            onBlur={handleSaveCategoryEdit}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') handleSaveCategoryEdit();
                                                                if (e.key === 'Escape') setEditingCategoryId(null);
                                                            }}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="flex-1 bg-transparent border-b border-arc-orange text-sm font-semibold text-text-primary focus:outline-none"
                                                        />
                                                    ) : (
                                                        <span 
                                                            className="flex-1 text-sm font-semibold text-text-primary uppercase tracking-wider"
                                                            onDoubleClick={(e) => {
                                                                e.stopPropagation();
                                                                handleStartCategoryEdit(category.id, category.name);
                                                            }}
                                                        >
                                                            {category.name}
                                                        </span>
                                                    )}
                                                    
                                                    <span className="text-xs font-mono text-text-muted">
                                                        {uncheckedCategoryItems.length}/{categoryItems.length}
                                                    </span>
                                                    
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (confirm(`Delete "${category.name}"? Items will become uncategorized.`)) {
                                                                deleteCategory(category.id);
                                                            }
                                                        }}
                                                        className="p-1 text-text-muted hover:text-arc-red transition-colors rounded"
                                                        title="Delete category"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                                
                                                {/* Category Items */}
                            <AnimatePresence>
                                                    {!isCollapsed && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            transition={{ duration: 0.2 }}
                                                        >
                                                            {categoryItems.length === 0 ? (
                                                                <div className="p-4 text-center text-text-muted text-sm">
                                                                    Drag items here or add from search
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    {uncheckedCategoryItems.map((item, index) => (
                                                                        <div
                                                                            key={item.itemId}
                                                                            draggable
                                                                            onDragStart={() => handleDragStart(item.itemId)}
                                                                            onDragEnd={handleDragEnd}
                                                                            className="cursor-grab active:cursor-grabbing"
                                                                        >
                                                                            <ItemRow
                                                                                item={item.details!}
                                                                                quantity={item.quantity}
                                                                                checked={item.checked}
                                                                                onUpdateQuantity={(qty) => updateQuantity(item.itemId, qty)}
                                                                                onToggleCheck={() => toggleCheck(item.itemId)}
                                                                                onItemClick={setSelectedItem}
                                                                                index={index}
                                                                                showDragHandle
                                                                            />
                                                                        </div>
                                                                    ))}
                                                                    {checkedCategoryItems.length > 0 && (
                                                                        <div className="border-t border-border-primary opacity-60">
                                                                            {checkedCategoryItems.map((item, index) => (
                                                                                <div
                                                                                    key={item.itemId}
                                                                                    draggable
                                                                                    onDragStart={() => handleDragStart(item.itemId)}
                                                                                    onDragEnd={handleDragEnd}
                                                                                    className="cursor-grab active:cursor-grabbing"
                                                                                >
                                                                                    <ItemRow
                                                                                        item={item.details!}
                                                                                        quantity={item.quantity}
                                                                                        checked={item.checked}
                                                                                        onUpdateQuantity={(qty) => updateQuantity(item.itemId, qty)}
                                                                                        onToggleCheck={() => toggleCheck(item.itemId)}
                                                                                        onItemClick={setSelectedItem}
                                                                                        index={index}
                                                                                        showDragHandle
                                                                                    />
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </>
                                                            )}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        );
                                    })}
                                    
                                    {/* Uncategorized items */}
                                    {itemsByPhase.uncategorized.length > 0 && (
                                        <div 
                                            className={clsx(
                                                "bg-bg-card border rounded-lg overflow-hidden transition-colors",
                                                draggedItemId ? "border-arc-orange border-dashed" : "border-border-primary"
                                            )}
                                            onDragOver={(e) => {
                                                e.preventDefault();
                                                e.currentTarget.classList.add('bg-arc-orange/10');
                                            }}
                                            onDragLeave={(e) => {
                                                e.currentTarget.classList.remove('bg-arc-orange/10');
                                            }}
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                e.currentTarget.classList.remove('bg-arc-orange/10');
                                                handleDropOnCategory(undefined);
                                            }}
                                        >
                                            <div className="px-4 py-3 bg-bg-tertiary border-b border-border-primary">
                                                <span className="text-sm font-semibold text-text-muted uppercase tracking-wider">
                                                    Uncategorized
                                                </span>
                                            </div>
                                            {itemsByPhase.uncategorized.map((item, index) => (
                                                <div
                                                    key={item.itemId}
                                                    draggable
                                                    onDragStart={() => handleDragStart(item.itemId)}
                                                    onDragEnd={handleDragEnd}
                                                    className="cursor-grab active:cursor-grabbing"
                                                >
                                                    <ItemRow
                                                        item={item.details!}
                                                        quantity={item.quantity}
                                                        checked={item.checked}
                                                        onUpdateQuantity={(qty) => updateQuantity(item.itemId, qty)}
                                                        onToggleCheck={() => toggleCheck(item.itemId)}
                                                        onItemClick={setSelectedItem}
                                                        index={index}
                                                        showDragHandle
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    
                                    {/* Add Category Button */}
                                    {showAddCategory ? (
                                        <div className="flex items-center gap-2 p-3 bg-bg-card border border-border-primary rounded-lg">
                                            <input
                                                ref={newCategoryInputRef}
                                                type="text"
                                                placeholder="Category name..."
                                                value={newCategoryName}
                                                onChange={(e) => setNewCategoryName(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleAddCategory();
                                                    if (e.key === 'Escape') setShowAddCategory(false);
                                                }}
                                                className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
                                            />
                                            <button
                                                onClick={handleAddCategory}
                                                className="px-3 py-1.5 text-sm bg-arc-orange text-text-inverse rounded-lg hover:bg-arc-orange-hover transition-colors"
                                            >
                                                Add
                                            </button>
                                            <button
                                                onClick={() => setShowAddCategory(false)}
                                                className="p-1.5 text-text-muted hover:text-text-primary transition-colors"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setShowAddCategory(true)}
                                            className="w-full flex items-center justify-center gap-2 p-3 border border-dashed border-border-primary rounded-lg text-text-muted hover:text-arc-orange hover:border-arc-orange transition-colors"
                                        >
                                            <Plus size={16} />
                                            <span className="text-sm font-medium">Add Category</span>
                                        </button>
                                    )}
                                </>
                            ) : (
                                /* Simple list view without categories */
                                <>
                                    {/* Add Category Input (shown when button is clicked) */}
                                    {showAddCategory && (
                                        <div className="flex items-center gap-2 p-3 bg-bg-card border border-border-primary rounded-lg mb-4">
                                            <FolderPlus size={16} className="text-arc-orange shrink-0" />
                                            <input
                                                ref={newCategoryInputRef}
                                                type="text"
                                                placeholder="Enter category name (e.g., Phase 1)..."
                                                value={newCategoryName}
                                                onChange={(e) => setNewCategoryName(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleAddCategory();
                                                    if (e.key === 'Escape') setShowAddCategory(false);
                                                }}
                                                className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
                                            />
                                            <button
                                                onClick={handleAddCategory}
                                                className="px-3 py-1.5 text-sm bg-arc-orange text-text-inverse rounded-lg hover:bg-arc-orange-hover transition-colors"
                                            >
                                                Add
                                            </button>
                                            <button
                                                onClick={() => setShowAddCategory(false)}
                                                className="p-1.5 text-text-muted hover:text-text-primary transition-colors"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    )}
                                    
                                    <div className="bg-bg-card border border-border-primary rounded-lg overflow-hidden">
                                        <AnimatePresence mode="popLayout">
                                            {uncheckedItems.map((item, index) => (
                                                <ItemRow
                                                    key={item.itemId}
                                                    item={item.details!}
                                                    quantity={item.quantity}
                                                    checked={item.checked}
                                                    onUpdateQuantity={(qty) => updateQuantity(item.itemId, qty)}
                                                    onToggleCheck={() => toggleCheck(item.itemId)}
                                                    onItemClick={setSelectedItem}
                                                    index={index}
                                                />
                                            ))}
                                        </AnimatePresence>

                                        {checkedItems.length > 0 && (
                                            <>
                                                <div className="px-4 py-2 bg-bg-tertiary border-t border-b border-border-primary">
                                                    <span className="text-xs font-mono text-text-muted uppercase tracking-wider">
                                                        Collected ({checkedItems.length})
                                                    </span>
                                                </div>
                                                <AnimatePresence mode="popLayout">
                                                    {checkedItems.map((item, index) => (
                                                        <ItemRow
                                                            key={item.itemId}
                                                            item={item.details!}
                                                            quantity={item.quantity}
                                                            checked={item.checked}
                                                            onUpdateQuantity={(qty) => updateQuantity(item.itemId, qty)}
                                                            onToggleCheck={() => toggleCheck(item.itemId)}
                                                            onItemClick={setSelectedItem}
                                                            index={index}
                                                        />
                                                    ))}
                                                </AnimatePresence>
                                            </>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        /* Card View */
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <AnimatePresence mode="popLayout">
                                {myItemsDetails.map((item, index) => (
                                    <ItemCard
                                        key={item.itemId}
                                        item={item.details!}
                                        quantity={item.quantity}
                                        checked={item.checked}
                                        onUpdateQuantity={(qty) => updateQuantity(item.itemId, qty)}
                                        onToggleCheck={() => toggleCheck(item.itemId)}
                                        onItemClick={setSelectedItem}
                                        mode="view"
                                        index={index}
                                    />
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
                </div>
            </div>

            {/* Search Modal */}
            <AnimatePresence>
                {showSearch && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4"
                        onClick={() => setShowSearch(false)}
                    >
                        {/* Backdrop */}
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        
                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, y: -20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.95 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="relative w-full max-w-2xl bg-bg-secondary border border-border-primary rounded-xl shadow-2xl overflow-hidden"
                            style={{ backgroundColor: 'var(--bg-secondary)' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Search Header */}
                            <div className="flex items-center gap-3 p-4 border-b border-border-primary bg-bg-secondary">
                                <Search size={20} className="text-text-muted shrink-0" />
                        <input
                                    ref={searchInputRef}
                            type="text"
                                    className={clsx(
                                        "flex-1 bg-transparent text-lg",
                                        "text-text-primary placeholder:text-text-muted",
                                        "focus:outline-none"
                                    )}
                                    placeholder="Search items..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                                <button
                                    onClick={() => setShowSearch(false)}
                                    className="p-2 text-text-muted hover:text-text-primary transition-colors rounded-lg hover:bg-bg-tertiary"
                                >
                                    <X size={20} />
                                </button>
                    </div>

                            {/* Search Results */}
                            <div className="max-h-[60vh] overflow-y-auto bg-bg-secondary">
                                {searchTerm.trim() ? (
                                    filteredItems.length > 0 ? (
                                        <div className="p-2 space-y-2">
                                            {filteredItems.map((item, index) => {
                                                const inList = activeList?.items.find(i => i.itemId === item.id);
                                return (
                                    <ItemCard
                                        key={item.id}
                                        item={item}
                                        quantity={inList ? inList.quantity : 0}
                                        onUpdateQuantity={(qty) => updateQuantity(item.id, qty)}
                                                        onItemClick={setSelectedItem}
                                        mode="edit"
                                                        index={index}
                                                    />
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="p-8 text-center bg-bg-secondary">
                                            <p className="text-text-muted">No items found for "{searchTerm}"</p>
                                        </div>
                                    )
                                ) : (
                                    <div className="p-8 text-center bg-bg-secondary">
                                        <p className="text-text-muted font-mono text-sm">
                                            Start typing to search the ARC database...
                                        </p>
                            </div>
                        )}
                    </div>

                            {/* Footer hint */}
                            <div className="p-3 border-t border-border-primary bg-bg-tertiary">
                                <p className="text-xs text-text-muted text-center">
                                    Press <kbd className="px-1.5 py-0.5 bg-bg-card border border-border-primary rounded text-[10px] font-mono">ESC</kbd> to close
                                </p>
                </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Share Modal */}
            <AnimatePresence>
                {showShareModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        onClick={() => setShowShareModal(false)}
                    >
                        {/* Backdrop */}
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        
                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative w-full max-w-md bg-bg-secondary border border-border-primary rounded-xl shadow-2xl overflow-hidden"
                            style={{ backgroundColor: 'var(--bg-secondary)' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-display font-bold text-text-primary uppercase">
                                        Share List
                                    </h3>
                                    <button
                                        onClick={() => setShowShareModal(false)}
                                        className="p-2 text-text-muted hover:text-text-primary transition-colors rounded-lg hover:bg-bg-tertiary"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                                
                                <p className="text-text-secondary text-sm mb-4">
                                    Share this link with friends. They'll get their own copy to track.
                                </p>

                                {/* URL Display */}
                                <div className="flex items-center gap-2 p-3 bg-bg-tertiary border border-border-primary rounded-lg mb-4">
                                    <input
                                        type="text"
                                        value={shareUrl}
                                        readOnly
                                        className="flex-1 bg-transparent text-sm text-text-primary font-mono truncate focus:outline-none"
                                    />
                                    <button
                                        onClick={copyToClipboard}
                                        className={clsx(
                                            "shrink-0 p-2 rounded-lg transition-colors",
                                            copied 
                                                ? "bg-arc-green text-text-inverse" 
                                                : "bg-bg-card hover:bg-arc-orange hover:text-text-inverse text-text-secondary border border-border-primary"
                                        )}
                                    >
                                        {copied ? <Check size={16} /> : <Copy size={16} />}
                                    </button>
                                </div>

                                {/* QR Code */}
                                <div className="flex flex-col items-center gap-3 mb-4">
                                    <div className="p-4 bg-white rounded-xl shadow-inner">
                                        <QRCodeSVG 
                                            value={shareUrl} 
                                            size={160}
                                            level="M"
                                            includeMargin={false}
                                        />
                                    </div>
                                    <p className="text-text-muted text-xs">
                                        Scan to import on another device
                                    </p>
                                </div>

                                {copied && (
                                    <motion.p
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-center text-sm text-arc-green font-medium"
                                    >
                                        Link copied to clipboard!
                                    </motion.p>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Presets Modal */}
            <AnimatePresence>
                {showPresets && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        onClick={() => { setShowPresets(false); setPendingPreset(null); }}
                    >
                        {/* Backdrop */}
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        
                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className={clsx(
                                "relative w-full bg-bg-secondary border border-border-primary rounded-xl shadow-2xl overflow-hidden",
                                pendingPreset ? "max-w-md" : "max-w-lg"
                            )}
                            style={{ backgroundColor: 'var(--bg-secondary)' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {pendingPreset ? (
                                /* Confirmation Dialog */
                                <div className="p-6">
                                    <div className="w-14 h-14 mx-auto mb-4 bg-arc-orange/20 rounded-full flex items-center justify-center">
                                        <FileDown size={28} className="text-arc-orange" />
                                    </div>
                                    <h3 className="text-xl font-display font-bold text-text-primary uppercase text-center mb-2">
                                        Import Preset?
                                    </h3>
                                    <p className="text-text-secondary text-sm text-center mb-6">
                                        This will create a <strong>new list</strong> with the preset items and phases.
                                        Your current list "{activeList?.name}" will remain unchanged.
                                    </p>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={cancelPresetImport}
                                            className="flex-1 px-4 py-2.5 rounded-lg border border-border-primary text-text-primary hover:bg-bg-card transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={confirmPresetImport}
                                            disabled={loadingPreset}
                                            className="flex-1 px-4 py-2.5 rounded-lg bg-arc-green text-text-inverse font-semibold hover:bg-arc-green/90 transition-colors disabled:opacity-50"
                                        >
                                            {loadingPreset ? 'Importing...' : 'Import'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                /* Preset List */
                                <div className="flex flex-col max-h-[80vh]">
                                    {/* Header */}
                                    <div className="p-6 pb-4 border-b border-border-primary shrink-0">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-arc-green/20 rounded-lg flex items-center justify-center">
                                                    <FolderOpen size={20} className="text-arc-green" />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-display font-bold text-text-primary uppercase">
                                                        Presets
                                                    </h3>
                                                    <p className="text-xs text-text-muted">{presets.length} pre-made lists available</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => { setShowPresets(false); setPresetSearch(''); }}
                                                className="p-2 text-text-muted hover:text-text-primary transition-colors rounded-lg hover:bg-bg-tertiary"
                                            >
                                                <X size={20} />
                                            </button>
                                        </div>
                                        
                                        {/* Search Input */}
                                        <div className="relative">
                                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                                            <input
                                                type="text"
                                                value={presetSearch}
                                                onChange={(e) => setPresetSearch(e.target.value)}
                                                placeholder="Search presets..."
                                                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-bg-card border border-border-primary text-text-primary placeholder:text-text-muted focus:outline-none focus:border-arc-green transition-colors"
                                            />
                                            {presetSearch && (
                                                <button
                                                    onClick={() => setPresetSearch('')}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-primary"
                                                >
                                                    <X size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Scrollable Content */}
                                    <div className="overflow-y-auto flex-1 p-6 pt-4">
                                        {presets.length === 0 ? (
                                            <div className="text-center py-8 text-text-muted">
                                                <p>No presets available</p>
                                            </div>
                                        ) : filteredPresets.length === 0 ? (
                                            <div className="text-center py-8 text-text-muted">
                                                <Search size={32} className="mx-auto mb-2 opacity-50" />
                                                <p>No presets match "{presetSearch}"</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {presetsByCategory.sortedCategories.map(category => {
                                                    const categoryPresets = presetsByCategory.groups[category];
                                                    const isCollapsed = collapsedPresetCategories.has(category);
                                                    
                                                    return (
                                                        <div key={category} className="border border-border-primary rounded-lg overflow-hidden">
                                                            {/* Category Header */}
                                                            <button
                                                                onClick={() => togglePresetCategory(category)}
                                                                className="w-full flex items-center justify-between px-4 py-3 bg-bg-tertiary hover:bg-bg-card transition-colors"
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    {isCollapsed ? (
                                                                        <ChevronRight size={16} className="text-text-muted" />
                                                                    ) : (
                                                                        <ChevronDown size={16} className="text-text-muted" />
                                                                    )}
                                                                    <span className="font-display font-semibold text-text-primary uppercase text-sm tracking-wider">
                                                                        {category.replace(/_/g, ' ')}
                                                                    </span>
                                                                </div>
                                                                <span className="text-xs font-mono text-text-muted bg-bg-primary px-2 py-0.5 rounded">
                                                                    {categoryPresets.length}
                                                                </span>
                                                            </button>
                                                            
                                                            {/* Category Presets */}
                                                            <AnimatePresence>
                                                                {!isCollapsed && (
                                                                    <motion.div
                                                                        initial={{ height: 0, opacity: 0 }}
                                                                        animate={{ height: 'auto', opacity: 1 }}
                                                                        exit={{ height: 0, opacity: 0 }}
                                                                        transition={{ duration: 0.2 }}
                                                                        className="overflow-hidden"
                                                                    >
                                                                        <div className="p-2 space-y-1 bg-bg-card">
                                                                            {categoryPresets.map(preset => (
                                                                                <button
                                                                                    key={preset.filename}
                                                                                    onClick={() => handleImportPreset(preset.filename)}
                                                                                    disabled={loadingPreset}
                                                                                    className={clsx(
                                                                                        "w-full flex items-center gap-3 p-3 rounded-lg text-left",
                                                                                        "bg-bg-secondary border border-transparent",
                                                                                        "hover:border-arc-green hover:bg-arc-green/5 transition-colors",
                                                                                        "disabled:opacity-50 disabled:cursor-wait"
                                                                                    )}
                                                                                >
                                                                                    <div className="w-10 h-10 bg-bg-tertiary rounded-lg flex items-center justify-center shrink-0">
                                                                                        <FileDown size={18} className="text-arc-green" />
                                                                                    </div>
                                                                                    <div className="flex-1 min-w-0">
                                                                                        <h4 className="font-semibold text-text-primary truncate text-sm">
                                                                                            {preset.name}
                                                                                        </h4>
                                                                                        <p className="text-xs text-text-muted truncate">
                                                                                            {preset.description}
                                                                                        </p>
                                                                                    </div>
                                                                                    <ChevronRight size={16} className="text-text-muted shrink-0" />
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    </motion.div>
                                                                )}
                                                            </AnimatePresence>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Footer */}
                                    <div className="p-4 border-t border-border-primary shrink-0 bg-bg-tertiary">
                                        <p className="text-xs text-text-muted text-center mb-2">
                                            Importing a preset creates a new list with phases
                                        </p>
                                        <a 
                                            href="https://github.com/theyetty/scrappymart" 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center gap-1.5 text-xs text-arc-green hover:text-arc-green/80 transition-colors"
                                        >
                                            <ExternalLink size={12} />
                                            <span>Add global presets</span>
                                        </a>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Item Detail Modal */}
            <ItemDetailModal 
                item={selectedItem} 
                onClose={() => setSelectedItem(null)} 
            />

            {/* Duplicate Import Modal - z-[250] to be above tutorial (z-[200]) */}
            <AnimatePresence>
                {pendingImport && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[250] flex items-center justify-center p-4"
                        onClick={cancelPendingImport}
                    >
                        {/* Backdrop */}
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        
                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative w-full max-w-md bg-bg-secondary border border-border-primary rounded-xl shadow-2xl overflow-hidden"
                            style={{ backgroundColor: 'var(--bg-secondary)' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6">
                                <div className="w-14 h-14 mx-auto mb-4 bg-arc-orange/20 rounded-full flex items-center justify-center">
                                    <Copy size={28} className="text-arc-orange" />
                                </div>
                                <h3 className="text-xl font-display font-bold text-text-primary uppercase text-center mb-2">
                                    List Already Exists
                                </h3>
                                <p className="text-text-secondary text-sm text-center mb-2">
                                    A list named <strong className="text-text-primary">"{pendingImport.name}"</strong> already exists.
                                </p>
                                <p className="text-text-muted text-xs text-center mb-6">
                                    Would you like to overwrite it or import as a new list?
                                </p>
                                
                                <div className="space-y-3">
                                    <button
                                        onClick={confirmImportOverwrite}
                                        className={clsx(
                                            "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg",
                                            "bg-arc-orange text-text-inverse font-semibold",
                                            "hover:bg-arc-orange/90 transition-colors"
                                        )}
                                    >
                                        <RefreshCw size={18} />
                                        Overwrite Existing List
                                    </button>
                                    <button
                                        onClick={confirmImportAsNew}
                                        className={clsx(
                                            "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg",
                                            "bg-bg-card border border-border-primary text-text-primary font-semibold",
                                            "hover:border-arc-green hover:text-arc-green transition-colors"
                                        )}
                                    >
                                        <Plus size={18} />
                                        Import as New List
                                    </button>
                                    <button
                                        onClick={cancelPendingImport}
                                        className="w-full px-4 py-2.5 text-sm text-text-muted hover:text-text-primary transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* About Modal */}
            <AnimatePresence>
                {showAbout && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        onClick={() => setShowAbout(false)}
                    >
                        {/* Backdrop */}
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        
                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg bg-bg-secondary border border-border-primary rounded-xl shadow-2xl overflow-hidden"
                            style={{ backgroundColor: 'var(--bg-secondary)' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="p-6 pb-4 border-b border-border-primary">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <img 
                                            src="/logo.webp" 
                                            alt="Scrappy" 
                                            className="w-12 h-12 object-contain"
                                        />
                                        <div>
                                            <h3 className="text-xl font-display font-bold text-text-primary uppercase">
                                                About Scrappy Mart
                                            </h3>
                                            <p className="text-xs text-text-muted">Your Raider Supply List</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowAbout(false)}
                                        className="p-2 text-text-muted hover:text-text-primary transition-colors rounded-lg hover:bg-bg-tertiary"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-5">
                                {/* Purpose */}
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 bg-arc-orange/20 rounded-lg flex items-center justify-center shrink-0">
                                        <Users size={20} className="text-arc-orange" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-text-primary mb-1">Built for Raiders</h4>
                                        <p className="text-sm text-text-secondary">
                                            The easiest way to plan and share raid loadouts with your squad. 
                                            Build your shopping list, hit Share, and your friends instantly get the same list. 
                                            No more typing out what you need in Discord!
                                        </p>
                                    </div>
                                </div>

                                {/* Open Source */}
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 bg-arc-green/20 rounded-lg flex items-center justify-center shrink-0">
                                        <Github size={20} className="text-arc-green" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-text-primary mb-1">100% Open Source</h4>
                                        <p className="text-sm text-text-secondary">
                                            All the code is open on GitHub. Anyone can view, contribute, or fork it. 
                                            Built by the community, for the community.
                                        </p>
                                    </div>
                                </div>

                                {/* Privacy */}
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center shrink-0">
                                        <Shield size={20} className="text-blue-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-text-primary mb-1">Privacy First</h4>
                                        <p className="text-sm text-text-secondary">
                                            <strong>No ads. No tracking. No accounts.</strong> Your lists are stored locally 
                                            in your browser - we never see them. Your data is yours.
                                        </p>
                                    </div>
                                </div>

                                {/* Made with love */}
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 bg-pink-500/20 rounded-lg flex items-center justify-center shrink-0">
                                        <Heart size={20} className="text-pink-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-text-primary mb-1">Made With Love</h4>
                                        <p className="text-sm text-text-secondary">
                                            A passion project by a fellow raider. If you find it useful, 
                                            consider buying me a coffee! ☕
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Disclaimer */}
                            <div className="px-6 py-4 bg-bg-tertiary/50 border-t border-border-primary">
                                <p className="text-xs text-text-muted text-center leading-relaxed">
                                    <strong>Disclaimer:</strong> This is an unofficial fan-made tool and is not affiliated with, 
                                    endorsed by, or connected to Embark Studios or ARC Raiders. All game content, names, and 
                                    assets referenced belong to their respective owners. This project is made for the community, 
                                    by the community.
                                </p>
                            </div>

                            {/* Footer */}
                            <div className="p-4 border-t border-border-primary bg-bg-tertiary flex items-center justify-center gap-4">
                                <a 
                                    href="https://github.com/theyetty/scrappymart" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-bg-card border border-border-primary hover:border-arc-green text-text-secondary hover:text-text-primary transition-colors"
                                >
                                    <Github size={16} />
                                    <span className="text-sm">View on GitHub</span>
                                </a>
                                <a 
                                    href="https://buymeacoffee.com/yetty" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-arc-orange/20 border border-arc-orange/30 hover:border-arc-orange text-arc-orange transition-colors"
                                >
                                    <span>☕</span>
                                    <span className="text-sm">Buy me a coffee</span>
                                </a>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Tutorial for new users */}
            {showTutorial && (
                <Tutorial 
                    onComplete={completeTutorial}
                    onOpenMobileSidebar={() => setShowMobileSidebar(true)}
                    onCloseMobileSidebar={() => setShowMobileSidebar(false)}
                    onCreateDemoList={() => {
                        // Create "Scrappy's Treats" with 5 Lemons (251) and 3 Mushrooms (287)
                        createListWithItems("Scrappy's Treats", [
                            { itemId: 251, quantity: 5 }, // 5 Lemons
                            { itemId: 287, quantity: 3 }  // 3 Mushrooms
                        ]);
                    }}
                />
            )}
        </Layout>
    );
};
