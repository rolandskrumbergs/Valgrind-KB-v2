import { motion } from "framer-motion";

export const Greeting = () => {
	return (
		<div className="flex flex-col items-center justify-center h-full">
			<motion.div
				key="overview"
				className="max-w-md mx-auto md:mt-20 text-white flex h-fit flex-col leading-relaxed text-balance text-lg text-center"
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				exit={{ opacity: 0, y: 10 }}
				transition={{ delay: 0.3 }}
			>
				Hi there! 🌟 I am Lena, your trusted advisor in Swedish guardianship,
				legal matters, and financial administration.
			</motion.div>
			<motion.div
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				exit={{ opacity: 0, y: 10 }}
				transition={{ delay: 0.6 }}
				className="max-w-md mx-auto mt-6 text-white/50 flex h-fit flex-col leading-relaxed text-balance text-lg text-center"
			>
				With my deep knowledge of Swedish legislation and practical experience,
				I provide personalized guidance to help you navigate complex
				administrative tasks with confidence. How can I help you today?
			</motion.div>
		</div>
	);
};
