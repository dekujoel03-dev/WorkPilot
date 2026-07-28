import type {
  MeetingSummaryOutput,
  ProjectBreakdownOutput,
  AssistantResponse,
} from '../types/ai';

export function parseProjectBreakdownOutput(
  output: Record<string, unknown> | null | undefined,
): ProjectBreakdownOutput | null {
  if (!output || typeof output.summary !== 'string' || !Array.isArray(output.suggestedTasks)) {
    return null;
  }
  return output as unknown as ProjectBreakdownOutput;
}

export function parseMeetingSummaryOutput(
  output: Record<string, unknown> | null | undefined,
): MeetingSummaryOutput | null {
  if (
    !output ||
    typeof output.summary !== 'string' ||
    !Array.isArray(output.keyPoints) ||
    !Array.isArray(output.suggestedTasks)
  ) {
    return null;
  }
  return output as unknown as MeetingSummaryOutput;
}

export function parseAssistantResponse(
  output: Record<string, unknown> | null | undefined,
): AssistantResponse | null {
  if (!output || typeof output.reply !== 'string') {
    return null;
  }
  return output as unknown as AssistantResponse;
}
