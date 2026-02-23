"use server";

import { Index } from "@upstash/vector";
import { UPSTASH_INDICES } from "@/constants/upstash-variables";
import { saveKnowledgeBaseInvocation } from "@/db/queries/chat-queries";
import type { KnowledgeBaseInvocation } from "@/db/schema";
import type { LenaProfile } from "@/db/queries/lena-queries";
import { tryCatch } from "@/lib/try-catch";

// const THRESHOLD_SCORE = 6;
// const HIGH_CONFIDENCE_SCORE = 8;
// const THRESHOLD_REQUIRED_CHUNKS = 3;
// const REQUIRED_HIGH_CONFIDENCE_CHUNKS = 1;
// const TOP_K = 4;

interface QualityAnalysis {
	shouldProceed: boolean;
	reason?: string;
	metrics: {
		aboveThreshold: number;
		highConfidence: number;
	};
}

interface VectorMetadata {
	document_id?: string;
	chunk_id?: string;
	knowledge_category?: string;
	text?: string;
}

interface QueryResult {
	metadata?: VectorMetadata;
}

interface ChunkMetadata {
	score: number;
	input_tokens: number;
	output_tokens: number;
	model_name: string;
	reasoning: string;
}

interface ScoreResult {
	text: string;
	score: number;
	metadata: {
		documentId: string;
		chunkId: string;
		knowledgeCategory: string;
		input_tokens: number;
		output_tokens: number;
		model_name: string;
		reasoning: string;
	};
}

const generateEmbedding = async (question: string) => {
	const embeddingApiUrl = process.env.EMBEDDING_API_URL as string;

	if (!embeddingApiUrl) {
		throw new Error("EMBEDDING_API_URL is not set");
	}

	const response = await fetch(embeddingApiUrl, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ text: question }),
	});

	if (!response.ok) {
		throw new Error(`Fetch error: ${response.statusText}`);
	}

	const data = await response.json();
	return data.embeddings;
};

const scoreChunk = async (
	text: string,
	question: string,
	short_summary: string,
): Promise<ChunkMetadata> => {
	try {
		const chunkResponse = await fetch(
			"https://kb.intressebevakaren.se/api/llm",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ text, question, short_summary }),
			},
		);

		if (!chunkResponse.ok) {
			throw new Error(`Failed to score chunk: ${chunkResponse.statusText}`);
		}

		const { object, usage, response } = await chunkResponse.json();

		return {
			score: object.score as number,
			reasoning: object.reasoning as string,
			input_tokens: usage.promptTokens as number,
			output_tokens: usage.completionTokens as number,
			model_name: response.modelId as string,
		} as ChunkMetadata;
	} catch (error) {
		console.error("Error scoring chunk:", error);
		return {
			score: 0,
			reasoning: "",
			input_tokens: 0,
			output_tokens: 0,
			model_name: "",
		};
	}
};

const analyzeChunkQuality = (
	scores: number[],
	lenaProfile: LenaProfile,
): QualityAnalysis => {
	const aboveThreshold = scores.filter(
		(score) => score >= lenaProfile.threshold,
	).length;
	const highConfidence = scores.filter(
		(score) => score >= lenaProfile.highConfidenceThreshold,
	).length;

	const metrics = {
		aboveThreshold,
		highConfidence,
	};

	console.log("\n=== Quality Analysis ===");
	console.log(
		`Chunks above threshold (≥${lenaProfile.threshold}): ${aboveThreshold}`,
	);
	console.log(
		`High confidence chunks (≥${lenaProfile.highConfidenceThreshold}): ${highConfidence}`,
	);

	if (aboveThreshold < lenaProfile.thresholdRequiredChunks) {
		return {
			shouldProceed: false,
			reason: `Insufficient relevant data. Needed ${lenaProfile.thresholdRequiredChunks} chunks above threshold score of ${lenaProfile.threshold} but onlyfound ${aboveThreshold} chunks.`,
			metrics,
		};
	}

	if (highConfidence < lenaProfile.requiredHighConfidenceChunks) {
		return {
			shouldProceed: false,
			reason: `Insufficient high-confidence data. Needed ${lenaProfile.requiredHighConfidenceChunks} chunks above high confidence threshold score of ${lenaProfile.highConfidenceThreshold} but only found ${highConfidence} chunks.`,
			metrics,
		};
	}

	return {
		shouldProceed: true,
		reason: `Sufficient high-quality data available. Found ${aboveThreshold} chunks above threshold score of ${lenaProfile.threshold} and ${highConfidence} chunks above high confidence threshold score of ${lenaProfile.highConfidenceThreshold}.`,
		metrics,
	};
};

