'use server';
/**
 * @fileOverview A flow to automatically extract details from an image of a found item.
 *
 * - foundItemAIDetails - A function that handles the AI-powered detail extraction.
 * - FoundItemAIDetailsInput - The input type for the foundItemAIDetails function.
 * - FoundItemAIDetailsOutput - The return type for the foundItemAIDetails function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FoundItemAIDetailsInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a found item, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type FoundItemAIDetailsInput = z.infer<typeof FoundItemAIDetailsInputSchema>;

const FoundItemAIDetailsOutputSchema = z.object({
  itemName: z.string().describe('The name of the item identified in the photo.'),
  category: z.string().describe('The most appropriate category for the identified item (e.g., Electronics, Documents, Bags, Accessories).'),
  attributes: z.array(z.string()).describe('A list of key attributes describing the item (e.g., color, material, brand, distinguishing marks, model number if visible).'),
});
export type FoundItemAIDetailsOutput = z.infer<typeof FoundItemAIDetailsOutputSchema>;

const foundItemPrompt = ai.definePrompt({
  name: 'foundItemAIDetailsPrompt',
  input: {schema: FoundItemAIDetailsInputSchema},
  output: {schema: FoundItemAIDetailsOutputSchema},
  prompt: `You are an expert assistant for identifying found items. Your task is to analyze the provided image of a found item and extract its name, category, and key attributes.

Please identify the item in the image and provide:
1.  **itemName**: A concise name for the item.
2.  **category**: A suitable category from a predefined list (e.g., Electronics, Documents, Bags, Accessories). Choose the most specific and appropriate category.
3.  **attributes**: A list of descriptive attributes such as color, material, brand, size, distinguishing marks, or any other important details visible in the image.

Output the information as a JSON object, adhering strictly to the following schema:
{{ai.outputSchema 'json'}}

Image of the found item: {{media url=photoDataUri}}`,
});

const foundItemAIDetailsFlow = ai.defineFlow(
  {
    name: 'foundItemAIDetailsFlow',
    inputSchema: FoundItemAIDetailsInputSchema,
    outputSchema: FoundItemAIDetailsOutputSchema,
  },
  async (input) => {
    const {output} = await foundItemPrompt(input);
    if (!output) {
      throw new Error('AI failed to generate item details.');
    }
    return output;
  }
);

export async function foundItemAIDetails(
  input: FoundItemAIDetailsInput
): Promise<FoundItemAIDetailsOutput> {
  return foundItemAIDetailsFlow(input);
}
