import facts from "../../server/knowledge.js";
import { handleAsk } from "../../server/quick-ask.js";

export const onRequest = ({ request, env }) => handleAsk(request, env, facts);
