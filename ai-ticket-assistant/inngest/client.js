import { Inngest } from "inngest";

// This is the main fix. We are now passing the INNGEST_EVENT_KEY
// from your .env file to the Inngest client. This will authenticate
// your server and prevent it from crashing.
export const inngest = new Inngest({
  id: "ticketing-system",
  eventKey: process.env.INNGEST_EVENT_KEY,
});
