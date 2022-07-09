import dotenv from "dotenv";
dotenv.config();

import express, { Application, Request, Response } from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";

import Docker, { Container } from "dockerode";
import {
  container_options,
  exec_options,
  exec_start_options,
} from "./configs/dockerConfigs";
import path from "path";
import fs from "fs";

const problems: Array<any> = require("./problems/problems.json");

const app: Application = express();
const httpServer: any = createServer(app);
const io: Server = new Server(httpServer);

app.set("views", path.join(__dirname, "templates"));
app.set("view engine", "ejs");

const docker = new Docker();

let dummy_docker_containers: Map<String, Container> = new Map(); // 소켓아이디와 도커 컨테이너를 매핑
let docker_streams: Map<String, any> = new Map(); //소켓아이디와 도커 내부 스트림 매핑

io.on("connection", (socket: Socket) => {
  console.log(`User ${socket.id} connected`);
  socket.on("exec", (w, h) => {
    // 클라이언트가 접속할때마다 도커로부터 우분투 서버를 생성 => 클라이언트 하나당 컴파일 서버 생성
    // 중간에 오류 발생 시 컨테이너 삭제
    docker.createContainer(
      container_options,
      (err: any, container: Container | undefined) => {
        if (err) {
          console.error(err);
        } else {
          container!.start((err: any) => {
            if (err) {
              console.error(err);
              container!.remove({ force: true }, (err) => {
                console.error(err);
              });
            } else {
              container!.exec(
                exec_options,
                (err: any, exec: Docker.Exec | undefined) => {
                  if (err) {
                    console.error(err);
                    container!.remove({ force: true }, (err) => {
                      console.error(err);
                    });
                  } else {
                    exec!.start(exec_start_options, (err, stream) => {
                      if (err) {
                        console.error(err);
                        container!.remove({ force: true }, (err) => {
                          console.error(err);
                        });
                      } else {
                        dummy_docker_containers.set(socket.id, container!);
                        docker_streams.set(socket.id, stream!);
                        exec!.resize({ h, w }, () => {});
                        stream!.on("data", (chunk) => {
                          if (chunk.toString().startsWith("[valid data]"))
                            socket.emit("result", chunk.toString()); //서버에서 출력되는 유효 데이터를 클라이언트에 전송
                        });
                        socket.emit("init-complete");
                      }
                    });
                  }
                }
              );
            }
          });
        }
      }
    );

    socket.on("source", (problem_idx, data) => {
      //클라이언트로부터 소스코드 를 받으면
      const pre = fs.readFileSync(
        path.join(__dirname, "problems", `${problems[problem_idx].name}.py`),
        "utf-8"
      ); //문제의 기본작성된 코드를 받아
      docker_streams.get(socket.id).write(
        `cd ~/ && rm -rf ./* && echo '${data.replace(
          /\t/gi,
          "    " //제대로 python 들여쓰기 되지 않아 임의로 탭을 스페이스 4개로 변경
        )}' >> code.py && echo '${pre}'>> code.py && python3 code.py && clear\n` // 도커의 우분투 서버에서 실행
      );
    });

    socket.on("disconnect", () => {
      //연결 종료 시 도커의 우분투 서버 삭제
      try {
        dummy_docker_containers
          .get(socket.id)!
          .remove({ force: true }, (err) => {
            console.error(err);
          });
      } catch {
        console.error("연결을 끊을 수 없습니다.");
      }
    });
  });
});

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
