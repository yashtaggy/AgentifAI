import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

let groq: Groq;
try {
    groq = new Groq({
        apiKey: process.env.GROQ_API_KEY || 'dummy_key_for_build',
    });
} catch (e) { }

function safeParseJSON(raw: string) {
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error('No JSON found');
    let jsonStr = raw.slice(start, end + 1);
    jsonStr = jsonStr.replace(/[\x00-\x1F\x7F]/g, (ch) => {
        if (ch === '\n') return '\\n';
        if (ch === '\r') return '\\r';
        if (ch === '\t') return '\\t';
        return '';
    });
    return JSON.parse(jsonStr);
}

export async function POST(req: Request) {
    try {
        const { status, responseBody, requestHeaders, requestUrl, requestMethod, requestBody } = await req.json();

        if (!process.env.GROQ_API_KEY) {
            return NextResponse.json(
                { error: 'Groq API key not configured' },
                { status: 500 }
            );
        }

        const systemPrompt = `You are an expert API debugging assistant. You must analyze the provided API error details and return a JSON response diagnosing the problem.

Format your JSON EXACTLY like this:
{
  "diagnosis": "One sentence stating what went wrong",
  "rootCause": "Explanation of why it happened",
  "fix": "Exact actionable fix in plain English",
  "fixedCode": "If the fix involves a code change, show the corrected snippet. Otherwise leave blank.",
  "severity": "critical" // One of: "critical", "warning", "info"
}

CRITICAL: Your entire response must be a single valid JSON object with no text before or after it. All code samples must have newlines escaped as \\n within the JSON string values. Do not use actual newlines inside JSON string values.`;

        const userContent = `Status: ${status}
Method: ${requestMethod}
URL: ${requestUrl}
Headers: ${JSON.stringify(requestHeaders)}
Request Body: ${requestBody || 'None'}
Response Body: ${responseBody}`;

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: systemPrompt
                },
                {
                    role: 'user',
                    content: userContent
                }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.2,
            max_tokens: 2000,
        });

        const textContent = completion.choices[0]?.message?.content || '';

        let jsonResult: any;
        try {
            jsonResult = JSON.parse(textContent);
        } catch (e) {
            jsonResult = safeParseJSON(textContent);
        }

        return NextResponse.json(jsonResult);
    } catch (error: any) {
        console.error('Groq Diagnose API Error:', error);
        return NextResponse.json(
            { error: error?.message || 'An error occurred diagnosing the issue.' },
            { status: 500 }
        );
    }
}
