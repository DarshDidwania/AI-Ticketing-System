import { Inngest } from "inngest";

// This is the main fix. We are now passing the INNGEST_EVENT_KEY
// from your .env file to the Inngest client. This will authenticate
// your server and prevent it from crashing.
export const inngest = new Inngest({
  id: "ticketing-system",
  eventKey: "tV6y1sVsQ35U_pv6qkWiWcZft9gYHwvbf-PDbOze3FdJKbYAgJ8REQdRCM9D8VBKUJHvSx06lxtox5iXP5oflQ",
});
