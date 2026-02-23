import { useEffect, useRef, type RefObject } from "react";

export function useScrollToBottom<T extends HTMLElement>(): [
	RefObject<T>,
	RefObject<T>,
] {
	const containerRef = useRef<T>(null);
	const endRef = useRef<T>(null);
	const lastMessageCountRef = useRef<number>(0);

	useEffect(() => {
		const container = containerRef.current;
		const end = endRef.current;

		if (container && end) {
			const observer = new MutationObserver(() => {
				// Only scroll if the number of messages has increased
				const currentMessageCount = container.querySelectorAll(
					'[data-testid^="message-"]',
				).length;
				if (currentMessageCount > lastMessageCountRef.current) {
					end.scrollIntoView({ behavior: "instant", block: "end" });
					lastMessageCountRef.current = currentMessageCount;
				}
			});

			observer.observe(container, {
				childList: true,
				subtree: true,
				attributes: true,
				characterData: true,
			});

			return () => observer.disconnect();
		}
	}, []);

	return [containerRef as RefObject<T>, endRef as RefObject<T>];
}
