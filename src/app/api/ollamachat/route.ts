import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

type ChatMessage = { 
  role: 'system' | 'user' | 'assistant'; 
  content: string 
};

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let messages: ChatMessage[];
  
  try {
    const body = await req.json();
    if (!body.messages || !Array.isArray(body.messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' }, 
        { status: 400 }
      );
    }
    messages = body.messages;
  } catch (err) {
    console.error('[Ollama] Error parsing request:', err);
    return NextResponse.json(
      { error: 'Invalid request body' }, 
      { status: 400 }
    );
  }

  try {
    const response = await axios.post('http://localhost:11434/api/chat', {
      model: 'llama3.2',
      messages,
      stream: false
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000 // 30 seconds timeout
    });

    if (!response.data || !response.data.message) {
      throw new Error('Invalid response from Ollama API');
    }

    return NextResponse.json({
      content: response.data.message.content,
      model: response.data.model,
      done: response.data.done
    });
  } catch (error) {
    console.error('[Ollama] API Error:', error);
    
    let errorMessage = 'Failed to process your request';
    let statusCode = 500;

    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request to Ollama API timed out';
        statusCode = 504; // Gateway Timeout
      } else if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        errorMessage = error.response.data?.error || error.response.statusText;
        statusCode = error.response.status;
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage = 'No response received from Ollama API';
        statusCode = 502; // Bad Gateway
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}
