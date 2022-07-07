import { createAdapter } from "@socket.io/redis-adapter";
import dotenv from "dotenv";
dotenv.config();

import express, { Application } from "express";
import { createServer } from "http";
import { createClient } from "redis";
import { Server, Socket } from "socket.io";

const app: Application = express();
const httpServer: any = createServer(app);
const io: Server = new Server(httpServer);

import Docker, { Container } from "dockerode";
import {
  container_options,
  exec_options,
  exec_start_options,
} from "./configs/dockerConfigs";

const pubClient = createClient({ url: "redis://localhost:6379" });
const subClient = pubClient.duplicate();

const docker = new Docker();

io.adapter(createAdapter(pubClient, subClient));

let dummy_docker_containers: Map<String, Container> = new Map();

io.on("connection", (socket: Socket) => {
  console.log(`User ${socket.id} connected`);
  socket.on("exec", (w, h) => {
    console.log(w, h);
    docker.createContainer(
      container_options,
      (err: any, container: Container | undefined) => {
        console.log("container", container);

        if (err) {
          console.error(err);
        } else {
          dummy_docker_containers.set(socket.id, container!);
          container!.start((err: any) => {
            container!.exec(
              exec_options,
              (err: any, exec: Docker.Exec | undefined) => {
                exec!.start(exec_start_options, (error, stream) => {
                  console.log(stream);
                });
              }
            );
          });
        }
      }
    );
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

httpServer.listen(process.env.PORT, () => {
  console.log(`
    ################################################
    🛡️  Server listening on port: ${process.env.PORT}  🛡️
    ################################################
  `);
});
