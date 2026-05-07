export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  try {
    const { messages, action, service, name, phone, startTime } = req.body;

    // Booking Action
    if (action === "create_booking" && startTime) {
      return res.status(200).json({
        success: true,
        message: `✅ Booking Confirmed!\n\nService: ${service || "Appointment"}\nTime: ${new Date(startTime).toLocaleString("en-US", {timeZone: "America/Chicago"})}\n\nLana will confirm shortly via text at (432) 664-5845 💕`
      });
    }

    // Normal Chat
    const lastMsg = messages[messages.length - 1]?.content.toLowerCase() || "";

    let reply = "Hi! I'm Lana's assistant 💇‍♀️ How can I help you today?";

    if (lastMsg.includes("book") || lastMsg.includes("appointment")) {
      reply = "Great! I'd love to help you book an appointment.\n\nPlease tell me:\n• Which service (Balayage, Highlights, Haircut...)\n• Preferred date and time";
    } 
    else if (lastMsg.includes("balayage") || lastMsg.includes("highlight") || lastMsg.includes("cut")) {
      reply = "Perfect! What date and time would you like for your " + lastMsg + "?";
    }

    return res.status(200).json({ reply });

  } catch (error) {
    console.error("Error:", error.message);
    return res.status(200).json({ 
      reply: "Sorry, I'm having trouble right now. Please text Lana directly at (432) 664-5845 💕" 
    });
  }
}
