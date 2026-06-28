import Groq from "groq-sdk";
import { ShortTermMemory } from "./memory.js";
import { LoopGuard } from "./loopGuard.js";
import { ToolRouter } from "./toolRouter.js";
import { buildSystemPrompt, buildReActPrompt } from "./promptTemplates.js";
import { ResearchPlanner } from "./planner.js";
import { GROQ_API_KEY } from "../config.js";

export class GuidedReActAgent {
  constructor(sessionId) {
    this.sessionId = sessionId;
    this.memory = new ShortTermMemory(sessionId);
    this.guard = new LoopGuard(sessionId);
    this.router = new ToolRouter();
    this.client = new Groq({ apiKey: GROQ_API_KEY });
    this.maxSteps = 10;
  }

  async *run(ticker, companyName, sector, query) {
    await this.memory.initSession(ticker, query);
    const planner = new ResearchPlanner(sector);

    for (let step = 0; step < this.maxSteps; step++) {
      let history = await this.memory.getLog();

      // CRITICAL FIX: Only pass the most recent history turns to save tokens
      if (Array.isArray(history) && history.length > 2) {
        history = history.slice(-2); // Keeps only the absolute last Action/Observation pair
      }

      const planStatus = planner.getPlanStatus();
      const currentObjective = planner.getNextObjective();
      if (!currentObjective) break; // All done

      const prompt = buildReActPrompt(ticker, companyName, query, history, planStatus, currentObjective);

      const response = await this.client.chat.completions.create({
        model: "llama-3.1-8b-instant",
        temperature: 0.1,
        max_tokens: 1024,
        stop: ["Observation:"],
        messages: [
          { role: "system", content: buildSystemPrompt() },
          { role: "user", content: prompt }
        ]
      });

      const raw = response.choices[0].message.content;
      const parsed = this.parseOutput(raw);

      yield { type: "thought", content: parsed.thought, step };

      if (parsed.action === "FINISH") {
        await this.memory.append("final_answer", parsed.answer);
        yield { type: "final_answer", content: parsed.answer };
        break;
      }

      const isDupe = await this.guard.isDuplicate(parsed.action, parsed.actionInput);
      if (isDupe) {
        const msg = "SKIP: identical call already made.";
        await this.memory.append("observation", msg, { tool: parsed.action });
        yield { type: "observation", content: msg, tool: parsed.action };
        continue;
      }

      yield { type: "action", tool: parsed.action, input: parsed.actionInput };

      let observation;
      try {
        // Override ticker in the action input to prevent LLM from using wrong ticker
        if (parsed.actionInput.ticker) {
          parsed.actionInput.ticker = ticker;
        }
        observation = await this.router.call(parsed.action, parsed.actionInput);
      } catch (err) {
        observation = {
          error: {
            type: "SYSTEM_ERROR",
            message: err.message,
            retryable: false
          }
        };
      }

      // Update planner based on outcome
      planner.updateObjective(parsed.action, parsed.actionInput.metric, observation);

      await this.memory.append("thought", parsed.thought);
      await this.memory.append("action", parsed.action, { toolInput: parsed.actionInput });
      await this.memory.append("observation", observation, { tool: parsed.action });
      await this.guard.record(parsed.action, parsed.actionInput);

      yield { type: "observation", content: observation, tool: parsed.action };
    }
  }

  parseOutput(raw) {
    const thought = raw.match(/Thought:(.*?)(?=Action:|$)/s)?.[1]?.trim() ?? "";
    const action = raw.match(/Action:\s*(\w+)/)?.[1]?.trim() ?? "FINISH";
    const inputMatch = raw.match(/Action Input:\s*(\{.*?\})/s)?.[1];
    const answer = raw.match(/Final Answer:(.*)/s)?.[1]?.trim() ?? "";
    let actionInput = {};
    try { actionInput = JSON.parse(inputMatch ?? "{}"); } catch (_) { }
    return { thought, action, actionInput, answer };
  }
}
