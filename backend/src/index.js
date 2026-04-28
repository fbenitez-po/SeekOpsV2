const app = require('./app');
const { testConexion } = require('./config/database');

const PUERTO = process.env.PORT || 3000;

async function iniciar() {
  await testConexion();
  app.listen(PUERTO, () => {
    console.log(`Servidor corriendo en puerto ${PUERTO}`);
  });
}

iniciar().catch((err) => {
  console.error('Error al iniciar el servidor:', err);
  process.exit(1);
});
