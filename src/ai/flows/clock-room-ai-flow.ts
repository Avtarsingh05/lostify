
'use server';
/**
 * @fileOverview A flow to analyze luggage images for the Clock Room Storage.
 *
 * - analyzeLuggage - A function that identifies item type and color.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeLuggageInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of luggage, as a data URI that must include a MIME type and use Base64 encoding."
    ),
});

const AnalyzeLuggageOutputSchema = z.object({
  itemType: z.string().describe('The type of luggage (e.g., Suitcase, Backpack, Duffle Bag, Laptop Bag).'),
  color: z.string().describe('The primary color of the luggage.'),
  description: z.string().describe('A brief descriptive attribute of the bag.'),
});

const analyzeLuggagePrompt = ai.definePrompt({
  name: 'analyzeLuggagePrompt',
  input: {schema: AnalyzeLuggageInputSchema},
  output: {schema: AnalyzeLuggageOutputSchema},
  prompt: `Analyze the provided image of a piece of luggage.
Identify the itemType (e.g., Suitcase, Backpack, etc.) and its primary color.
Provide a brief description of any distinguishing features.

Image: {{media url=photoDataUri}}`,
});

export async function analyzeLuggage(input: {photoDataUri: string}) {
  const {output} = await analyzeLuggagePrompt(input);
  if (!output) throw new Error('AI analysis failed');
  return output;
}
