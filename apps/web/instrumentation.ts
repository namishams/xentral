// Runs once at server boot (node runtime). Registers the SessionPort resolver
// eagerly so API routes work even before any page render imports the root layout.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./lib/session");
  }
}
