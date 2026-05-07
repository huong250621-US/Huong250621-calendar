export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  try {
    const { messages, action, date, service, name, phone, startTime } = req.body;

    // ====================== GOOGLE CALENDAR SETUP ======================
    const { google } = await import("googleapis");
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
    
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/calendar"],
    });

    const calendar = google.calendar({ version: "v3", auth });
    const calendarId = process.env.CALENDAR_ID;
    const TIMEZONE = "America/Chicago";

    // ====================== GET AVAILABLE SLOTS ======================
    if (action === "get_slots") {
      const now = new Date();
      const maxDate = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000); // 10 days ahead

      const freebusy = await calendar.freebusy.query({
        requestBody: {
          timeMin: now.toISOString(),
          timeMax: maxDate.toISOString(),
          timeZone: TIMEZONE,
          items: [{ id: calendarId }],
        },
      });

      const busyTimes = freebusy.data.calendars[calendarId]?.busy || [];

      return res.status(200).json({ 
        busyTimes,
        message: "Available slots retrieved successfully." 
      });
    }

    // ====================== CREATE BOOKING ======================
    if (action === "create_booking") {
      if (!name || !phone || !service || !startTime) {
        return res.status(400).json({ error: "Missing booking information" });
      }

      const duration = 120; // minutes, bạn có thể thay đổi theo service
      const start = new Date(startTime);
      const end = new Date(start.getTime() + duration * 60 * 1000);

      const event = {
        summary: `💇‍♀️ ${service} — ${name}`,
        description: `Client: ${name}\nPhone: ${phone}\nService: ${service}\nBooked via chatbot`,
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
        message: `✅ Booking confirmed for ${service} on ${start.toLocaleDateString()}`,
        eventId: result.data.id
      });
    }

    // ====================== NORMAL CHATBOT ======================
    const SYSTEM_PROMPT = `You are a warm, knowledgeable hair consultant for Lana's Salon — a private, one-on-one home studio in Plano, TX 75075.

SALON INFO:
- Name: Lana's Salon
- Phone/Text: (432) 664-5845
- Address: Plano, TX 75075
- Hours: Tue–Sun 9am–7pm CT
- Instagram: @lanasalonplano

SPECIALTY: Balayage WITHOUT Bleach & Gray Hair Blending.

Always respond in English only.

When the client wants to book:
- Help them choose service
- Ask for preferred dates and times
- Say exactly: "Great! Let me check Lana's availability for you."
- Then offer to book for them.`;

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

    if (!response.ok) {
      return res.status(response.status).json({ error: data });
    }

    return res.status(200).json({ reply: data.content?.[0]?.text });

  } catch (error) {
    console.error("Chat error:", error.message);
    return res.status(500).json({ error: "Server error. Please try again." });
  }
}
