export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  try {
    const { messages, action, service, name, phone, startTime } = req.body;

    // Booking
    if (action === "create_booking" && startTime) {
      return res.status(200).json({
        success: true,
        message: `✅ Booking Confirmed!\n\nService: ${service || "Appointment"}\nTime: ${new Date(startTime).toLocaleString("en-US", {timeZone: "America/Chicago"})}\n\nLana will confirm shortly via text at (432) 664-5845 💕`
      });
    }

    // Strong System Prompt
    const SYSTEM_PROMPT = `You are Lana's warm, professional, and knowledgeable virtual assistant at Lana's Salon in Plano, TX.
You are helpful, friendly, and concise. Always reply in natural English.

Core services:
- Balayage without bleach (signature)
- Gray hair blending
- Highlights, color, haircut & styling, keratin, etc.

When the customer says they want to book:
- Show excitement
- Ask for service + preferred date/time
- Then offer to book for them.

Tone: Warm, positive, like a good friend who is a hair expert. Use light emojis.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: messages || [],
      }),
    });

    const data = await response.json();

    return res.status(200).json({ 
      reply: data.content?.[0]?.text || "Sorry, I didn't understand. Can you rephrase?" 
    });

  } catch (error) {
    console.error("Error:", error.message);
    return res.status(200).json({ 
      reply: "Sorry, I'm having trouble connecting right now. Please try again or text Lana directly at (432) 664-5845 💕" 
    });
  }
}
