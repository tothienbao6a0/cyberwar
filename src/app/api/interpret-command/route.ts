import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { rateLimit } from '@/lib/security/rateLimit';
import { sanitizeCommand } from '@/lib/security/sanitize';
import { validateGameRules } from '@/lib/security/gameRules';

// Initialize the AI SDK OpenAI provider client
const openaiProvider = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
});

export const runtime = 'edge';

// Define allowed actions and unit types for strict validation
const ALLOWED_ACTIONS = [
  'move', 'attack', 'defend', 'scout', 'patrol', 'deploy', 
  'retreat', 'flank', 'reinforce'
] as const;

const ALLOWED_UNIT_TYPES = [
  'scout', 'defender', 'attacker', 'engineer', 'drone', 
  'tank', 'special_ops', 'medic'
] as const;

interface CommandRequest {
  type: string;
  payload: {
    text: string;
    action: string;
    timestamp: number;
  };
}

// Command injection patterns to detect
const SUSPICIOUS_PATTERNS = [
  /exec\s*\(/i,
  /eval\s*\(/i,
  /system\s*\(/i,
  /process\s*\./i,
  /require\s*\(/i,
  /__proto__/i,
  /constructor/i,
  /prototype/i,
  /\{\{.*\}\}/i, // Template injection
  /<script/i,
  /javascript:/i,
  /data:/i,
  /vbscript:/i,
];

export async function POST(req: Request) {
  try {
    // Rate limiting
    const identifier = req.headers.get('x-forwarded-for') || 'anonymous';
    const { success } = await rateLimit(identifier);
    
    if (!success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Parse the request body
    const body = await req.json();
    const command = body as CommandRequest;

    if (!command?.payload?.text || typeof command.payload.text !== 'string') {
      return NextResponse.json({ error: 'Invalid command format' }, { status: 400 });
    }

    const prompt = command.payload.text;

    // Check for suspicious patterns
    if (SUSPICIOUS_PATTERNS.some(pattern => pattern.test(prompt))) {
      console.warn(`[Security] Suspicious command pattern detected: ${prompt}`);
      return NextResponse.json({ error: 'Invalid command format' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    // Process the natural language command
    const systemMessage = `You are an AI assistant for NEURALFRONT that converts natural language commands into JSON objects.
CRITICAL: You must ONLY output a valid JSON object. No text before or after. No explanations. No markdown formatting.

The JSON must follow this structure (only 'action' is required):
{
  "action": string,     // Required: "move", "attack", "deploy", etc.
  "unitType": string,   // "scout", "defender", "attacker", etc.
  "unitId": string,     // "alpha-1", "drone-7", etc.
  "count": number,      // How many units (e.g., 2, 5)
  "direction": string,  // "north", "right", etc.
  "target": string,     // "enemy-base", "unit-beta-2", etc.
  "coordinates": {      // Position on grid
    "x": number,
    "y": number
  },
  "priority": string,   // "high", "low", etc.
  "formation": string,  // "line", "spread", etc.
  "specialAbility": string  // "stealth_mode", "emp_blast", etc.
}

Examples:
Input: "Send two scouts to flank right"
Output: {"action":"flank","unitType":"scout","count":2,"direction":"right"}

Input: "Deploy 3 defenders at coordinates 10, 20"
Output: {"action":"deploy","unitType":"defender","count":3,"coordinates":{"x":10,"y":20}}

REMEMBER: Output ONLY the JSON object. No other text.`;

    const result = await streamText({
      model: openaiProvider.chat('gpt-3.5-turbo'),
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: prompt }
      ],
      temperature: 0
    });

    // Parse and validate the result
    const parsedResult = JSON.parse(result.toString());
    
    // Validate game rules
    const gameState = body.gameState;
    const validationResult = validateGameRules(parsedResult, gameState);
    if (!validationResult.valid) {
      return NextResponse.json({ error: validationResult.reason }, { status: 400 });
    }

    // Sanitize the command
    const sanitizedCommand = sanitizeCommand(parsedResult);

    // Add security headers
    const response = NextResponse.json(sanitizedCommand);
    response.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self'");
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    return response;

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