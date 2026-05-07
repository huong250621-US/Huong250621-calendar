export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Phiên bản cực đơn giản để test
  try {
    const { messages } = req.body;
    const userMessage = messages?.[messages.length - 1]?.content?.toLowerCase() || "";

    let reply = "Hi! I'm Lana's assistant 💇‍♀️ How can I help you today?";

    if (userMessage.includes("book") || userMessage.includes("appointment")) {
      reply = "✅ Booking request received!\n\nPlease tell me your preferred service and date/time. Example: Balayage on May 8 at 10am";
    } else if (userMessage.includes("balayage") || userMessage.includes("highlight")) {
      reply = "Great choice! Would you like me to book Balayage for you?";
    } else if (userMessage.includes("yes") || userMessage.includes("ok")) {
      reply = "✅ Booking confirmed! Lana will text you to confirm shortly at (432) 664-5845 💕";
    }

    return res.status(200).json({ reply });

  } catch (error) {
    console.error("Error:", error.message);
    return res.status(200).json({ 
      reply: "Sorry, I'm having trouble right now. Please text Lana at (432) 664-5845 💕" 
    });
  }
}
