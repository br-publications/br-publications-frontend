import { useEffect, type RefObject } from 'react';

type Handler = (event: MouseEvent | TouchEvent) => void;

/**
 * Hook that alerts clicks outside of the passed ref
 * @param ref - The ref element to detect clicks outside of
 * @param handler - The function to call when a click outside is detected
 * @param ignoreRef - Optional ref element to ignore clicks on (e.g. the toggle button)
 */
export const useClickOutside = <T extends HTMLElement = HTMLElement>(
    ref: RefObject<T | null>,
    handler: Handler,
    ignoreRef?: RefObject<HTMLElement | null>
): void => {
    useEffect(() => {
        const listener = (event: MouseEvent | TouchEvent) => {
            const el = ref.current;
            const ignoreEl = ignoreRef?.current;

            // Do nothing if clicking ref's element or descendent elements
            if (!el || el.contains(event.target as Node)) {
                return;
            }

            // Do nothing if clicking ignoreRef's element or descendent elements
            if (ignoreEl && ignoreEl.contains(event.target as Node)) {
                return;
            }

            handler(event);
        };

        document.addEventListener('mousedown', listener);
        document.addEventListener('touchstart', listener);

        return () => {
            document.removeEventListener('mousedown', listener);
            document.removeEventListener('touchstart', listener);
        };
    }, [ref, handler, ignoreRef]);
};
