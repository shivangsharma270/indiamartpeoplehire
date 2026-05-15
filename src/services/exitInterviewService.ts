const apiKey = import.meta.env.VITE_LLM_GATEWAY_TOKEN;
const gatewayUrl = "https://imllm.intermesh.net/v1/chat/completions";

const INTERVIEW_PROMPT = `
You are IndiaMART's AI Exit Interviewer. Your tone is empathetic, professional, and curious.
The goal is to understand why the employee is leaving so we can improve IndiaMART for others.

Guidelines:
1. Keep the interview concise (max 5 questions total).
2. Ask only ONE question at a time.
3. Explore themes like: Salary/Benefits, Work-Life Balance, Management/Leadership, Growth Opportunities, and Culture.
4. If a user gives a vague answer, politely ask for more detail.
5. End gracefully when you have enough info or if the user wants to stop.

Start by thanking them for their service and asking what their primary reason for moving on is.
`;

const INSIGHT_PROMPT = `
As an Attrition Analyst at IndiaMART, analyze this exit interview transcript.
Identify the root causes of attrition, sentiment, and actionable insights.

TRANSCRIPT:
{{TRANSCRIPT}}

Return a JSON object with:
{
  "primary_reason": "string",
  "root_causes": ["reason1", "reason2"],
  "sentiment": "Positive/Neutral/Negative",
  "summary": "short summary",
  "recommendations": ["rec1", "rec2"]
}
`;

export class ExitInterviewService {
  private model: string = "google/gemini-2.5-flash"; 

  async getChatResponse(history: any[]) {
    if (!apiKey) {
      throw new Error('LLM Gateway Access Token (VITE_LLM_GATEWAY_TOKEN) is not defined.');
    }

    // Convert history to OpenAI/Gateway format
    // history in components is expected in [{role, parts: [{text}]}] or similar
    // We'll normalize it for the gateway which usually expects {role, content}
    const messages = history.map(h => ({
      role: h.role === 'model' ? 'assistant' : h.role,
      content: h.parts ? h.parts[0].text : h.content
    }));

    const response = await fetch(gatewayUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: "system", content: INTERVIEW_PROMPT },
          ...messages
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`LLM Gateway Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  async generateInsights(transcript: string) {
    if (!apiKey) {
      throw new Error('LLM Gateway Access Token (VITE_LLM_GATEWAY_TOKEN) is not defined.');
    }

    const prompt = INSIGHT_PROMPT.replace("{{TRANSCRIPT}}", transcript);
    
    const response = await fetch(gatewayUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: "user", content: prompt }
        ],
        temperature: 0.1
      })
    });

    if (!response.ok) {
      throw new Error(`LLM Gateway Error: ${response.statusText}`);
    }

    const data = await response.json();
    let text = data.choices[0].message.content;
    
    // Handle potential markdown encapsulation
    if (text.includes('```')) {
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    }

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { summary: text };
    } catch (e) {
      console.error("Failed to parse insights", e);
      return { summary: text };
    }
  }
}