// Helper function to collect all chunks with their scores and metadata
const collectChunksData = (organizedResults: Record<string, ScoreResult[]>) => {
	const fetchedChunks: Array<{
		text: string;
		score: number;
		reasoning: string;
		documentId: string;
		chunkId: string;
		knowledgeCategory: string;
	}> = [];

	let totalInputTokens = 0;
	let totalOutputTokens = 0;
	let modelName = "";

	for (const [category, results] of Object.entries(organizedResults)) {
		for (const result of results) {
			fetchedChunks.push({
				text: result.text,
				score: result.score,
				documentId: result.metadata.documentId,
				chunkId: result.metadata.chunkId,
				knowledgeCategory: result.metadata.knowledgeCategory,
				reasoning: result.metadata.reasoning,
			});

			// Add token counts
			totalInputTokens += result.metadata.input_tokens;
			totalOutputTokens += result.metadata.output_tokens;

			// Capture model name from any chunk that has it
			if (!modelName && result.metadata.model_name) {
				modelName = result.metadata.model_name;
			}
		}
	}

	return {
		fetchedChunks,
		totalInputTokens,
		totalOutputTokens,
		modelName,
	};
};

export const getKnowledgeBaseInfo = async (
	question: string,
	short_summary: string,
	messageId: string,
	lenaProfile: LenaProfile,
	chatId: string,
	userId: string,
	userName: string,
) => {
	console.log("\n=== Use Knowledge Base Function Started ===");
	console.log("\n== Question:", question);
	console.log("== Short summary:", short_summary);

	console.log("== User name:", userName);

	const embeddingsResult = await tryCatch(generateEmbedding(question));

	if (embeddingsResult.error) {
		console.error(
			`Failed to generate embeddings for question. Error: ${embeddingsResult.error}`,
		);
		return {
			status: "error",
			type: "system-error",
			message:
				"Informationen från kunskapsbasen kunde inte hämtas just nu. Nämn artigt att administratören har informerats och att användaren kan försöka igen senare.",
		};
	}

	const embeddings = embeddingsResult.data;

	console.log("\n=== Embeddings generated for question ===");

	// Query all indices simultaneously
	const queryPromises = Object.entries(UPSTASH_INDICES).map(
		async ([category, config]) => {
			const index = new Index({
				url: config.url,
				token: config.token,
			});

			try {
				const results = await index.query({
					vector: embeddings,
					topK: lenaProfile.topK,
					includeVectors: false,
					includeMetadata: true,
				});

				console.log(`Found ${results.length} chunks from [${category}] index`);
				if (results.length > 0) {
					console.log(
						`Top result score from [${category}] index:`,
						results[0].score,
					);
				}

				return { category, results };
			} catch (error) {
				console.error(`Error querying [${category}] index:`, error);
				return { category, results: [] };
			}
		},
	);

	const allResults = await Promise.all(queryPromises);

	// Organize results by knowledge category and score chunks in parallel
	const organizedResults: Record<string, ScoreResult[]> = {};

	// Collect all scores for quality analysis
	const allScores: number[] = [];
	for (const { category, results } of allResults) {
		if (!results.length) continue;

		console.log(`\n=== Scoring chunks for category: ${category} ===`);
		// Score all chunks in parallel for this category
		const scoredResults = await Promise.all(
			results.map(async (result: QueryResult) => {
				const text = result.metadata?.text || "";
				const scoreResult = await scoreChunk(text, question, short_summary);
				allScores.push(scoreResult.score);

				return {
					text,
					score: scoreResult.score,
					metadata: {
						documentId: result.metadata?.document_id || "",
						chunkId: result.metadata?.chunk_id || "",
						knowledgeCategory: result.metadata?.knowledge_category || "",
						input_tokens: scoreResult.input_tokens,
						output_tokens: scoreResult.output_tokens,
						model_name: scoreResult.model_name,
						reasoning: scoreResult.reasoning,
					},
				};
			}),
		);

		// Sort results by score in descending order
		organizedResults[category] = scoredResults.sort(
			(a, b) => (b.score || 0) - (a.score || 0),
		);

		// Log scores for this category
		organizedResults[category].forEach((result, index) => {
			console.log(`Chunk ${index + 1}: Score ${result.score}`);
		});
		console.log("========================\n");
	}

	// Perform quality analysis
	const qualityAnalysis = analyzeChunkQuality(allScores, lenaProfile);

	console.log("\n=== Decision ===");
	console.log(`Should proceed: ${qualityAnalysis.shouldProceed}`);
	console.log(`Reason: ${qualityAnalysis.reason}`);
	console.log("========================\n");

	// Collect all chunk data regardless of whether we proceed or not
	const { fetchedChunks, totalInputTokens, totalOutputTokens, modelName } =
		collectChunksData(organizedResults);

	// Save the knowledge base invocation to the database
	await saveKnowledgeBaseInvocation({
		invocation: {
			messageId,
			chatId,
			userId,
			userName,
			createdAt: new Date(),
			searchQuery: question,
			conversationSummary: short_summary,
			result: qualityAnalysis.reason || "No reason provided",
			status: qualityAnalysis.shouldProceed ? "success" : "error",
			type: qualityAnalysis.shouldProceed ? undefined : "insufficient-data",
			fetchedChunks: fetchedChunks.length > 0 ? fetchedChunks : [],
			metrics: qualityAnalysis.metrics,
			inputTokens: totalInputTokens,
			outputTokens: totalOutputTokens,
			model: modelName || "unknown",
			lenaProfile: lenaProfile,
		} as KnowledgeBaseInvocation,
	});

	if (!qualityAnalysis.shouldProceed) {
		return {
			status: "error",
			type: "insufficient-data",
			message:
				"Otillräcklig korrekt data hittades från kunskapsbasen. Informera artigt användaren att du inte vet det korrekta svaret och att du har meddelat administratörerna om bristen på data i din kunskapsbas. Föreslå att de kan försöka igen senare.",
		};
	}

	// Format the results with Swedish headers and structured content
	let formattedResults = "";
	let chunkCounter = 1; // Track chunks across all categories

	if (organizedResults.books?.length > 0) {
		const relevantBooks = organizedResults.books.filter(
			(result) => (result.score || 0) >= lenaProfile.threshold,
		);
		if (relevantBooks.length > 0) {
			formattedResults +=
				"\nHär är de hämtade data bitarna från bok indexet, som är relevanta för användarens fråga:\n";
			for (const result of relevantBooks) {
				formattedResults += `\n<chunk-${chunkCounter}>\n${result.text}\n</chunk-${chunkCounter}>\n`;
				chunkCounter++;
			}
		}
	}

	if (organizedResults.laws?.length > 0) {
		const relevantLaws = organizedResults.laws.filter(
			(result) => (result.score || 0) >= lenaProfile.threshold,
		);
		if (relevantLaws.length > 0) {
			formattedResults +=
				"\nHär är de hämtade databitarna från lagindexet, som är relevanta för användarens fråga:\n";
			for (const result of relevantLaws) {
				formattedResults += `\n<chunk-${chunkCounter}>\n${result.text}\n</chunk-${chunkCounter}>\n`;
				chunkCounter++;
			}
		}
	}

	if (organizedResults.legalcases?.length > 0) {
		const relevantCases = organizedResults.legalcases.filter(
			(result) => (result.score || 0) >= lenaProfile.threshold,
		);
		if (relevantCases.length > 0) {
			formattedResults +=
				"\nHär är de hämtade databitarna från legalcases-indexet, som är relevanta för användarens fråga:\n";
			for (const result of relevantCases) {
				formattedResults += `\n<chunk-${chunkCounter}>\n${result.text}\n</chunk-${chunkCounter}>\n`;
				chunkCounter++;
			}
		}
	}

	if (organizedResults.other?.length > 0) {
		const relevantOther = organizedResults.other.filter(
			(result) => (result.score || 0) >= lenaProfile.threshold,
		);
		if (relevantOther.length > 0) {
			formattedResults +=
				"\nHär är de hämtade databitarna från det andra indexet, som är relevanta för användarens fråga:\n";
			for (const result of relevantOther) {
				formattedResults += `\n<chunk-${chunkCounter}>\n${result.text}\n</chunk-${chunkCounter}>\n`;
				chunkCounter++;
			}
		}
	}

	// Only return formatted content if quality analysis allows
	if (qualityAnalysis.shouldProceed) {
		return {
			status: "success",
			type: undefined,
			formattedContent: formattedResults.trim(),
		};
	}

	// This should never be reached due to the early return above, but TypeScript needs it
	return {
		status: "error",
		type: "insufficient-data",
		message:
			"Otillräcklig korrekt data hittades från kunskapsbasen. Informera artigt användaren att du inte vet det korrekta svaret och att du har meddelat administratörerna om bristen på data i din kunskapsbas. Föreslå att de kan försöka igen senare.",
	};
};
