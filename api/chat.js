export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  try {
    const { messages } = req.body;

    const SYSTEM_PROMPT = `You are a warm and helpful assistant for Lana's Salon in Plano, TX. 
You help with hair services, pricing, and booking appointments. 
Always reply in English, be friendly and professional.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 700,
        system: SYSTEM_PROMPT,
        messages: messages || [],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Anthropic Error:", data);
      return res.status(200).json({ 
        reply: "I'm having trouble connecting to my brain right now. Please try again or text Lana directly at (432) 664-5845 💕" 
      });
    }

    return res.status(200).json({ 
      reply: data.content?.[0]?.text || "Sorry, I didn't catch that. Could you say it again?" 
    });

  } catch (error) {
    console.error("Server Error:", error.message);
    return res.status(200).json({ 
      reply: "Sorry, I'm having trouble connecting right now. Please try again or text Lana at (432) 664-5845." 
    });
  }
}
