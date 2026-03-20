// Este módulo carrega as variáveis de ambiente e VERIFICA a sua existência.
// Se falhar, o servidor recusa-se a arrancar — como um carro sem chave.

require('dotenv').config();

const VARIABLES_REQUERIDAS = ['PORT'];

VARIABLES_REQUERIDAS.forEach((nombreVariable) => {
  if (!process.env[nombreVariable]) {
    throw new Error(
      `❌ Variable de entorno obligatoria no definida: ${nombreVariable}`
    );
  }
});

module.exports = {
  PORT: process.env.PORT,
  ENTORNO: process.env.NODE_ENV || 'development',
};