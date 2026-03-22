// Este módulo carrega as variáveis de ambiente e VERIFICA a sua existência.
// Se falhar, o servidor recusa-se a arrancar — como um carro sem chave.

require('dotenv').config();

const VARIABLES_REQUERIDAS = ['NODE_ENV'];

VARIABLES_REQUERIDAS.forEach(key => {
  if (!process.env[key]) throw new Error(`❌ Variable de entorno obligatoria no definida: ${key}`);
});

module.exports = {
  PORT: process.env.PORT || 3000,
  ENTORNO: process.env.NODE_ENV || 'production',
};