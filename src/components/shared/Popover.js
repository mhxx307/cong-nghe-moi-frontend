import { useState, useRef, useId } from 'react';
import {
    useFloating,
    FloatingPortal,
    arrow,
    shift,
    offset,
} from '@floating-ui/react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Popover({
    children,
    className,
    renderPopover,
    as: Element = 'div',
    initialOpen,
    placement = 'bottom-end',
    hideDelay = 200, // Change the value as needed
}) {
    const [open, setOpen] = useState(initialOpen || false);
    const arrowRef = useRef(null);
    const hideTimeoutRef = useRef(null); // Ref for timeout
    const { x, y, reference, floating, strategy, middlewareData } = useFloating(
        {
            middleware: [offset(6), shift(), arrow({ element: arrowRef })],
            placement: placement,
        },
    );
    const id = useId();
    const showPopover = () => {
        clearTimeout(hideTimeoutRef.current); // Clear timeout when mouse enters
        setOpen(true);
    };
    const hidePopover = () => {
        hideTimeoutRef.current = setTimeout(() => {
            setOpen(false);
        }, hideDelay); // Set timeout to hide popover after a delay
    };

    return (
        <Element
            className={className}
            ref={reference}
            onMouseEnter={showPopover}
            onMouseLeave={hidePopover}
        >
            {children}
            <FloatingPortal id={id}>
                <AnimatePresence>
                    {open && (
                        <motion.div
                            ref={floating}
                            style={{
                                position: strategy,
                                top: y ?? 0,
                                left: x ?? 0,
                                width: 'max-content',
                                transformOrigin: `${middlewareData.arrow?.x}px top`,
                            }}
                            initial={{ opacity: 0, transform: 'scale(0)' }}
                            animate={{ opacity: 1, transform: 'scale(1)' }}
                            exit={{ opacity: 0, transform: 'scale(0)' }}
                            transition={{ duration: 0.2 }}
                        >
                            {renderPopover}
                        </motion.div>
                    )}
                </AnimatePresence>
            </FloatingPortal>
        </Element>
    );
}
