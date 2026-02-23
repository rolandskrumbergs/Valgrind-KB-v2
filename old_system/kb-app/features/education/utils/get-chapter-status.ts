import { Chapter } from '../types';

/**
 * Determines the status of a course chapter based on user answers to its questions.
 *
 * @param chapter - The chapter object containing its questions and their user answers.
 * @returns 'not_started', 'in_progress', or 'completed'.
 */
export function getChapterStatus(chapter: Chapter): 'not_started' | 'in_progress' | 'completed' {
    const totalQuestions = chapter.questions.length;
    let answeredQuestions = 0;

    if (totalQuestions === 0) {
        // If there are no questions, the chapter can be considered not started or completed depending on context.
        // For simplicity, let's say 'not_started' if no content to complete.
        return 'not_started';
    }

    for (const question of chapter.questions) {
        // Check if the userAnswerOptionIds array exists and has at least one answer
        if (question.userAnswerOptionIds && question.userAnswerOptionIds.length > 0) {
            answeredQuestions++;
        }
    }

    if (answeredQuestions === 0) {
        return 'not_started';
    } else if (answeredQuestions === totalQuestions) {
        return 'completed';
    } else {
        return 'in_progress';
    }
}