import { createTRPCRouter } from "../index";
import { clientsRouter } from "./clients";
import { contactsRouter } from "./contacts";
import { engagementsRouter } from "./engagements";
import { proposalsRouter } from "./proposals";
import { actionsRouter } from "./actions";
import { interactionsRouter } from "./interactions";
import { briefingRouter } from "./briefing";

export const appRouter = createTRPCRouter({
  clients: clientsRouter,
  contacts: contactsRouter,
  engagements: engagementsRouter,
  proposals: proposalsRouter,
  actions: actionsRouter,
  interactions: interactionsRouter,
  briefing: briefingRouter,
});

export type AppRouter = typeof appRouter;
