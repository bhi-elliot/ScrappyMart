import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, 
    ChevronRight, 
    ChevronLeft,
    Sparkles
} from 'lucide-react';
import clsx from 'clsx';

const TUTORIAL_STORAGE_KEY = 'scrappy_mart_tutorial_completed';

interface TutorialStep {
    id: string;
    title: string;
    message: string;
    scrappyMood: 'excited' | 'helpful' | 'proud' | 'waving';
    selector?: string; // CSS selector for element to highlight
    position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
    action?: string; // Optional action hint
}

const tutorialSteps: TutorialStep[] = [
    {
        id: 'welcome',
        title: "Hey there, Raider!",
        message: "I'm Scrappy! 🐔 Welcome to my shop - the easiest way to plan and share raid loadouts with your squad!",
        scrappyMood: 'excited',
        position: 'center',
    },
    {
        id: 'purpose',
        title: "What's This All About?",
        message: "Build shopping lists for your raids, then share 'em with one click! Your friends get the same list instantly. No more typing out what you need in Discord! 📋",
        scrappyMood: 'helpful',
        position: 'center',
    },
    {
        id: 'open-source',
        title: "Open Source & Private",
        message: "This site is 100% open source, has NO ads, NO tracking, and NO accounts needed. Your lists stay in YOUR browser. I respect your privacy, Raider! 🔒",
        scrappyMood: 'proud',
        position: 'center',
    },
    {
        id: 'demo-list',
        title: "Let Me Show You!",
        message: "Here, I made you a little starter list called \"Scrappy's Treats\" with some of my favorite snacks! 🍋🍄 Check it out in your lists!",
        scrappyMood: 'excited',
        position: 'center',
        action: 'create-demo-list',
    },
    {
        id: 'sidebar',
        title: "Your Shopping Lists",
        message: "Here's where all your lists live! I just added \"Scrappy's Treats\" for you. Create multiple lists for different raids, builds, or squad members!",
        scrappyMood: 'helpful',
        selector: '[data-tutorial="sidebar"]',
        position: 'right',
    },
    {
        id: 'list-actions',
        title: "List Actions",
        message: "Click the ⋮ menu next to any list to rename, share, or delete it. Pretty handy when you've got lots of lists!",
        scrappyMood: 'helpful',
        selector: '[data-tutorial="list-item"]',
        position: 'right',
    },
    {
        id: 'add-items',
        title: "Adding Items",
        message: "This button opens my inventory! Search for anything - weapons, meds, materials. I've got it all catalogued!",
        scrappyMood: 'excited',
        selector: '[data-tutorial="add-items"]',
        position: 'bottom',
    },
    {
        id: 'presets',
        title: "Quick Presets",
        message: "Don't wanna build from scratch? Grab a preset! I've got ready-made lists for workbenches, projects, and more!",
        scrappyMood: 'excited',
        selector: '[data-tutorial="presets"]',
        position: 'bottom',
    },
    {
        id: 'share',
        title: "Share With Your Squad!",
        message: "THIS is the magic! 🎯 Hit Share to copy a link - send it to your squad and they instantly get your whole list. Raiding together made easy!",
        scrappyMood: 'excited',
        selector: '[data-tutorial="share"]',
        position: 'bottom',
    },
    {
        id: 'export-import',
        title: "Export & Import",
        message: "Export downloads your list as a file. Import lets you drag & drop files right onto the page! Great for backing up your lists!",
        scrappyMood: 'helpful',
        selector: '[data-tutorial="export"]',
        position: 'bottom',
    },
    {
        id: 'items',
        title: "Your Items",
        message: "Here's your shopping list! Use +/- to adjust quantities, click the number to type it, and check items off as you collect 'em!",
        scrappyMood: 'helpful',
        selector: '[data-tutorial="items-area"]',
        position: 'top',
    },
    {
        id: 'help',
        title: "That's It, Raider!",
        message: "Replay this tour anytime with the ? button, or click About to learn more. Now get out there and scavenge with your squad! 🎉",
        scrappyMood: 'proud',
        selector: '[data-tutorial="help"]',
        position: 'bottom',
    },
];

const scrappyExpressions: Record<string, string> = {
    excited: '✨',
    helpful: '💡',
    proud: '🌟',
    waving: '👋',
};

interface SpotlightRect {
    top: number;
    left: number;
    width: number;
    height: number;
}

interface TutorialProps {
    onComplete: () => void;
    onOpenMobileSidebar?: () => void;
    onCloseMobileSidebar?: () => void;
    onCreateDemoList?: () => void;
}

