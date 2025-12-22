import React from 'react';
import type { Item, ItemRarity } from '../data/items';
import { Plus, Minus, Trash2, Info, GripVertical } from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

interface ItemCardProps {
    item: Item;
    quantity: number;
    checked?: boolean;
    onUpdateQuantity: (newQty: number) => void;
    onToggleCheck?: () => void;
    onItemClick?: (item: Item) => void;
    mode?: 'view' | 'edit';
    index?: number;
}

const getRarityStyles = (rarity: ItemRarity | string) => {
    switch (rarity) {
        case 'COMMON':
            return {
                border: 'border-text-muted/30',
                bg: 'bg-text-muted/10',
                text: 'text-text-secondary',
                dot: 'bg-text-muted'
            };
        case 'UNCOMMON':
            return {
                border: 'border-emerald-500/40',
                bg: 'bg-emerald-500/10',
                text: 'text-emerald-500',
                dot: 'bg-emerald-500'
            };
        case 'RARE':
            return {
                border: 'border-blue-500/40',
                bg: 'bg-blue-500/10',
                text: 'text-blue-500',
                dot: 'bg-blue-500'
            };
        case 'EPIC':
            return {
                border: 'border-purple-500/40',
                bg: 'bg-purple-500/10',
                text: 'text-purple-500',
                dot: 'bg-purple-500'
            };
        case 'LEGENDARY':
            return {
                border: 'border-amber-500/40',
                bg: 'bg-amber-500/10',
                text: 'text-amber-500',
                dot: 'bg-amber-500'
            };
        default:
            return {
                border: 'border-border-primary',
                bg: 'bg-bg-tertiary',
                text: 'text-text-secondary',
                dot: 'bg-text-muted'
            };
    }
};

