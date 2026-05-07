export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  try {
    const { messages, action, date, service, name, phone, startTime } = req.body;

    const { google } = await import("googleapis");
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
    
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/calendar"],
    });

    const calendar = google.calendar({ version: "v3", auth });
    const calendarId = process.env.CALENDAR_ID;

    const TIMEZONE = "America/Chicago";

    // ====================== SYSTEM PROMPT ======================
    const SYSTEM_PROMPT = `You are a warm, knowledgeable hair consultant for Lana's Salon — a private, one-on-one home studio in Plano, TX 75075.

SALON INFO:
- Name: Lana's Salon
- Phone/Text: (432) 664-5845
- Address: Plano, TX 75075
- Hours: Tue–Sun 9am–7pm CT
- Instagram: @lanasalonplano

SPECIALTY: Balayage WITHOUT Bleach & Gray Hair Blending.

SERVICES & PRICING: (same as before - I kept it short for space)
- Haircut + Styling: $40–$65
- Bang Trim: $10–$15
- Single Color / Tint: $80–$130
- Balayage / Ombré: $150–$220
- ... (and other services)

LANGUAGE RULE: Respond ONLY in English, no matter what language the client uses. No exceptions.

When client wants to book:
- Help choose service
- Ask for preferred dates/times
- Say exactly: "Great! Let me check Lana's availability for you."
- Then guide them through booking.`;

    // ====================== HANDLE ACTIONS ======================
    if (action === "create_booking") {
      // Tạo event vào Google Calendar
      const event = {
        summary: `💇‍♀️ ${service} — ${name}`,
        description: `Client: ${name}\nPhone: ${phone}\nService: ${service}\nBooked via chatbot`,
        start: { dateTime: startTime, timeZone: TIMEZONE },
        end: { dateTime: new Date(new Date(startTime).getTime() + 7200000).toISOString(), timeZone: TIMEZONE }, // default 2 hours
        colorId: "11",
      };

      const result = await calendar.events.insert({
        calendarId,
        requestBody: event,
      });

      return res.status(200).json({ 
        success: true, 
        message: "Booking confirmed! Lana will contact you shortly.",
        eventId: result.data.id 
      });
    }

    // ====================== NORMAL CHAT ======================
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
