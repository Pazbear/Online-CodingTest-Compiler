import { createAdapter } from "@socket.io/redis-adapter";
import dotenv from "dotenv";
dotenv.config();

import express, { Application, Request, Response } from "express";
import { createServer } from "http";
import { createClient } from "redis";
import { Server, Socket } from "socket.io";

import Docker, { Container } from "dockerode";
import {
  container_options,
  exec_options,
  exec_start_options,
} from "./configs/dockerConfigs";
import path from "path";

const app: Application = express();
const httpServer: any = createServer(app);
const io: Server = new Server(httpServer);

app.set("views", path.join(__dirname, "templates"));
app.set("view engine", "ejs");

const pubClient = createClient({ url: "redis://localhost:6379" });
const subClient = pubClient.duplicate();

const docker = new Docker();

io.adapter(createAdapter(pubClient, subClient));

let dummy_docker_containers: Map<String, Container> = new Map();
let docker_streams: Map<String, any> = new Map();

io.on("connection", (socket: Socket) => {
  console.log(`User ${socket.id} connected`);
  socket.on("exec", (w, h) => {
    docker.createContainer(
      container_options,
      (err: any, container: Container | undefined) => {
        console.log("container", container);

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
                        console.log("stream", stream);
                        exec!.resize({ h, w }, () => {});
                        stream!.on("data", (chunk) => {
                          socket.emit("result", chunk.toString());
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

    socket.on("source", (data) => {
      console.log(data);
      docker_streams
        .get(socket.id)
        .write(
          `cd ~/ && rm -rf ./* && echo '${data}' >> code.py && python3 code.py && clear\n`
        );
    });

    socket.on("disconnect", () => {
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
  res.render("editor");
});

httpServer.listen(process.env.PORT, () => {
  console.log(`
    ################################################
    🛡️  Server listening on port: ${process.env.PORT}  🛡️
    ################################################
  `);
});
