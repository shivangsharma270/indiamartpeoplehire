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

  const prompt = `You are an expert technical recruiter strictly evaluating a candidate based ONLY on the provided job description and resume.
    Do not make assumptions, infer skills that are not explicitly stated, or hallucinate information. 
    Analyze the candidate's resume against the exact requirements listed in the job description.
    
    JOB DESCRIPTION:
    ${jobDescription}
    
    RESUME TEXT:
    ${resumeText}

    CRITICAL INSTRUCTIONS:
    - Base the compatibility "score" (0-100) purely on the presence of required skills and relevant experience from the Job Description.
    - "matchedSkills" must ONLY contain skills explicitly present in BOTH the resume and the Job Description.
    - "missingSkills" must contain required skills from the Job Description that are NOT mentioned in the resume.
    - "experienceRelevance" should objectively compare the candidate's experience to what is required.
    - "summary" should be a concise, objective justification of the score based only on facts from the resume.

    Output ONLY a valid JSON object matching this schema exactly, without any markdown formatting or additional text:
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
