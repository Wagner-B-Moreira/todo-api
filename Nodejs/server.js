// importa os módulos nativos do Node
const http = require("http");           // servidor HTTP
const fs = require("fs").promises;      // ler/gravar arquivos
const path = require("path");           // manipulação de caminhos
const crypto = require("crypto");       // gerar IDs únicos

// configuração
const port = 3000;
const DATA_FILE = path.join(__dirname, "db.json");

// garante que o db.json exista
async function ensureDB() {
  try {
    await fs.access(DATA_FILE); // verifica se o arquivo existe
  } catch {
    // cria o arquivo com conteúdo inicial se não existir
    await fs.writeFile(DATA_FILE, JSON.stringify({ tasks: [] }, null, 2));
  }
}

// função para ler os dados do arquivo
async function readDB() {
  const data = await fs.readFile(DATA_FILE, "utf8");
  return JSON.parse(data);
}

// função para salvar dados no arquivo
async function saveDB(data) {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

// função para gerar ID único (compatível com Node <18)
function generateId() {
  return crypto.randomBytes(16).toString("hex");
}

// criar servidor HTTP
const server = http.createServer(async (req, res) => {
  await ensureDB(); // garante que o arquivo exista

  if (req.method === "GET" && req.url === "/tasks") {
    const db = await readDB();
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(db.tasks));
  } else if (req.method === "POST" && req.url === "/tasks") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", async () => {
      try {
        const task = JSON.parse(body);
        if (!task.title) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: "O campo 'title' é obrigatório" }));
        }

        task.id = generateId(); // gera ID único
        task.completed = false;

        const db = await readDB();
        db.tasks.push(task);
        await saveDB(db);

        res.writeHead(201, { "Content-Type": "application/json" });
        res.end(JSON.stringify(task));
      } catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "JSON inválido" }));
      }
    });
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Rota não encontrada");
  }
});

// iniciar o servidor
server.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
