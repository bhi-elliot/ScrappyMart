import React, { type ReactNode } from 'react';
import { useTheme } from '../hooks/useTheme';
import { Sun, Moon, Menu, HelpCircle, Info } from 'lucide-react';
import { clsx } from 'clsx';

interface LayoutProps {
    children: ReactNode;
    onMenuClick?: () => void;
    showMenuButton?: boolean;
    onHelpClick?: () => void;
    onAboutClick?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, onMenuClick, showMenuButton = false, onHelpClick, onAboutClick }) => {
    const { theme, toggleTheme } = useTheme();

    return (
        <div className="min-h-screen bg-bg-primary text-text-primary font-body overflow-x-hidden relative">
            {/* Animated background gradient */}
            <div 
                className="fixed inset-0 pointer-events-none opacity-50"
                style={{
                    background: theme === 'dark' 
                        ? 'radial-gradient(ellipse at 50% 0%, rgba(249, 76, 16, 0.08) 0%, transparent 50%)'
                        : 'radial-gradient(ellipse at 50% 0%, rgba(249, 76, 16, 0.05) 0%, transparent 50%)'
                }}
            />
            
            {/* Grid pattern overlay */}
            <div 
                className="fixed inset-0 pointer-events-none opacity-[0.03]"
                style={{
                    backgroundImage: `linear-gradient(var(--border-primary) 1px, transparent 1px), linear-gradient(90deg, var(--border-primary) 1px, transparent 1px)`,
                    backgroundSize: '60px 60px'
                }}
            />

            {/* Header */}
            <header className="sticky top-0 z-40 bg-bg-secondary/80 backdrop-blur-xl border-b border-border-primary">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    {/* Left side - Menu button + Logo */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* Mobile Menu Button */}
                        {showMenuButton && (
                            <button
                                onClick={onMenuClick}
                                className={clsx(
                                    "lg:hidden p-2 -ml-2 rounded-lg",
                                    "text-text-secondary hover:text-text-primary",
                                    "hover:bg-bg-card transition-colors"
                                )}
                                aria-label="Open menu"
                            >
                                <Menu size={22} />
                            </button>
                        )}
                        
                        {/* Logo */}
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="relative">
                                <img 
                                    src="/logo.webp" 
                                    alt="Scrappy" 
                                    className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
                                />
                                {/* Glow effect */}
                                <div className="absolute inset-0 bg-arc-orange blur-xl opacity-20 -z-10" />
                            </div>
                            <div className="flex flex-col">
                                <h1 className="text-lg sm:text-xl font-display font-bold tracking-wider uppercase text-text-primary leading-none">
                                    Scrappy Mart
                                </h1>
                                <span className="text-[9px] sm:text-[10px] font-mono text-text-muted tracking-widest uppercase hidden sm:block">
                                    Raider Supply List
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right side buttons */}
                    <div className="flex items-center gap-2">
                        {/* About Button */}
                        {onAboutClick && (
                            <button
                                onClick={onAboutClick}
                                className={clsx(
                                    "relative w-10 h-10 rounded-lg flex items-center justify-center",
                                    "border border-border-primary hover:border-arc-green",
                                    "bg-bg-card hover:bg-bg-card-hover",
                                    "transition-all duration-200",
                                    "group"
                                )}
                                aria-label="About this site"
                                title="About Scrappy Mart"
                            >
                                <Info 
                                    size={18} 
                                    className="text-text-secondary group-hover:text-arc-green transition-colors" 
                                />
                            </button>
                        )}

                        {/* Help/Tutorial Button */}
                        {onHelpClick && (
                            <button
                                onClick={onHelpClick}
                                data-tutorial="help"
                                className={clsx(
                                    "relative w-10 h-10 rounded-lg flex items-center justify-center",
                                    "border border-border-primary hover:border-arc-green",
                                    "bg-bg-card hover:bg-bg-card-hover",
                                    "transition-all duration-200",
                                    "group"
                                )}
                                aria-label="Show tutorial"
                                title="Replay tutorial"
                            >
                                <HelpCircle 
                                    size={18} 
                                    className="text-text-secondary group-hover:text-arc-green transition-colors" 
                                />
                            </button>
                        )}

                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className={clsx(
                                "relative w-10 h-10 rounded-lg flex items-center justify-center",
                                "border border-border-primary hover:border-arc-orange",
                                "bg-bg-card hover:bg-bg-card-hover",
                                "transition-all duration-200",
                                "group"
                            )}
                            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                        >
                            {theme === 'dark' ? (
                                <Sun 
                                    size={18} 
                                    className="text-text-secondary group-hover:text-arc-orange transition-colors" 
                                />
                            ) : (
                                <Moon 
                                    size={18} 
                                    className="text-text-secondary group-hover:text-arc-orange transition-colors" 
                                />
                            )}
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 relative">
                {children}
            </main>

            {/* Footer */}
            <footer className="border-t border-border-primary mt-auto">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
                    <div className="flex flex-col items-center gap-3 text-sm text-text-muted">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-xs">v1.0.0</span>
                                <span className="hidden sm:inline">•</span>
                                <span className="hidden sm:inline">Scrappy's got the goods</span>
                            </div>
                        <div className="flex items-center gap-4">
                            <a 
                                href="https://github.com/theyetty/scrappymart" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="hover:text-text-primary transition-colors"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                                </svg>
                            </a>
                            <a 
                                href="https://buymeacoffee.com/yetty" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs hover:text-arc-orange transition-colors flex items-center gap-1"
                            >
                                <span>☕</span>
                                <span className="hidden sm:inline">Buy me a coffee</span>
                            </a>
                            <div className="font-mono text-xs flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-arc-green animate-pulse" />
                                SHOP OPEN
                            </div>
                        </div>
                        </div>
                        {/* Disclaimer */}
                        <p className="text-[10px] text-text-muted/70 text-center max-w-2xl">
                            Unofficial fan project. Not affiliated with Embark Studios or ARC Raiders. 
                            All game content belongs to their respective owners.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};
