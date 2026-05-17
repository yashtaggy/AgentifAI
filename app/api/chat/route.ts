import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

let groq: Groq;
try {
    groq = new Groq({
        apiKey: process.env.GROQ_API_KEY || 'dummy_key_for_build',
    });
} catch (e) { }

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();

        if (!process.env.GROQ_API_KEY) {
            return NextResponse.json(
                { error: 'Groq API key not configured' },
                { status: 500 }
            );
        }

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: `You are an expert API integration specialist and developer assistant. 
Your goal is to help developers understand, integrate, and debug APIs based on OpenAPI specifications.
Always provide clean, modern, and production-ready code. Ensure correct authentication placeholders and error handling in your code examples.
You must return only the response directly, without formatting it in large code blocks if not necessary, but to wrap code inside markdown when providing code.`,
                },
                ...messages,
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.7,
            max_tokens: 1024,
        });

        return NextResponse.json({
            content: completion.choices[0]?.message?.content || '',
        });
    } catch (error: any) {
        console.error('Groq Chat API Error:', error);
        return NextResponse.json(
            { error: error?.message || 'An error occurred during chat.' },
            { status: 500 }
        );
    }
}
