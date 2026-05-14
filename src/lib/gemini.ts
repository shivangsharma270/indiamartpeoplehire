const apiKey = import.meta.env.VITE_LLM_GATEWAY_TOKEN;
const gatewayUrl = "https://imllm.intermesh.net/v1/chat/completions";

export interface AIAnalysisResult {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  experienceRelevance: string;
  recommendation: 'Strong Match' | 'Moderate Match' | 'Weak Match';
  summary: string;
}

export async function analyzeResume(resumeText: string, jobDescription: string): Promise<AIAnalysisResult> {
  if (!apiKey) {
    throw new Error('LLM Gateway Access Token (VITE_LLM_GATEWAY_TOKEN) is not defined in environment variables.');
  }

  const prompt = `Analyze this candidate resume against the following job description and return a compatibility score, matching skills, missing skills, strengths, weaknesses, and hiring recommendation in JSON format.
    
    JOB DESCRIPTION:
    ${jobDescription}
    
    RESUME TEXT:
    ${resumeText}

    CRITICAL: Return ONLY a valid JSON object matching this schema exactly:
    {
      "score": number,
      "matchedSkills": string[],
      "missingSkills": string[],
      "experienceRelevance": string,
      "recommendation": "Strong Match" | "Moderate Match" | "Weak Match",
      "summary": string
    }
  `;

  const response = await fetch(gatewayUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "user", content: prompt }
      ],
      temperature: 0.1
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`LLM Gateway Error (${response.status}): ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  let content = data.choices[0].message.content;

  // Handle potential markdown encapsulation
  if (content.includes('```')) {
    content = content.replace(/```json/g, '').replace(/```/g, '').trim();
  }

  try {
    const result = JSON.parse(content);
    return result as AIAnalysisResult;
  } catch (error) {
    console.error("Failed to parse LLM Gateway response:", content);
    throw new Error("AI Analysis process failed to return structured data. Please try again.");
  }
}
