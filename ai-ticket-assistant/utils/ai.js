import { createAgent, gemini } from "@inngest/agent-kit";

const analyzeTicket = async (ticket) => {
  if (!process.env.GEMINI_API_KEY) {
    console.error("AI ERROR: GEMINI_API_KEY is not defined in the .env file. Skipping AI analysis.");
    return null;
  }

  const supportAgent = createAgent({
    model: gemini({
      model: "gemini-1.5-flash",
      apiKey: process.env.GEMINI_API_KEY,
    }),
    name: "AI Ticket Triage Assistant",
    system: `You are an expert AI assistant that processes technical support tickets. 

Your job is to:
1. Summarize the issue.
2. Estimate its priority.
3. Provide helpful notes and resource links for human moderators.
4. List relevant technical skills required.

IMPORTANT:
- Respond with *only* valid raw JSON.
- Do NOT include markdown, code fences, comments, or any extra formatting.
- The format must be a raw JSON object.

Repeat: Do not wrap your output in markdown or code fences.`,
  });

  const response =
    await supportAgent.run(`You are a ticket triage agent. Only return a strict JSON object with no extra text, headers, or markdown.
        
Analyze the following support ticket and provide a JSON object with:

- summary: A short 1-2 sentence summary of the issue.
- priority: One of "low", "medium", or "high".
- helpfulNotes: A detailed technical explanation that a moderator can use to solve this issue. Include useful external links or resources if possible.
- relatedSkills: An array of relevant skills required to solve the issue (e.g., ["React", "MongoDB"]).

Respond ONLY in this JSON format and do not include any other text or markdown in the answer:

{
"summary": "Short summary of the ticket",
"priority": "high",
"helpfulNotes": "Here are useful tips...",
"relatedSkills": ["React", "Node.js"]
}

---

Ticket information:

- Title: ${ticket.title}
- Description: ${ticket.description}`);

  // Log the full raw response first so it's visible in logs for debugging.
  // console.log("[Inngest][AI] supportAgent.run returned:", response);

  // The agent response shape can vary depending on the SDK/version.
  // Be defensive when extracting the raw text to avoid `Cannot read properties of undefined`.
  let raw = null;
  try {
    if (!response) {
      console.error("AI ERROR: supportAgent.run returned no response", response);
      return null;
    }

    // Common shapes: response.output is an array with objects that may contain
    // `context`, `text`, or `content`. Try several fallbacks.
    if (typeof response === "string") {
      raw = response;
    } else if (Array.isArray(response.output) && response.output.length > 0) {
      const out0 = response.output[0];
      if (typeof out0 === "string") raw = out0;
      else if (out0 && typeof out0 === "object") raw = out0.context || out0.text || out0.content || JSON.stringify(out0);
    } else if (response.output && typeof response.output === "string") {
      raw = response.output;
    } else if (response.content) {
      raw = response.content;
    } else {
      // Last resort: stringify the whole response so we can at least try to parse any JSON inside.
      raw = JSON.stringify(response);
    }
  } catch (extractErr) {
    console.error("AI ERROR: failed to extract raw response", { response, error: extractErr.message });
    return null;
  }

  if (!raw) {
    console.error("AI PARSING FAILED: raw response is empty or undefined", { response });
    return null;
  }

  // If we already have an object (rare), return it directly.
  if (typeof raw === "object") return raw;

  try {
    // Try to extract fenced JSON first (```json ... ```), then fall back to the
    // full trimmed string. Also attempt to extract the first JSON object block
    // if the model added surrounding text.
    const fencedMatch = raw.match(/```json\s*([\s\S]*?)\s*```/i);
    let jsonString = fencedMatch ? fencedMatch[1] : raw.trim();

    // If jsonString does not start with '{', try to extract the first {...} block.
    if (!jsonString.startsWith("{")) {
      const braceMatch = jsonString.match(/({[\s\S]*})/);
      if (braceMatch) jsonString = braceMatch[1];
    }

    return JSON.parse(jsonString);
  } catch (e) {
    console.error("AI PARSING FAILED:", { rawResponse: raw, error: e.message });
    return null;
  }
};

export default analyzeTicket;