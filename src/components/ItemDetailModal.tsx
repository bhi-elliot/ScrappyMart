import React from 'react';
import type { Item, ItemRarity } from '../data/items';
import { X, Package, Scale, Coins, Layers, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

interface ItemDetailModalProps {
    item: Item | null;
    onClose: () => void;
}

const getRarityStyles = (rarity: ItemRarity | string) => {
    switch (rarity) {
        case 'COMMON':
            return {
                border: 'border-text-muted/50',
                bg: 'bg-text-muted/10',
                text: 'text-text-secondary',
                glow: 'shadow-none',
                badge: 'bg-text-muted/20 text-text-secondary'
            };
        case 'UNCOMMON':
            return {
                border: 'border-emerald-500/50',
                bg: 'bg-emerald-500/10',
                text: 'text-emerald-400',
                glow: 'shadow-[0_0_30px_rgba(16,185,129,0.15)]',
                badge: 'bg-emerald-500/20 text-emerald-400'
            };
        case 'RARE':
            return {
                border: 'border-blue-500/50',
                bg: 'bg-blue-500/10',
                text: 'text-blue-400',
                glow: 'shadow-[0_0_30px_rgba(59,130,246,0.15)]',
                badge: 'bg-blue-500/20 text-blue-400'
            };
        case 'EPIC':
            return {
                border: 'border-purple-500/50',
                bg: 'bg-purple-500/10',
                text: 'text-purple-400',
                glow: 'shadow-[0_0_30px_rgba(168,85,247,0.2)]',
                badge: 'bg-purple-500/20 text-purple-400'
            };
        case 'LEGENDARY':
            return {
                border: 'border-amber-500/50',
                bg: 'bg-amber-500/10',
                text: 'text-amber-400',
                glow: 'shadow-[0_0_40px_rgba(245,158,11,0.25)]',
                badge: 'bg-amber-500/20 text-amber-400'
            };
        default:
            return {
                border: 'border-border-primary',
                bg: 'bg-bg-tertiary',
                text: 'text-text-secondary',
                glow: 'shadow-none',
                badge: 'bg-bg-tertiary text-text-muted'
            };
    }
};

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({ item, onClose }) => {
    if (!item) return null;

    const rarityStyles = getRarityStyles(item.rarity);

    return (
        <AnimatePresence>
            {item && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    onClick={onClose}
                >
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
                    
                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className={clsx(
                            "relative w-full max-w-lg",
                            "bg-bg-secondary border rounded-xl overflow-hidden",
                            rarityStyles.border,
                            rarityStyles.glow
                        )}
                        style={{ backgroundColor: 'var(--bg-secondary)' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-bg-tertiary/80 text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-colors"
                        >
                            <X size={20} />
                        </button>

                        {/* Image Header */}
                        <div className={clsx(
                            "relative h-48 flex items-center justify-center",
                            rarityStyles.bg
                        )}>
                            {/* Background pattern */}
                            <div 
                                className="absolute inset-0 opacity-10"
                                style={{
                                    backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
                                    backgroundSize: '16px 16px'
                                }}
                            />
                            
                            {item.imageFile ? (
                                <motion.img 
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.1 }}
                                    src={`/data/${item.imageFile}`} 
                                    alt={item.name} 
                                    className="w-32 h-32 object-contain drop-shadow-2xl"
                                />
                            ) : (
                                <Package size={64} className="text-text-muted" />
                            )}
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            {/* Header */}
                            <div className="mb-4">
                                <div className="flex items-start justify-between gap-4 mb-2">
                                    <h2 className="text-2xl font-display font-bold text-text-primary uppercase tracking-wide">
                                        {item.name}
                                    </h2>
                                </div>
                                
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className={clsx(
                                        "px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider",
                                        rarityStyles.badge
                                    )}>
                                        <Sparkles size={12} className="inline mr-1" />
                                        {item.rarity}
                                    </span>
                                    <span className="px-2.5 py-1 rounded text-xs font-mono uppercase tracking-wider bg-bg-tertiary text-text-muted">
                                        {item.category}
                                    </span>
                                </div>
                            </div>

                            {/* Description */}
                            <p className="text-text-secondary text-sm leading-relaxed mb-6">
                                {item.description}
                            </p>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-3 gap-3 mb-4">
                                {item.cost !== null && (
                                    <div className="bg-bg-tertiary rounded-lg p-3 text-center">
                                        <Coins size={18} className="mx-auto mb-1 text-amber-400" />
                                        <div className="text-lg font-bold text-text-primary font-mono">
                                            {item.cost.toLocaleString()}
                                        </div>
                                        <div className="text-[10px] text-text-muted uppercase tracking-wider">
                                            Value
                                        </div>
                                    </div>
                                )}
                                
                                {item.weight !== null && (
                                    <div className="bg-bg-tertiary rounded-lg p-3 text-center">
                                        <Scale size={18} className="mx-auto mb-1 text-blue-400" />
                                        <div className="text-lg font-bold text-text-primary font-mono">
                                            {item.weight}
                                        </div>
                                        <div className="text-[10px] text-text-muted uppercase tracking-wider">
                                            Weight
                                        </div>
                                    </div>
                                )}
                                
                                {item.stack !== null && (
                                    <div className="bg-bg-tertiary rounded-lg p-3 text-center">
                                        <Layers size={18} className="mx-auto mb-1 text-emerald-400" />
                                        <div className="text-lg font-bold text-text-primary font-mono">
                                            {item.stack}
                                        </div>
                                        <div className="text-[10px] text-text-muted uppercase tracking-wider">
                                            Stack
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Effects */}
                            {item.effects && item.effects.length > 0 && (
                                <div className="mb-4">
                                    <h3 className="text-xs font-mono text-text-muted uppercase tracking-wider mb-2">
                                        Effects
                                    </h3>
                                    <ul className="space-y-1">
                                        {item.effects.map((effect, index) => (
                                            <li key={index} className="text-sm text-text-secondary flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-arc-orange" />
                                                {typeof effect === 'string' ? effect : JSON.stringify(effect)}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Crafting Recipe */}
                            {item.craftingRecipe && (
                                <div className="mb-4">
                                    <h3 className="text-xs font-mono text-text-muted uppercase tracking-wider mb-2">
                                        Crafting Recipe
                                    </h3>
                                    <div className="bg-bg-tertiary rounded-lg p-3 text-sm text-text-secondary">
                                        {typeof item.craftingRecipe === 'string' 
                                            ? item.craftingRecipe 
                                            : JSON.stringify(item.craftingRecipe, null, 2)
                                        }
                                    </div>
                                </div>
                            )}

                            {/* Footer hint */}
                            <div className="pt-4 border-t border-border-primary">
                                <p className="text-xs text-text-muted text-center">
                                    Press <kbd className="px-1.5 py-0.5 bg-bg-tertiary border border-border-primary rounded text-[10px] font-mono">ESC</kbd> or click outside to close
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};












