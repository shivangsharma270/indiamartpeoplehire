const apiKey = import.meta.env.VITE_LLM_GATEWAY_TOKEN;
const gatewayUrl = "https://imllm.intermesh.net/v1/chat/completions";

const LD_PLANNER_PROMPT = `
As an AI Learning & Development Strategist at IndiaMART, your task is to create a career growth roadmap for an employee.
You must consider:
1. Current role and skills.
2. Market trends (what's happening in the tech/sales world this month).
3. Skill gaps for their next target role.
4. Specific certifications and trainings available globally.

EMPLOYEE DATA:
{{EMPLOYEE_DATA}}

CURRENT MARKET TRENDS (MAY 2026):
- AI Integration in every role (Low-code/No-code for non-tech).
- Focus on efficient scaling and performance optimization.
- Soft skills: Adaptability and Cross-functional leadership.

Return a JSON object:
{
  "gap_analysis": "string explanation of gaps",
  "market_trends": "brief context on current industry shifts",
  "readiness_score": number (0-100),
  "roadmap": [
    { "step": "string", "description": "string", "timeline": "string", "priority": "High/Medium/Low" }
  ],
  "recommendations": [
     { "type": "certification/training/project", "title": "string", "platform": "string" }
  ],
  "career_growth_suggestion": "strategic advice for HR",
  "what_to_build": "AI-powered internal tool idea specific to this employee's role to improve productivity"
}
`;

export class LdService {
  private model: string = "google/gemini-2.5-flash";

  async generatePath(employee: any) {
    if (!apiKey) {
      throw new Error('LLM Gateway Access Token is not defined.');
    }

    const dataString = JSON.stringify(employee, null, 2);
    const prompt = LD_PLANNER_PROMPT.replace("{{EMPLOYEE_DATA}}", dataString);

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
        temperature: 0.2
      })
    });

    if (!response.ok) {
      throw new Error(`LLM Gateway Error: ${response.statusText}`);
    }

    const data = await response.json();
    let text = data.choices[0].message.content;

    if (text.includes('```')) {
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    }

    try {
      return JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse L&D JSON", e);
      // Fallback
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
      throw new Error("Invalid AI Response format");
    }
  }

  async generateDepartmentStrategy(department: string, employees: any[]) {
    if (!apiKey) throw new Error('LLM Gateway Access Token is not defined.');

    const DEPT_STRATEGY_PROMPT = `
    As an AI Chief Strategy Officer for IndiaMART, analyze the following employees in the {{DEPT}} department.
    
    1. Identify collective skill gaps.
    2. Suggest ONE MAJOR INFRASTRUCTURE/PRODUCT to build for this department to increase ROI by 30%.
    3. Provide a 3-step implementation roadmap for the whole department.
    4. Current Market Context: May 2026.
    
    EMPLOYEES:
    {{EMPLOYEES}}
    
    Return JSON:
    {
      "collective_gaps": ["gap1", "gap2"],
      "what_to_build": {
        "title": "Project Name",
        "vision": "Why build this?",
        "impact": "High/Critical"
      },
      "dept_roadmap": [
        { "milestone": "step", "action": "what to do" }
      ],
      "market_verdict": "string"
    }
    `;

    const prompt = DEPT_STRATEGY_PROMPT
      .replace("{{DEPT}}", department)
      .replace("{{EMPLOYEES}}", JSON.stringify(employees.map(e => ({ name: e.user_name, role: e.role, skills: e.skills })), null, 2));

    const response = await fetch(gatewayUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2
      })
    });

    const data = await response.json();
    let text = data.choices[0].message.content;
    if (text.includes('```')) text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(text);
  }
}
