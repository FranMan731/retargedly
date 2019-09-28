//============================
//  PUERTO
//============================
process.env.PORT = process.env.PORT || 65000;

//============================
//  ENTORNO
//============================
process.env.NODE_ENV = process.env.NODE_ENV || 'dev';

//============================
//  Base de Datos
//============================
process.env.URLDB = 'mongodb://localhost:27017/retargedly';

//============================
//  Secret Token
//============================
process.env.SECRET_TOKEN = process.env.SECRET_TOKEN || "clave_secreta_para_retargedly_sgdgs123";
