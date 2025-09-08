export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, company, companyWebsite, jobDescription, problem, opportunity } = req.body;

    console.log('API Key exists:', !!process.env.ANTHROPIC_API_KEY);
    console.log('Generating questions for:', company);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        messages: [
          {
            role: "user",
            content: `You have access to web search capabilities. Use them to research the user's company and industry context before generating follow-up questions.

User Context:
- Name: ${name}
- Company: ${company}
- Company Website: ${companyWebsite}
- Role: ${jobDescription}
- Problem: ${problem}
- Opportunity: ${opportunity}

INSTRUCTIONS:
1. First, use web search to research their company by visiting their website (${companyWebsite}) and searching for company information
2. Look up industry benchmarks and context related to their specific problem
3. Research typical ROI metrics for their role and industry
4. Generate exactly 3 specific, intelligent follow-up questions that demonstrate you understand their business context

Your questions should:
- Show knowledge of their company/industry
- Focus on quantifiable business impact (revenue, cost savings, efficiency gains)
- Be relevant to their specific role and decision-making authority
- Help determine realistic ROI and implementation priority
- Reference industry standards or benchmarks when possible

Please respond with a JSON object containing exactly 3 questions:
{
  "questions": [
    "Question 1 that shows company/industry knowledge",
    "Question 2 that focuses on quantifiable metrics", 
    "Question 3 that assesses implementation scope and urgency"
  ]
}

Make each question substantive and demonstrate that you've researched their context. Avoid generic questions.

DO NOT OUTPUT ANYTHING OTHER THAN VALID JSON.`
          }
        ]
      })
    });

    console.log('Anthropic response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Anthropic error response:', errorText);
      throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    let responseText = data.content[0].text;
    
    console.log('Raw Claude response:', responseText);
    
    // Clean up any markdown formatting and extract JSON
    responseText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    // Try to extract JSON if Claude added extra text
    let jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      responseText = jsonMatch[0];
    }
    
    console.log('Cleaned response for parsing:', responseText);
    
    const parsedResponse = JSON.parse(responseText);
    
    res.status(200).json({ questions: parsedResponse.questions || [] });
  } catch (error) {
    console.error('Error generating questions:', error);
    
    // Enhanced fallback questions
    res.status(200).json({
      questions: [
        "How many people or processes in your organization would be directly impacted by solving this problem?",
        "What's the estimated monthly cost (time, resources, or revenue loss) this problem currently creates for your business?",
        "If this solution delivered a 20-30% improvement, what would be the measurable business impact and timeline for implementation?"
      ]
    });
  }
}