import app from "./app";
import {prisma} from "./lib/prisma";

const PORT = process.env.PORT || 3000;

async function start() {
  await prisma.$connect();
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
  });
}

start().catch((err) => {
  console.error("Error al iniciar el servidor:", err);
  process.exit(1);
});