// Steps that require the mobile sidebar to be open
const SIDEBAR_STEPS = ['sidebar', 'list-actions'];

export function Tutorial({ onComplete, onOpenMobileSidebar, onCloseMobileSidebar, onCreateDemoList }: TutorialProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(true);
    const [spotlightRect, setSpotlightRect] = useState<SpotlightRect | null>(null);
    const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
    const tooltipRef = useRef<HTMLDivElement>(null);

    const step = tutorialSteps[currentStep];
    const isFirstStep = currentStep === 0;
    const isLastStep = currentStep === tutorialSteps.length - 1;

    // Find and highlight the target element
    const updateSpotlight = useCallback(() => {
        const isMobile = window.innerWidth < 1024;
        const isSidebarStep = SIDEBAR_STEPS.includes(step.id);
        
        // On mobile for sidebar steps, skip spotlight and just position tooltip
        // The sidebar drawer is already visually prominent
        if (isMobile && isSidebarStep) {
            setSpotlightRect(null);
            // Position tooltip in the center-right area, next to the sidebar
            setTooltipPosition({
                top: window.innerHeight * 0.35,
                left: Math.min(window.innerWidth * 0.6, window.innerWidth - 340),
            });
            return;
        }
        
        if (!step.selector) {
            setSpotlightRect(null);
            // Center position for welcome screen
            setTooltipPosition({
                top: window.innerHeight / 2,
                left: window.innerWidth / 2,
            });
            return;
        }

        // Find all matching elements and get the first visible one
        const elements = document.querySelectorAll(step.selector);
        let element: Element | null = null;
        let foundRect: DOMRect | null = null;
        
        for (const el of elements) {
            const rect = el.getBoundingClientRect();
            // Check if element is visible (has dimensions and is in viewport)
            if (rect.width > 0 && rect.height > 0) {
                element = el;
                foundRect = rect;
                break;
            }
        }
        
        if (!element || !foundRect) {
            setSpotlightRect(null);
            setTooltipPosition({
                top: window.innerHeight / 2,
                left: window.innerWidth / 2,
            });
            return;
        }

        const rect = foundRect;
        const padding = 12;

        // Scroll element into view if needed
        if (rect.top < 0 || rect.bottom > window.innerHeight) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        setSpotlightRect({
            top: Math.max(0, rect.top - padding),
            left: Math.max(0, rect.left - padding),
            width: rect.width + padding * 2,
            height: rect.height + padding * 2,
        });

        // Calculate tooltip position based on step.position
        const tooltipWidth = 320;
        const tooltipHeight = 200;
        const gap = 16;

        let top = 0;
        let left = 0;

        switch (step.position) {
            case 'top':
                top = rect.top - tooltipHeight - gap;
                left = rect.left + rect.width / 2;
                break;
            case 'bottom':
                top = rect.bottom + gap;
                left = rect.left + rect.width / 2;
                break;
            case 'left':
                top = rect.top + rect.height / 2;
                left = rect.left - tooltipWidth - gap;
                break;
            case 'right':
                top = rect.top + rect.height / 2;
                left = rect.right + gap;
                break;
            default:
                top = window.innerHeight / 2;
                left = window.innerWidth / 2;
        }

        // Clamp to viewport
        top = Math.max(20, Math.min(top, window.innerHeight - tooltipHeight - 20));
        left = Math.max(20, Math.min(left, window.innerWidth - tooltipWidth - 20));

        setTooltipPosition({ top, left });
    }, [step]);

    // Handle mobile sidebar for sidebar-related steps
    useEffect(() => {
        const isMobile = window.innerWidth < 1024; // lg breakpoint
        const isSidebarStep = SIDEBAR_STEPS.includes(step.id);
        
        if (isMobile && isSidebarStep && onOpenMobileSidebar) {
            // Open mobile sidebar for these steps
            onOpenMobileSidebar();
        } else if (isMobile && !isSidebarStep && onCloseMobileSidebar) {
            // Close it when leaving sidebar steps (but not on first step)
            if (currentStep > 0) {
                onCloseMobileSidebar();
            }
        }
    }, [step.id, currentStep, onOpenMobileSidebar, onCloseMobileSidebar]);

    useEffect(() => {
        // Longer delay to let mobile sidebar fully animate open before measuring
        const isMobile = window.innerWidth < 1024;
        const isSidebarStep = SIDEBAR_STEPS.includes(step.id);
        const delay = isMobile && isSidebarStep ? 400 : 0;
        
        const timer = setTimeout(() => {
            updateSpotlight();
        }, delay);
        
        // Also update again after a longer delay for mobile animations
        let timer2: ReturnType<typeof setTimeout>;
        if (isMobile && isSidebarStep) {
            timer2 = setTimeout(() => {
                updateSpotlight();
            }, 600);
        }
        
        // Update on scroll/resize
        window.addEventListener('scroll', updateSpotlight, true);
        window.addEventListener('resize', updateSpotlight);
        
        return () => {
            clearTimeout(timer);
            if (timer2) clearTimeout(timer2);
            window.removeEventListener('scroll', updateSpotlight, true);
            window.removeEventListener('resize', updateSpotlight);
        };
    }, [updateSpotlight, step.id]);

    const handleNext = () => {
        if (isLastStep) {
            handleComplete();
        } else {
            const nextStep = tutorialSteps[currentStep + 1];
            // Create demo list when reaching that step
            if (nextStep?.action === 'create-demo-list' && onCreateDemoList) {
                onCreateDemoList();
            }
            setCurrentStep(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (!isFirstStep) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleComplete = () => {
        setIsVisible(false);
        localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
        setTimeout(() => onComplete(), 300);
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' || e.key === 'Enter') {
                handleNext();
            } else if (e.key === 'ArrowLeft') {
                handlePrev();
            } else if (e.key === 'Escape') {
                handleComplete();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentStep]);

    const isCenter = step.position === 'center' || !step.selector;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] pointer-events-none"
                >
                    {/* Dark overlay with spotlight cutout */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-auto">
                        <defs>
                            <mask id="spotlight-mask">
                                <rect x="0" y="0" width="100%" height="100%" fill="white" />
                                {spotlightRect && spotlightRect.width > 0 && spotlightRect.height > 0 && (
                                    <motion.rect
                                        initial={{ opacity: 0, x: spotlightRect.left, y: spotlightRect.top }}
                                        animate={{ 
                                            x: spotlightRect.left,
                                            y: spotlightRect.top,
                                            width: spotlightRect.width,
                                            height: spotlightRect.height,
                                            opacity: 1,
                                        }}
                                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                        rx="12"
                                        fill="black"
                                    />
                                )}
                            </mask>
                        </defs>
                        <rect 
                            x="0" 
                            y="0" 
                            width="100%" 
                            height="100%" 
                            fill="rgba(0, 0, 0, 0.85)" 
                            mask="url(#spotlight-mask)"
                            onClick={handleNext}
                            style={{ cursor: 'pointer' }}
                        />
                    </svg>

                    {/* Spotlight border glow */}
                    {spotlightRect && spotlightRect.width > 0 && spotlightRect.height > 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ 
                                opacity: 1,
                                top: spotlightRect.top,
                                left: spotlightRect.left,
                                width: spotlightRect.width,
                                height: spotlightRect.height,
                            }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="absolute rounded-xl border-2 border-arc-orange shadow-[0_0_30px_rgba(249,76,16,0.5)] pointer-events-none"
                        />
                    )}

                    {/* Tooltip with Scrappy */}
                    <motion.div
                        ref={tooltipRef}
                        key={step.id}
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ 
                            opacity: 1, 
                            scale: 1, 
                            y: 0,
                            top: tooltipPosition.top,
                            left: tooltipPosition.left,
                        }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className={clsx(
                            "absolute pointer-events-auto",
                            isCenter ? "-translate-x-1/2 -translate-y-1/2" : ""
                        )}
                        style={{
                            width: isCenter ? 380 : 320,
                            transform: isCenter 
                                ? 'translate(-50%, -50%)' 
                                : step.position === 'right' || step.position === 'bottom'
                                    ? 'none'
                                    : step.position === 'left'
                                        ? 'translateY(-50%)'
                                        : 'translateX(-50%)',
                        }}
                    >
                        <div className="relative">
                            {/* Skip button */}
                            <button
                                onClick={handleComplete}
                                className="absolute -top-10 right-0 flex items-center gap-1 text-xs text-white/60 hover:text-white transition-colors z-10"
                            >
                                Skip tour <X size={14} />
                            </button>

                            {/* Card - Always use dark styling since it's on dark overlay */}
                            <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0d1117] border-2 border-arc-orange/60 rounded-2xl shadow-2xl overflow-hidden">
                                {/* Top bar */}
                                <div className="h-1 bg-gradient-to-r from-arc-orange via-arc-green to-arc-blue" />
                                
                                <div className="p-5">
                                    {/* Scrappy + Title row */}
                                    <div className="flex items-start gap-4 mb-3">
                                        {/* Scrappy Avatar */}
                                        <motion.div
                                            animate={{ 
                                                y: [0, -4, 0],
                                                rotate: step.scrappyMood === 'excited' ? [0, -3, 3, 0] : 0
                                            }}
                                            transition={{ 
                                                y: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
                                                rotate: { duration: 0.4, repeat: step.scrappyMood === 'excited' ? Infinity : 0, repeatDelay: 2 }
                                            }}
                                            className="relative shrink-0"
                                        >
                                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-arc-orange/30 to-arc-green/20 border-2 border-arc-orange/50 flex items-center justify-center overflow-hidden">
                                                <img 
                                                    src="/logo.webp" 
                                                    alt="Scrappy" 
                                                    className="w-12 h-12 object-contain"
                                                />
                                            </div>
                                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#1a1f2e] border-2 border-arc-orange/50 rounded-full flex items-center justify-center text-sm">
                                                {scrappyExpressions[step.scrappyMood]}
                                            </div>
                                        </motion.div>

                                        {/* Title */}
                                        <div className="flex-1 min-w-0 pt-1">
                                            <h3 className="text-lg font-display font-bold text-white uppercase tracking-wide leading-tight">
                                                {step.title}
                                            </h3>
                                        </div>
                                    </div>

                                    {/* Message */}
                                    <p className="text-gray-300 text-sm leading-relaxed mb-4 pl-[72px]">
                                        {step.message}
                                    </p>

                                    {/* Progress + Navigation */}
                                    <div className="flex items-center justify-between">
                                        {/* Progress dots */}
                                        <div className="flex gap-1.5">
                                            {tutorialSteps.map((_, index) => (
                                                <div
                                                    key={index}
                                                    className={clsx(
                                                        "h-1.5 rounded-full transition-all duration-300",
                                                        index === currentStep 
                                                            ? "w-4 bg-arc-orange" 
                                                            : index < currentStep 
                                                                ? "w-1.5 bg-arc-green" 
                                                                : "w-1.5 bg-gray-600"
                                                    )}
                                                />
                                            ))}
                                        </div>

                                        {/* Navigation buttons */}
                                        <div className="flex items-center gap-2">
                                            {!isFirstStep && (
                                                <button
                                                    onClick={handlePrev}
                                                    className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                                                >
                                                    <ChevronLeft size={18} />
                                                </button>
                                            )}
                                            
                                            <button
                                                onClick={handleNext}
                                                className={clsx(
                                                    "flex items-center gap-1.5 px-4 py-2 rounded-lg font-semibold text-sm transition-all",
                                                    isLastStep
                                                        ? "bg-arc-green text-white hover:bg-arc-green/90"
                                                        : "bg-arc-orange text-white hover:bg-arc-orange/90"
                                                )}
                                            >
                                                {isLastStep ? (
                                                    <>
                                                        Done! <Sparkles size={16} />
                                                    </>
                                                ) : (
                                                    <>
                                                        Next <ChevronRight size={16} />
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Click hint */}
                            <p className="text-center text-xs text-white/40 mt-2">
                                Click anywhere or press → to continue
                            </p>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// Hook to check if tutorial should be shown
export function useTutorial() {
    // Check synchronously on initial render (before useEffect) to avoid race condition
    // with URL hash being cleared by the import logic
    const [showTutorial, setShowTutorial] = useState(() => {
        // Only run on client side
        if (typeof window === 'undefined') return false;
        
        const hasCompleted = localStorage.getItem(TUTORIAL_STORAGE_KEY);
        const isSharedLink = window.location.hash.startsWith('#d=');
        
        // Don't show tutorial if:
        // 1. Already completed, OR
        // 2. Visiting a shared link (has #d= in URL)
        return !hasCompleted && !isSharedLink;
    });
    const [isLoading, setIsLoading] = useState(false); // No longer loading since we check synchronously

    // Keep this for any edge cases
    useEffect(() => {
        const hasCompleted = localStorage.getItem(TUTORIAL_STORAGE_KEY);
        const isSharedLink = window.location.hash.startsWith('#d=');
        
        if (hasCompleted || isSharedLink) {
            setShowTutorial(false);
        }
    }, []);

    const resetTutorial = () => {
        localStorage.removeItem(TUTORIAL_STORAGE_KEY);
        setShowTutorial(true);
    };

    const completeTutorial = () => {
        setShowTutorial(false);
    };

    return { showTutorial, isLoading, resetTutorial, completeTutorial };
}
