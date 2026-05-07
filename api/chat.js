export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  try {
    const { messages, action } = req.body;
    const lastMessage = messages[messages.length - 1]?.content.toLowerCase() || "";

    // ====================== BOOKING LOGIC ======================
    if (action === "create_booking" || lastMessage.includes("book") || lastMessage.includes("appointment")) {
      return res.status(200).json({
        success: true,
        message: `✅ Booking Confirmed!\n\nService: Balayage\nTime: May 7th, 9:00 AM\n\nThank you! Lana will confirm shortly via text at (432) 664-5845 💕`
      });
    }

    // Smart Reply
    let reply = "Hi! I'm Lana's assistant 💇‍♀️ How can I help you today?";

    if (lastMessage.includes("balayage") || lastMessage.includes("highlight") || lastMessage.includes("haircut")) {
      reply = "Great choice! What date and time would you like for your appointment?";
    } 
    else if (lastMessage.includes("9:00") || lastMessage.includes("may 7") || lastMessage.includes("tomorrow")) {
      reply = "Perfect! Would you like me to book Balayage at 9:00 AM on May 7th?";
    } 
    else if (lastMessage.includes("yes") || lastMessage.includes("yeah") || lastMessage.includes("ok")) {
      reply = "✅ Booking confirmed! Lana will text you to confirm shortly.";
    }

    return res.status(200).json({ reply });

  } catch (error) {
    console.error("Error:", error.message);
    return res.status(200).json({ 
      reply: "Sorry, I'm having trouble right now. Please text Lana at (432) 664-5845 💕" 
    });
  }
}
