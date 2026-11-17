import { chat } from "./groq.js";

export async function draftReply(email, user) {
  const convo = email.thread.map((m) => `${m.from}: ${m.text}`).join("\n");
  const first = email.thread[0]?.from?.split(" ")[0] || "there";
  try {
    return (await chat({
      system: `You are ${user.name}, personal assistant to ${user.clientName}. Write a short, warm, professional reply (under 110 words) on their behalf. If the matter needs ${user.clientName}'s personal decision, say they will review it personally and respond; do not make commitments for them. Plain text only, no subject line, sign off as "${user.name}, on behalf of ${user.clientName}".`,
      user: `Subject: ${email.subject}\n\n${convo}`,
      temperature: 0.4
    })).trim();
  } catch {
    const body = email.cls === "client"
      ? `Thank you for sending this over. ${user.clientName} will review it personally and respond shortly.`
      : `Thanks for reaching out. ${email.meeting ? `Noted for ${email.meeting}. ` : ""}I'll confirm the details and get back to you today.`;
    return `Hi ${first},\n\n${body}\n\nBest,\n${user.name}, on behalf of ${user.clientName}`;
  }
}
