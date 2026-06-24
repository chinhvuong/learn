import { createErrorFactory } from '@shared/errors/app-errors';

/**
 * Errors raised by the Lesson Creation Engine. A creation that throws any of
 * these consumes no Creation Credit (CONTEXT.md → Creation Credit): the credit
 * is only committed after a Lesson is actually produced.
 */
export const LessonEngineErrors = createErrorFactory({
  CONTENT_UNFETCHABLE: {
    code: 'LESSON_CONTENT_UNFETCHABLE',
    message: () => 'Could not fetch the Source content.',
    statusCode: 422,
  },
  ANALYSIS_FAILED: {
    code: 'LESSON_ANALYSIS_FAILED',
    message: () => 'Could not analyze the Source.',
    statusCode: 422,
  },
  NO_CREATION_CREDIT: {
    code: 'LESSON_NO_CREATION_CREDIT',
    message: () => 'No Creation Credit remaining.',
    statusCode: 402,
  },
});
