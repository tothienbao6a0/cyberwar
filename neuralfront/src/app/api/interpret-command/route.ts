import { createOpenAI } from '@ai-sdk/openai';
import { streamObject } from 'ai'; // Removed StreamingTextResponse import
import { NextResponse } from 'next/server';
import { z } from 'zod'; // For defining the schema of the expected object

// Initialize the AI SDK OpenAI provider client
const openaiProvider = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
  // Other options like baseURL for OpenRouter can be added here
});

export const runtime = 'edge';

// Define the Zod schema for the structured command
// This helps ensure the LLM returns the correct shape and types.
const CommandSchema = z.object({
  action: z.string(),
  unitType: z.string().nullable().optional(),
  unitId: z.string().nullable().optional(),
  count: z.union([z.number(), z.string()]).nullable().optional(), // string for "all"
  direction: z.string().nullable().optional(),
  target: z.string().nullable().optional(),
  coordinates: z.object({ x: z.number(), y: z.number() }).nullable().optional(),
  priority: z.string().nullable().optional(),
  formation: z.string().nullable().optional(),
  specialAbility: z.string().nullable().optional(),
});

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    const systemMessage = `You are an AI assistant for NEURALFRONT. Your role is to interpret natural language commands from players and convert them into a structured JSON object that strictly adheres to the following Zod schema definition (pay attention to optional/nullable fields):
    {
      action: string, (e.g., "move", "attack", "deploy")
      unitType?: string | null, (e.g., "scout", "attacker")
      unitId?: string | null, (e.g., "alpha-1", "drone-7")
      count?: number | string | null, (e.g., 1, 5, "all")
      direction?: string | null, (e.g., "north", "right")
      target?: string | null, (e.g., "enemy-base", "unit-beta-2", "sector D5")
      coordinates?: { x: number, y: number } | null,
      priority?: string | null, (e.g., "high", "low")
      formation?: string | null, (e.g., "line", "spread")
      specialAbility?: string | null (e.g., "stealth_mode", "emp_blast")
    }
    Provide only the JSON object. No explanations or markdown. For example: "Send two scouts to flank right" -> {"action": "flank", "unitType": "scout", "count": 2, "direction": "right"}
    Reference for possible values (be flexible but try to use these if applicable):
    Actions: "move", "attack", "defend", "scout", "patrol", "build", "repair", "deploy", "retreat", "flank", "reinforce", "powerup", "hack", "scan".
    UnitTypes: "scout", "defender", "attacker", "engineer", "drone", "tank", "special_ops", "medic".
    Directions: "north", "south", "east", "west", "northeast", "northwest", "southeast", "southwest", "forward", "backward", "left", "right".
    Targets: "enemy_unit", "enemy_structure", "objective_point", "resource_node".
    Priorities: "low", "medium", "high", "critical".
    Formations: "line", "spread", "column", "wedge", "circle".
    `;

    const result = await streamObject({
      model: openaiProvider.chat('gpt-3.5-turbo'),
      system: systemMessage,
      prompt: prompt,
      schema: CommandSchema,
    });

    return result.toTextStreamResponse(); // This should return a standard Response object

  } catch (error: any) {
    console.error("[Interpret Command API Error]:", error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to interpret command',
        details: error.cause || error
      },
      { status: error.status || 500 }
    );
  }
} 