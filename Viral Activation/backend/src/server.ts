import { createApp } from "./app.js";

async function start() {
  const app = await createApp();
  await app.listen({
    host: app.appConfig.host,
    port: app.appConfig.port
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
