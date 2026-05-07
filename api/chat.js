export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  try {
    const { messages, action, service, name, phone, startTime } = req.body;

    // ====================== GOOGLE CALENDAR ======================
    if (action === "create_booking" && startTime) {
      const { google } = await import("googleapis");
      const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
      const auth = new google.auth.GoogleAuth({ credentials, scopes: ["https://www.googleapis.com/auth/calendar"] });
      const calendar = google.calendar({ version: "v3", auth });
      const calendarId = process.env.CALENDAR_ID;

      const start = new Date(startTime);
      const end = new Date(start.getTime() + 90 * 60 * 1000);

      const event = {
        summary: `💇‍♀️ ${service || "Appointment"} — ${name || "Client"}`,
        description: `Phone: ${phone}\nBooked via chatbot`,
        start: { dateTime: start.toISOString(), timeZone: "America/Chicago" },
        end: { dateTime: end.toISOString(), timeZone: "America/Chicago" },
        colorId: "11",
      };

      await calendar.events.insert({ calendarId, requestBody: event });

      return res.status(200).json({
        success: true,
        message: `✅ Booking confirmed!\nService: ${service}\nTime: ${start.toLocaleString("en-US", {timeZone: "America/Chicago"})}\n\nLana sẽ liên hệ xác nhận qua tin nhắn.`
      });
    }

    // ====================== CHAT THÔNG MINH ======================
    const SYSTEM_PROMPT = `You are a warm, knowledgeable hair consultant for Lana's Salon — a private home studio in Plano, TX. 
You specialize in balayage without bleach and gray hair blending.
Be friendly, professional, and helpful. Always respond in English.

Salon Info:
- Phone: (432) 664-5845
- Hours: Tue–Sun 9am–7pm
- Location: Plano, TX 75075

When customer wants to book:
- Ask for service and preferred time
- Then say: "Great! Let me help you book that."`;

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
      reply: data.content?.[0]?.text || "Sorry, I didn't understand. Can you rephrase?" 
    });

  } catch (error) {
    console.error("Error:", error.message);
    return res.status(200).json({ 
      reply: "Sorry, I'm having trouble connecting right now. Please try again or text Lana at (432) 664-5845 💕" 
    });
  }
}
