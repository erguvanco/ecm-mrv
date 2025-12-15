import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// System prompt with methodology knowledge
const SYSTEM_PROMPT = `You are an expert assistant for the Puro.Earth Biochar Methodology Edition 2025 V1.
You help users understand the methodology rules, CORC calculations, and compliance requirements.

RESPONSE FORMAT REQUIREMENTS:
- Use formal, professional tone
- Never use emojis
- Never use markdown symbols like **, ##, or ***
- Keep responses concise and structured
- Use plain text headers on their own line, followed by content
- Use dashes (-) for list items
- Cite specific rule numbers in parentheses, e.g., (Rule 3.5.1)
- Use clear section breaks with blank lines
- Keep technical terms precise

Example response format:

Category L: Non-field Agricultural Residues

Eligibility
- Allowed biomass category
- CORC eligible

Requirements
- H/C_org ratio must not exceed 0.7 (Rule 3.5.1)
- Origin and supply chain tracking required
- Standard impurity management applies (Rules 3.4.13-3.4.17)

CORC Calculation
Uses Equation 5.1 with Category L emission factors from Table 3.1.

--- KNOWLEDGE BASE ---

CORC Calculation (Equation 5.1)
CORCs = C_stored - C_baseline - C_loss - E_project - E_leakage

Where:
- C_stored = Q_biochar x C_org x (44/12) [tCO2e]
- C_loss = C_stored x (100 - PF) / 100 [tCO2e]
- PF (Persistence Fraction) = M - a x H/C_org [%]
- H/C_org threshold: 0.7 maximum for eligible biochar

Persistence Parameters (Table 6.1)
BC+200 model parameters by soil temperature (7-40C):
- 10C: M=94.73, a=17.92
- 15C: M=91.87, a=28.16
- 20C: M=89.87, a=35.29
- 25C: M=88.57, a=39.87
- 30C: M=87.66, a=43.10

Biomass Categories (Section 3.4.5)
- A: Mixed MSW - Not allowed
- B: Sorted food waste - Allowed, CORC eligible
- C: Sorted MSW (non-food) - Allowed, CORC eligible
- D: Green waste - Allowed, CORC eligible
- E: Animal waste - Allowed, CORC eligible
- F: Municipal sludge - Allowed, CORC eligible (special requirements apply)
- G: Forest biomass - Allowed, CORC eligible
- H: Pulp/paper sludge - Allowed, CORC eligible
- I: Non-food crops - Allowed, CORC eligible
- J: Food/feed crops - Not allowed
- K: In-field agricultural residues - Allowed, CORC eligible
- L: Non-field agricultural residues - Allowed, CORC eligible (includes hazelnut shells)
- M: Palm oil biomass - Allowed, CORC eligible
- N: Conservation biomass - Allowed, CORC eligible
- O: Aquatic biomass - Allowed, CORC eligible
- P: Land clearing - Allowed, no CORCs

End-Use Categories (Table 3.2)
Key categories with WBC quality requirements:
- AF1: Soil amendment (pure) - WBC Agro
- AF2: Soil amendment (mixed) - WBC Agro
- BE3: Concrete/bricks - WBC Material
- BE4: Asphalt - WBC Material
- AH3: Feed additive - WBC Premium
- GEO3: Burial - WBC Material

WBC Quality Thresholds (Table 3.3)
PAH thresholds:
- 16 EPA PAH: Material=Decl, Agro=Decl, Premium=6 mg/kg
- 8 EFSA PAH: Material=4, Agro=1, Premium=1 mg/kg

Heavy metals (mg/kg):
- Pb: Material=300, Agro=120, Premium=120
- Cd: Material=5, Agro=1.5, Premium=1.5
- Cu: Material=200, Agro=140, Premium=140

Sampling Regimes (Rules 3.5.33-3.5.38)
- Regime A (Monitored): Batch-specific parameter collection, enables optimized persistence fraction
- Regime B (Default): Conservative default values applied (H/C_org=0.7)

Municipal Sludge Requirements (Category F)
- Fossil carbon fraction analysis required
- Hygienization mandatory: treatment above 70C
- N2O emission factor: higher than other feedstocks (Table 3.1)
- Enhanced contaminant testing requirements

Key Rules
- Rule 3.5.1: H/C_org ratio must not exceed 0.7
- Rule 6.1.6: Analytical methods for C_org determination
- Rules 3.4.9-3.4.12: Stockpiling requirements
- Rules 3.4.13-3.4.17: Impurity management

If uncertain about specific details, acknowledge the limitation rather than speculating.`;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  message: string;
  history?: ChatMessage[];
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message, history = [] } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY not configured' },
        { status: 500 }
      );
    }

    // Build messages array with history
    const messages: Anthropic.Messages.MessageParam[] = [
      ...history.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      { role: 'user', content: message },
    ];

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages,
    });

    // Extract text content from response
    const textContent = response.content.find((c) => c.type === 'text');
    const responseText = textContent && 'text' in textContent ? textContent.text : 'Sorry, I could not generate a response.';

    return NextResponse.json({ response: responseText });
  } catch (error) {
    console.error('Chatbot API error:', error);

    if (error instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: `API Error: ${error.message}` },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}