export const ItemCard: React.FC<ItemCardProps> = ({ 
    item, 
    quantity, 
    checked, 
    onUpdateQuantity, 
    onToggleCheck,
    onItemClick,
    mode = 'edit',
    index = 0 
}) => {
    const [isEditingQty, setIsEditingQty] = React.useState(false);
    const [editQtyValue, setEditQtyValue] = React.useState(quantity.toString());
    const qtyInputRef = React.useRef<HTMLInputElement>(null);
    const isSelected = quantity > 0;
    const rarityStyles = getRarityStyles(item.rarity);

    // Focus input when editing starts
    React.useEffect(() => {
        if (isEditingQty && qtyInputRef.current) {
            qtyInputRef.current.focus();
            qtyInputRef.current.select();
        }
    }, [isEditingQty]);

    // Update local value when quantity prop changes
    React.useEffect(() => {
        if (!isEditingQty) {
            setEditQtyValue(quantity.toString());
        }
    }, [quantity, isEditingQty]);

    const handleQtyClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditQtyValue(quantity.toString());
        setIsEditingQty(true);
    };

    const handleQtySave = () => {
        const newQty = parseInt(editQtyValue, 10);
        if (!isNaN(newQty) && newQty >= 0) {
            onUpdateQuantity(newQty);
        } else {
            setEditQtyValue(quantity.toString());
        }
        setIsEditingQty(false);
    };

    const handleQtyKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleQtySave();
        } else if (e.key === 'Escape') {
            setEditQtyValue(quantity.toString());
            setIsEditingQty(false);
        }
    };

    const handleItemClick = (e: React.MouseEvent) => {
        // Don't trigger if clicking on controls
        if ((e.target as HTMLElement).closest('button, input')) return;
        onItemClick?.(item);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2, delay: index * 0.03 }}
            onClick={handleItemClick}
            className={clsx(
                "group relative",
                "bg-bg-card border border-border-primary rounded-lg",
                "hover:border-border-secondary hover:shadow-card",
                "transition-all duration-200",
                checked && "opacity-60",
                onItemClick && "cursor-pointer"
            )}
        >
            <div className="flex items-center gap-3 p-3 sm:p-4">
                {/* Checkbox (view mode only) */}
                {mode === 'view' && (
                    <input
                        type="checkbox"
                        checked={checked}
                        onChange={onToggleCheck}
                        className="cursor-pointer"
                    />
                )}

                {/* Item Image */}
                <div className={clsx(
                    "w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-lg overflow-hidden",
                    "border-2",
                    rarityStyles.border,
                    rarityStyles.bg,
                    "flex items-center justify-center",
                    "relative group/img"
                )}>
                    {item.imageFile ? (
                        <img 
                            src={`/data/${item.imageFile}`} 
                            alt={item.name} 
                            className={clsx(
                                "w-full h-full object-contain p-1",
                                checked && "grayscale"
                            )} 
                            loading="lazy"
                        />
                    ) : (
                        <div className="text-[10px] text-text-muted font-mono">N/A</div>
                    )}
                    
                    {/* Info overlay on hover */}
                    {onItemClick && (
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                            <Info size={16} className="text-white" />
                        </div>
                    )}
                </div>

                {/* Item Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                            <h3 className={clsx(
                                "font-semibold text-sm sm:text-base leading-tight",
                                "text-text-primary truncate",
                                checked && "line-through text-text-muted"
                            )}>
                                {item.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={clsx(
                                    "w-1.5 h-1.5 rounded-full shrink-0",
                                    rarityStyles.dot
                                )} />
                                <span className={clsx(
                                    "text-xs font-mono uppercase tracking-wider",
                                    rarityStyles.text
                                )}>
                                    {item.rarity}
                                </span>
                                <span className="text-text-muted text-xs">•</span>
                                <span className="text-xs text-text-muted truncate">
                                    {item.category}
                                </span>
                            </div>
                        </div>

                        {/* Quantity Badge (when selected in edit mode) */}
                        {isSelected && mode === 'edit' && (
                            <div className="shrink-0 bg-arc-orange text-text-inverse text-xs font-bold px-2 py-1 rounded font-mono">
                                ×{quantity}
                            </div>
                        )}
                    </div>
                </div>

                {/* Quantity Controls */}
                <div className={clsx(
                    "flex items-center gap-1 shrink-0",
                    mode === 'view' ? 'ml-auto' : ''
                )}>
                    {mode === 'view' && (
                        isEditingQty ? (
                            <input
                                ref={qtyInputRef}
                                type="number"
                                min="0"
                                value={editQtyValue}
                                onChange={(e) => setEditQtyValue(e.target.value)}
                                onBlur={handleQtySave}
                                onKeyDown={handleQtyKeyDown}
                                onClick={(e) => e.stopPropagation()}
                                className="w-16 text-center font-mono text-sm font-semibold bg-bg-tertiary border border-arc-orange rounded px-2 py-1 mr-2 focus:outline-none text-text-primary"
                            />
                        ) : (
                            <button
                                onClick={handleQtyClick}
                                className="text-sm font-mono font-semibold text-text-primary mr-2 min-w-[2rem] text-center hover:text-arc-orange hover:bg-bg-tertiary rounded px-2 py-1 transition-colors"
                                title="Click to edit quantity"
                            >
                                ×{quantity}
                            </button>
                        )
                    )}
                    
                    <div className={clsx(
                        "flex items-center rounded-lg border border-border-primary",
                        "bg-bg-tertiary overflow-hidden"
                    )}>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onUpdateQuantity(Math.max(0, quantity - 1));
                            }}
                            disabled={quantity === 0}
                            className={clsx(
                                "p-2 hover:bg-bg-card-hover transition-colors",
                                "disabled:opacity-30 disabled:cursor-not-allowed",
                                "text-text-secondary hover:text-text-primary"
                            )}
                            aria-label="Decrease quantity"
                        >
                            {quantity === 1 ? (
                                <Trash2 size={14} className="text-arc-red" />
                            ) : (
                                <Minus size={14} />
                            )}
                        </button>
                        
                        {mode === 'edit' && (
                            isEditingQty ? (
                                <input
                                    ref={qtyInputRef}
                                    type="number"
                                    min="0"
                                    value={editQtyValue}
                                    onChange={(e) => setEditQtyValue(e.target.value)}
                                    onBlur={handleQtySave}
                                    onKeyDown={handleQtyKeyDown}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-12 text-center font-mono text-sm font-semibold bg-transparent border-none focus:outline-none text-text-primary"
                                />
                            ) : (
                                <button
                                    onClick={handleQtyClick}
                                    className="w-8 text-center font-mono text-sm font-semibold text-text-primary hover:text-arc-orange transition-colors"
                                    title="Click to edit"
                                >
                                    {quantity}
                                </button>
                            )
                        )}
                        
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onUpdateQuantity(quantity + 1);
                            }}
                            className={clsx(
                                "p-2 hover:bg-bg-card-hover transition-colors",
                                "text-text-secondary hover:text-arc-orange"
                            )}
                            aria-label="Increase quantity"
                        >
                            <Plus size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

interface ItemRowProps extends ItemCardProps {
    showDragHandle?: boolean;
}

