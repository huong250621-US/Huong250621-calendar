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
    const auth = new google.auth.GoogleAuth({ credentials, scopes: ["https://www.googleapis.com/auth/calendar"] });
    const calendar = google.calendar({ version: "v3", auth });
    const calendarId = process.env.CALENDAR_ID;
    const TIMEZONE = "America/Chicago";

    // ====================== KIỂM TRA LỊCH TRỐNG ======================
    if (action === "create_booking" && startTime) {
      const start = new Date(startTime);
      const end = new Date(start.getTime() + 90 * 60 * 1000); // 90 phút

      // Kiểm tra xem có trùng lịch không
      const freebusy = await calendar.freebusy.query({
        requestBody: {
          timeMin: start.toISOString(),
          timeMax: end.toISOString(),
          items: [{ id: calendarId }]
        }
      });

      const busy = freebusy.data.calendars[calendarId]?.busy || [];

      if (busy.length > 0) {
        return res.status(200).json({
          success: false,
          message: "❌ Thời gian này đã có lịch. Vui lòng chọn giờ khác."
        });
      }

      // Tạo lịch nếu trống
      const event = {
        summary: `💇‍♀️ ${service || "Appointment"} — ${name || "Client"}`,
        description: `Phone: ${phone}\nBooked via chatbot`,
        start: { dateTime: start.toISOString(), timeZone: TIMEZONE },
        end: { dateTime: end.toISOString(), timeZone: TIMEZONE },
        colorId: "11",
      };

      const result = await calendar.events.insert({ calendarId, requestBody: event });

      return res.status(200).json({
        success: true,
        message: `✅ Booking Confirmed!\nService: ${service}\nTime: ${start.toLocaleString("en-US", {timeZone: TIMEZONE})}\n\nLana sẽ xác nhận qua tin nhắn trong thời gian sớm nhất.`
      });
    }

    // ====================== CHAT THƯỜNG ======================
    const lastMsg = messages[messages.length - 1]?.content.toLowerCase() || "";

    let reply = "Hi! I'm Lana's assistant 💇‍♀️ How can I help you today?";

    if (lastMsg.includes("book") || lastMsg.includes("appointment")) {
      reply = "Great! Please tell me which service and your preferred date & time.\nExample: Balayage on May 8 at 10am";
    }

    return res.status(200).json({ reply });

  } catch (error) {
    console.error("Error:", error.message);
    return res.status(200).json({ 
      reply: "Sorry, I'm having trouble right now. Please text Lana at (432) 664-5845 💕" 
    });
  }
}
