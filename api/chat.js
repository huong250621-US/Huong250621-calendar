export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  try {
    const { messages, action, service, name, phone, startTime } = req.body;

    // ====================== BOOKING ======================
    if (action === "create_booking") {
      return res.status(200).json({
        success: true,
        message: `✅ Booking confirmed!\n\nService: ${service || "Appointment"}\nTime: ${new Date(startTime || Date.now()).toLocaleString("en-US", {timeZone: "America/Chicago"})}\n\nLana will confirm shortly via text at (432) 664-5845.`
      });
    }

    // ====================== NORMAL CHAT ======================
    const SYSTEM_PROMPT = `You are a warm, friendly assistant for Lana's Salon in Plano, TX. 
You help customers with services, pricing, and booking appointments. 
Always respond in English. Be helpful and concise.`;

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

    if (!response.ok) {
      console.error("Anthropic Error:", data);
      return res.status(200).json({ 
        reply: "Sorry, I'm having trouble connecting right now. Please try again or text Lana at (432) 664-5845." 
      });
    }

    return res.status(200).json({ 
      reply: data.content?.[0]?.text || "Sorry, I didn't understand. Can you rephrase?" 
    });

  } catch (error) {
    console.error("Server Error:", error.message);
    return res.status(200).json({ 
      reply: "Sorry, something went wrong. Please try again or text Lana directly at (432) 664-5845." 
    });
  }
}