// Compact version for the checklist
export const ItemRow: React.FC<ItemRowProps> = ({ 
    item, 
    quantity, 
    checked, 
    onUpdateQuantity, 
    onToggleCheck,
    onItemClick,
    index = 0,
    showDragHandle = false
}) => {
    const [isEditingQty, setIsEditingQty] = React.useState(false);
    const [editQtyValue, setEditQtyValue] = React.useState(quantity.toString());
    const qtyInputRef = React.useRef<HTMLInputElement>(null);
    const rarityStyles = getRarityStyles(item.rarity);

    // Focus input when editing starts
    React.useEffect(() => {
        if (isEditingQty && qtyInputRef.current) {
            qtyInputRef.current.focus();
            qtyInputRef.current.select();
        }
    }, [isEditingQty]);

    // Update local value when quantity prop changes
    React.useEffect(() => {
        if (!isEditingQty) {
            setEditQtyValue(quantity.toString());
        }
    }, [quantity, isEditingQty]);

    const handleQtyClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditQtyValue(quantity.toString());
        setIsEditingQty(true);
    };

    const handleQtySave = () => {
        const newQty = parseInt(editQtyValue, 10);
        if (!isNaN(newQty) && newQty >= 0) {
            onUpdateQuantity(newQty);
        } else {
            setEditQtyValue(quantity.toString());
        }
        setIsEditingQty(false);
    };

    const handleQtyKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleQtySave();
        } else if (e.key === 'Escape') {
            setEditQtyValue(quantity.toString());
            setIsEditingQty(false);
        }
    };

    const handleItemClick = (e: React.MouseEvent) => {
        // Don't trigger if clicking on controls
        if ((e.target as HTMLElement).closest('button, input')) return;
        onItemClick?.(item);
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20, height: 0 }}
            transition={{ duration: 0.2, delay: index * 0.02 }}
            layout
            onClick={handleItemClick}
            className={clsx(
                "group flex items-center gap-3 py-3 px-4",
                "border-b border-border-primary last:border-b-0",
                "hover:bg-bg-card-hover transition-colors",
                checked && "opacity-60",
                onItemClick && "cursor-pointer"
            )}
        >
            {/* Drag Handle */}
            {showDragHandle && (
                <div className="text-text-muted hover:text-text-secondary cursor-grab active:cursor-grabbing">
                    <GripVertical size={14} />
                </div>
            )}

            {/* Checkbox */}
            <input
                type="checkbox"
                checked={checked}
                onChange={onToggleCheck}
                className="cursor-pointer"
            />

            {/* Mini Image */}
            <div className={clsx(
                "w-8 h-8 shrink-0 rounded overflow-hidden",
                "border",
                rarityStyles.border,
                rarityStyles.bg,
                "flex items-center justify-center",
                "relative group/img"
            )}>
                {item.imageFile ? (
                    <img 
                        src={`/data/${item.imageFile}`} 
                        alt={item.name} 
                        className={clsx(
                            "w-full h-full object-contain",
                            checked && "grayscale"
                        )} 
                        loading="lazy"
                    />
                ) : (
                    <div className="text-[8px] text-text-muted">N/A</div>
                )}
                
                {/* Info overlay on hover */}
                {onItemClick && (
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                        <Info size={12} className="text-white" />
                    </div>
                )}
            </div>

            {/* Name & Rarity */}
            <div className="flex-1 min-w-0">
                <span className={clsx(
                    "text-sm font-medium text-text-primary",
                    checked && "line-through text-text-muted"
                )}>
                    {item.name}
                </span>
                <span className={clsx(
                    "ml-2 text-xs font-mono uppercase",
                    rarityStyles.text
                )}>
                    {item.rarity.charAt(0)}
                </span>
            </div>

            {/* Quantity */}
            <div className="flex items-center gap-1">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onUpdateQuantity(Math.max(0, quantity - 1));
                    }}
                    className="p-1 text-text-muted hover:text-text-primary transition-colors"
                >
                    <Minus size={12} />
                </button>
                {isEditingQty ? (
                    <input
                        ref={qtyInputRef}
                        type="number"
                        min="0"
                        value={editQtyValue}
                        onChange={(e) => setEditQtyValue(e.target.value)}
                        onBlur={handleQtySave}
                        onKeyDown={handleQtyKeyDown}
                        onClick={(e) => e.stopPropagation()}
                        className="w-12 text-center font-mono text-sm font-semibold bg-bg-tertiary border border-arc-orange rounded px-1 py-0.5 focus:outline-none text-text-primary"
                    />
                ) : (
                    <button
                        onClick={handleQtyClick}
                        className="min-w-[2rem] text-center font-mono text-sm font-semibold text-text-primary hover:text-arc-orange hover:bg-bg-tertiary rounded px-1 py-0.5 transition-colors"
                        title="Click to edit quantity"
                    >
                        {quantity}
                    </button>
                )}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onUpdateQuantity(quantity + 1);
                    }}
                    className="p-1 text-text-muted hover:text-arc-orange transition-colors"
                >
                    <Plus size={12} />
                </button>
            </div>
        </motion.div>
    );
};
