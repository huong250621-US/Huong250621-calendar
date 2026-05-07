export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  try {
    const { messages, action, service, name, phone, startTime } = req.body;

    const { google } = await import("googleapis");
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
    
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/calendar"],
    });

    const calendar = google.calendar({ version: "v3", auth });
    const calendarId = process.env.CALENDAR_ID;
    const TIMEZONE = "America/Chicago";

    // ====================== CREATE BOOKING ======================
    if (action === "create_booking") {
      if (!name || !phone || !service || !startTime) {
        return res.status(400).json({ error: "Missing booking information" });
      }

      const duration = 90; // 90 phút mặc định, bạn có thể thay đổi sau
      const start = new Date(startTime);
      const end = new Date(start.getTime() + duration * 60 * 1000);

      const event = {
        summary: `💇‍♀️ ${service} — ${name}`,
        description: `Client: ${name}\nPhone: ${phone}\nService: ${service}\nBooked via AI Chatbot`,
        start: { dateTime: start.toISOString(), timeZone: TIMEZONE },
        end: { dateTime: end.toISOString(), timeZone: TIMEZONE },
        colorId: "11",
      };

      const result = await calendar.events.insert({
        calendarId,
        requestBody: event,
      });

      return res.status(200).json({ 
        success: true,
        message: `✅ Booking confirmed!\n\nService: ${service}\nTime: ${start.toLocaleString("en-US", {timeZone: TIMEZONE})}\n\nLana will confirm shortly via text.`,
        eventId: result.data.id
      });
    }

    // ====================== NORMAL CHAT ======================
    const SYSTEM_PROMPT = `You are a warm, knowledgeable hair consultant for Lana's Salon... (giữ nguyên system prompt cũ của bạn)`;

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
        messages,
      }),
    });

    const data = await response.json();

    if (!response.ok) return res.status(response.status).json({ error: data });

    return res.status(200).json({ reply: data.content?.[0]?.text });

  } catch (error) {
    console.error("Chat error:", error.message);
    return res.status(500).json({ error: "Server error. Please try again." });
  }
}
