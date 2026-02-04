import { VapiClient, Vapi } from '@vapi-ai/server-sdk';
import { createTicketTool, editTicketTool } from '../llm/tools';
import systemPrompt from './systemPrompt';

const apiKey = process.env.VAPI_API_KEY;
let ASSISTANT_ID = '';

if (!apiKey) {
  console.warn('VAPI_API_KEY is not set; VAPI agent will not be able to create sessions.');
}

const client = new VapiClient({
  token: apiKey ?? '',
});

const assistantConfig: Vapi.CreateAssistantDto = {
  transcriber: {
    provider: 'deepgram',
    model: 'nova-2',
    language: 'en',
    smartFormat: true,
    keywords: ['Alex:2', 'Rhys:3', 'plumbing:2'], 
  },
  
  model: {
    provider: 'openai' as Vapi.OpenAiModelProvider,
    model: 'gpt-4o-mini' as Vapi.OpenAiModelModel,
    messages: [
      {
        role: 'system' as Vapi.OpenAiMessageRole,
        content: systemPrompt,
      },
    ],
    tools: [createTicketTool, editTicketTool] as any,
  },

  voice: {
    provider: 'cartesia',
    voiceId: '694f9389-aac1-45b6-b726-9d9369183238',
  },

  server: {
    url: `${process.env.VAPI_BASE_URL}/vapi/webhook`,
  }
};

export interface CreateSessionResult {
  id: string;
  assistantId: string;
  streamUrl?: string;
}

export async function initializeAssistant(): Promise<void> {
  const assistant = await client.assistants.create(assistantConfig);
  ASSISTANT_ID = assistant.id;
  console.log('Assistant ID:', ASSISTANT_ID);
}

export const vapiAgent = {
  async createSession(): Promise<CreateSessionResult> {
    if (!ASSISTANT_ID) {
      throw new Error(
        'VAPI assistant not initialized: call initializeAssistant() before createSession().'
      );
    }
    const session = await client.sessions.create({
      assistantId: ASSISTANT_ID,
    });
    const extended = session as Vapi.Session & { streamUrl?: string };
    return {
      id: session.id,
      assistantId: ASSISTANT_ID,
      streamUrl: extended.streamUrl,
    };
  },
};
