export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  try {
    const { messages } = req.body;

    // Simple response for testing
    const lastMessage = messages[messages.length - 1]?.content || "Hello";

    let reply = "Hi! I'm Lana's assistant. How can I help you today? 💇‍♀️";

    if (lastMessage.toLowerCase().includes("book") || lastMessage.toLowerCase().includes("appointment")) {
      reply = "Great! I'd love to help you book an appointment. Please tell me which service you want and your preferred date/time.";
    } else if (lastMessage.toLowerCase().includes("price") || lastMessage.toLowerCase().includes("cost")) {
      reply = "Here are our prices:\n• Balayage: $150–$220\n• Haircut + Styling: $40–$65\n• Highlights: $100–$200";
    }

    return res.status(200).json({ reply });

  } catch (error) {
    console.error("Error:", error.message);
    return res.status(200).json({ 
      reply: "Sorry, I'm having trouble right now. Please text Lana directly at (432) 664-5845 💕" 
    });
  }
}
