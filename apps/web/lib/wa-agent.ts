import "server-only";
import OpenAI from "openai";

/**
 * WhatsApp AI intake agent — ported from the live app (core). Generates a reply
 * to an inbound message in the lead's language, using the company's configured
 * agent persona/knowledge. Returns null to STAY SILENT (irrelevant message, job
 * seeker, or no API key) so a human can take over. Gated by the caller behind
 * XENTRAL_WA_AI=1 — off by default so it never auto-messages real leads untested.
 */

export type AgentCfg = {
  apiKey: string; agentName: string; agentTone: string; agentKnowledge: string;
  agentCustomPrompt: string; businessType: string; playbook: string; signoff: string;
};
export type ChatTurn = { role: "user" | "assistant"; content: string };

export function detectLang(text: string, history: ChatTurn[] = []): "ar" | "de" | "en" {
  const combined = [text, ...history.slice(-6).filter((m) => m.role === "user").map((m) => m.content)].join(" ");
  if (/[؀-ۿ]/.test(combined)) return "ar";
  const de = (combined.match(/\b(ich|du|wir|sie|ist|bin|habe|bitte|danke|hallo|und|für|wie|was|können|möchte|sprechen|berater|brauche|helfen|mein|guten|arzt|zahnarzt|facharzt)\b/gi) || []).length;
  const en = (combined.match(/\b(I|we|you|the|is|am|have|please|thank|hello|and|for|how|what|can|want|speak|need|help|my|good)\b/g) || []).length;
  if (de > en && de >= 1) return "de";
  return "en";
}

/** Skip auto-reply for clearly irrelevant traffic or job seekers (human handles). */
export function shouldStaySilent(text: string): boolean {
  if (/\b(looking for job|job opportunity|vacancy|hiring|employment|seeking position|open to work)\b/i.test(text)) return true;
  if (/callpage|advertisement|newsletter|unsubscribe|promotional|do not reply|no-?reply/i.test(text)) return true;
  return false;
}

function systemPrompt(cfg: AgentCfg, lang: "ar" | "de" | "en"): string {
  const langLine = lang === "ar" ? "Reply in Arabic." : lang === "de" ? "Antworte auf Deutsch." : "Reply in English.";
  return [
    `You are ${cfg.agentName || "the assistant"}, a helpful WhatsApp assistant${cfg.businessType ? ` for a ${cfg.businessType} business` : ""}.`,
    `Tone: ${cfg.agentTone || "professional, warm, concise"}. Keep replies short (1-3 sentences), like a real WhatsApp chat.`,
    cfg.agentKnowledge ? `Knowledge base:\n${cfg.agentKnowledge}` : "",
    cfg.playbook ? `Playbook:\n${cfg.playbook}` : "",
    cfg.agentCustomPrompt ? cfg.agentCustomPrompt : "",
    cfg.signoff ? `When appropriate, sign off as: ${cfg.signoff}` : "",
    langLine,
    "Never invent prices or guarantees. If unsure or the person asks to speak to a human, offer to connect them with a consultant.",
  ].filter(Boolean).join("\n\n");
}

export async function generateReply(cfg: AgentCfg, history: ChatTurn[], incoming: string): Promise<string | null> {
  if (!cfg.apiKey) return null;
  if (shouldStaySilent(incoming)) return null;
  const lang = detectLang(incoming, history);
  try {
    const openai = new OpenAI({ apiKey: cfg.apiKey });
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.5,
      max_tokens: 400,
      messages: [{ role: "system", content: systemPrompt(cfg, lang) }, ...history.slice(-10), { role: "user", content: incoming }],
    });
    const reply = res.choices[0]?.message?.content?.trim();
    return reply || null;
  } catch {
    return null;
  }
}
