const jwt = require('jsonwebtoken');
const readline = require('readline/promises');

// Cria uma interface para entrada e saída
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Função assíncrona para ler o token
async function obterToken() {
    const token = await rl.question("Cole seu token aqui: ");
    const decoded = jwt.decode(token);
    console.log(decoded);
    rl.close(); // Fecha a interface após a entrada
}

// Chama a função
obterToken();