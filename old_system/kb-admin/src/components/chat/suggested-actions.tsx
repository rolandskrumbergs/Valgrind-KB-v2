"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { ChatRequestOptions, CreateMessage, Message } from "ai";
import { memo } from "react";
import { ArrowRight } from "lucide-react";

interface SuggestedActionsProps {
	chatId: string;
	append: (
		message: Message | CreateMessage,
		chatRequestOptions?: ChatRequestOptions,
	) => Promise<string | null | undefined>;
}

// Animation variants for consistent animation
const fadeInUp = {
	hidden: { opacity: 0, y: 20 },
	visible: (custom: number) => ({
		opacity: 1,
		y: 0,
		transition: {
			delay: custom * 0.1,
			duration: 0.5,
			ease: "easeOut",
		},
	}),
};

function PureSuggestedActions({ chatId, append }: SuggestedActionsProps) {
	const suggestedActions = [
		"Jag är ny som god man. Vad gör jag nu?",
		"Finns det någon metod för en god man?",
		"Vilka är gode mannens gränser?",
		"Jag ska sälja min huvudmans bostad. Hur gör jag?",
		"Varför ska jag ansöka om merkostnadsersättning för min huvudman?",
	];

	return (
		<AnimatePresence>
			<motion.div
				data-testid="suggested-actions"
				className="flex flex-col w-full max-w-lg mx-auto flex-1 h-full py-6 px-4 space-y-8"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				transition={{ duration: 0.3 }}
			>
				<div className="space-y-6">
					<motion.div
						className="max-w-md mx-auto text-white font-medium leading-relaxed text-balance text-xl text-center"
						variants={fadeInUp}
						initial="hidden"
						animate="visible"
						custom={1}
					>
						Hi there! 👋🏼
					</motion.div>

					<motion.div
						className="max-w-md mx-auto text-white leading-relaxed text-balance text-lg text-center"
						variants={fadeInUp}
						initial="hidden"
						animate="visible"
						custom={2}
					>
						I am Lena, your trusted advisor in Swedish guardianship, legal
						matters, and financial administration.
					</motion.div>

					<motion.div
						variants={fadeInUp}
						initial="hidden"
						animate="visible"
						custom={3}
						className="max-w-md mx-auto text-white/60 leading-relaxed text-balance text-lg text-center"
					>
						With my deep knowledge of Swedish legislation and practical
						experience, I provide personalized guidance to help you navigate
						complex administrative tasks with confidence. How can I help you
						today?
					</motion.div>
				</div>

				<div className="space-y-3 mt-4">
					{suggestedActions.map((suggestedAction, index) => (
						<motion.div
							variants={fadeInUp}
							initial="hidden"
							animate="visible"
							custom={index + 4}
							key={`suggested-action-${suggestedAction}`}
							className={index > 1 ? "hidden sm:block" : "block"}
						>
							<button
								type="button"
								onClick={async () => {
									window.history.replaceState({}, "", `/chat/${chatId}`);

									await append({
										role: "user",
										content: suggestedAction,
									});
								}}
								className="w-full  border border-white/10 rounded-xl p-4 h-full relative cursor-pointer transition-all duration-300 group hover:shadow-md hover:border-white/20"
							>
								<p className="h-full w-full text-left text-md text-white/80 group-hover:text-white transition-colors duration-200 pr-6">
									{suggestedAction}
								</p>
								<div className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 group-hover:bg-white/20 group-hover:translate-x-1">
									<ArrowRight className="w-4 h-4 text-white" />
								</div>
							</button>
						</motion.div>
					))}
				</div>
			</motion.div>
		</AnimatePresence>
	);
}

export const SuggestedActions = memo(PureSuggestedActions, () => true);
