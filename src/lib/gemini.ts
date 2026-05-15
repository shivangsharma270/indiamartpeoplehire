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

  const prompt = `
    You are an expert technical recruiter and resume screening evaluator.
    
    Your task is to strictly evaluate a candidate ONLY based on the provided Job Description and Resume Text.
    
    Do not make assumptions, infer missing skills, hallucinate experience, or guess technologies that are not explicitly mentioned in the resume.
    
    Analyze the candidate objectively against the exact requirements listed in the Job Description.

    JOB DESCRIPTION:
    ${jobDescription}

    RESUME TEXT:
    ${resumeText}

    CRITICAL EVALUATION RULES:
    1. Base the evaluation strictly on explicit evidence present in the resume.
    2. Do not infer technologies from job titles, company names, departments, or related tools.
    3. A skill can only be considered matched if it is explicitly mentioned in BOTH the Job Description and the Resume.
    4. Treat isolated keyword mentions as weak evidence unless supported by project work, responsibilities, achievements, or experience descriptions.
    5. Ignore formatting issues, OCR noise, duplicated text, symbols, or parsing artifacts in the resume.

    SCORING GUIDELINES:
    Use deterministic and conservative scoring standards.
    Calculate the compatibility score (0-100) using these factors:
    1. Required technical skills match → Highest weight
    2. Relevant work experience → High weight
    3. Domain/industry relevance → Medium weight
    4. Education/certifications → Medium weight
    5. Preferred/nice-to-have skills → Low weight

    MANDATORY VS OPTIONAL REQUIREMENTS:
    - Treat skills explicitly marked as "required", "must have", or "mandatory" as critical requirements.
    - Treat skills marked as "preferred", "good to have", or optional as secondary requirements.
    - Missing mandatory skills should significantly reduce the score.
    - Missing optional skills should have lower impact.

    EXPERIENCE EVALUATION:
    - Compare candidate experience against the required years of experience whenever mentioned.
    - Evaluate relevance of past roles to the target role.
    - Prioritize directly relevant experience over unrelated experience.
    - Consider role seniority alignment (Intern, Junior, Mid-Level, Senior, Lead, Architect).
    - Penalize candidates who are significantly underqualified.
    - Moderately penalize candidates who are significantly overqualified.

    TECHNOLOGY MATCHING RULES:
    - Consider related technologies as partial matches only when reasonably applicable.
    - Do not treat related technologies as exact matches unless explicitly stated.
    - Examples: PostgreSQL may partially match SQL, TensorFlow may partially match Machine Learning, JavaScript does NOT automatically match TypeScript.

    RECOMMENDATION RULES:
    - "Strong Match" → Candidate satisfies most mandatory requirements with strong relevant experience.
    - "Moderate Match" → Candidate satisfies some important requirements but has notable gaps.
    - "Weak Match" → Candidate lacks several critical mandatory requirements.
    - If more than 50% of mandatory skills are missing, recommendation must NOT exceed "Weak Match".

    SUMMARY RULES:
    - Summary must be concise, factual, and evidence-based.
    - Mention exact matched skills and major missing requirements.
    - Avoid generic praise or vague statements.

    OUTPUT FORMAT:
    You must output ONLY a valid JSON object matching this schema exactly, without any markdown formatting or additional text:
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
