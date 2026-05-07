export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  try {
    const { messages, action, service, name, phone, startTime } = req.body;

    // Google Calendar
    const { google } = await import("googleapis");
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT || '{}');
    
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/calendar"],
    });

    const calendar = google.calendar({ version: "v3", auth });
    const calendarId = process.env.CALENDAR_ID;

    // Create Booking
    if (action === "create_booking") {
      const start = new Date(startTime || Date.now() + 86400000);
      const event = {
        summary: `💇‍♀️ ${service || "Appointment"} — ${name || "Client"}`,
        description: `Phone: ${phone || ""}\nBooked via chatbot`,
        start: { dateTime: start.toISOString(), timeZone: "America/Chicago" },
        end: { dateTime: new Date(start.getTime() + 7200000).toISOString(), timeZone: "America/Chicago" },
        colorId: "11",
      };

      const result = await calendar.events.insert({ calendarId, requestBody: event });

      return res.status(200).json({
        success: true,
        message: `✅ Booking confirmed! Service: ${service}\nTime: ${start.toLocaleString("en-US", {timeZone: "America/Chicago"})}\nLana will confirm shortly via text.`
      });
    }

    // Normal Chat
    const SYSTEM_PROMPT = `You are a warm, knowledgeable hair consultant for Lana's Salon. Always respond in English. Be helpful and friendly.`;

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
        messages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Anthropic error:", data);
      return res.status(500).json({ error: "API error" });
    }

    return res.status(200).json({ reply: data.content?.[0]?.text || "Sorry, I didn't understand." });

  } catch (error) {
    console.error("Chat error:", error.message);
    return res.status(500).json({ error: "Server error. Please try again." });
  }
}
