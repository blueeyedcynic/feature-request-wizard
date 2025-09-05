export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, company, jobDescription, problem, opportunity } = req.body;

    console.log('API Key exists:', !!process.env.ANTHROPIC_API_KEY);
    console.log('API Key prefix:', process.env.ANTHROPIC_API_KEY?.substring(0, 10));

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: `Based on this user context, generate 1-2 specific follow-up questions to understand the ROI and business impact of their feature request. Focus on quantifying the impact and understanding implementation urgency.

User Context:
- Name: ${name}
- Company: ${company}
- Role: ${jobDescription}
- Problem: ${problem}
- Opportunity: ${opportunity}

Please respond with a JSON object containing an array of questions:
{
  "questions": [
    "Question 1 text here",
    "Question 2 text here"
  ]
}

Make the questions specific to their industry, role, and the problem they described. Focus on metrics like time saved, revenue impact, cost reduction, or user satisfaction improvements.

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
    
    // Clean up any markdown formatting
    responseText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    const parsedResponse = JSON.parse(responseText);
    
    res.status(200).json({ questions: parsedResponse.questions || [] });
  } catch (error) {
    console.error('Error generating questions:', error);
    
    // Fallback questions
    res.status(200).json({
      questions: [
        "How many people or processes would be impacted by solving this problem?",
        "What's the estimated time or cost savings this solution could provide monthly?"
      ]
    });
  }
}