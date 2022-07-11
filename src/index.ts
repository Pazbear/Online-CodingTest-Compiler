import dotenv from "dotenv";
dotenv.config();

import express, { Application, Request, Response } from "express";
import { createServer } from "http";
import { IOServer } from "./modules/socket";
import path from "path";

const problems: Array<any> = require("./problems/problems.json");

const app: Application = express();
const httpServer: any = createServer(app);

app.set("views", path.join(__dirname, "templates"));
app.set("view engine", "ejs");

IOServer(httpServer);

app.get("/", (req: Request, res: Response) => {
  // index는 templates/editor.ejs를 렌더링해줌
  const selected_problem =
    problems[Math.floor(Math.random() * problems.length)]; //문제는 problems 폴더에서 랜덤으로 출제
  res.render("editor", {
    selected_problem,
  });
});

httpServer.listen(process.env.PORT, () => {
  console.log(`
    ################################################
    🛡️  Server listening on port: ${process.env.PORT}  🛡️
    ################################################
  `);
});
