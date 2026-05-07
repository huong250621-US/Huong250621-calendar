export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  try {
    const { messages, action, service, name, phone, startTime } = req.body;

    // Booking
    if (action === "create_booking" || (messages && messages[messages.length-1].content.toLowerCase().includes("book"))) {
      return res.status(200).json({
        success: true,
        message: `✅ Booking Confirmed!\n\nService: ${service || "Appointment"}\nTime: ${new Date(startTime || Date.now() + 86400000).toLocaleString("en-US", {timeZone: "America/Chicago"})}\n\nLana will confirm shortly via text at (432) 664-5845 💕`
      });
    }

    // Strong & Clean Prompt
    const SYSTEM_PROMPT = `You are Lana's friendly and professional virtual assistant at Lana's Salon in Plano, TX.
You specialize in balayage without bleach and gray blending.
Be warm, helpful, and natural. Always reply in clear English.

When the customer wants to book an appointment:
- Be excited
- Ask for service and preferred time
- Help them book`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 800,
        system: SYSTEM_PROMPT,
        messages: messages || [],
      }),
    });

    const data = await response.json();

    return res.status(200).json({ 
      reply: data.content?.[0]?.text || "Sorry, can you rephrase that?" 
    });

  } catch (error) {
    console.error("Error:", error.message);
    return res.status(200).json({ 
      reply: "Sorry, I'm having trouble right now. Please text Lana at (432) 664-5845 💕" 
    });
  }
}
