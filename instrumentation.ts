export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { runDemoSeed } = await import("./src/lib/demo/seed");
    runDemoSeed().then((result) => {
      if (process.env.NODE_ENV === "development") {
        console.log(`[instrumentation] ${result.message}`);
      }
    });
  }
}
