import { ContainerCreateOptions } from "dockerode";

export const container_options: ContainerCreateOptions = {
  Image: "ubuntu_for_compile:v1.0.1",
  AttachStdin: false,
  AttachStdout: true,
  AttachStderr: true,
  Tty: true,
  OpenStdin: false,
  StdinOnce: false,
  Cmd: ["/bin/bash"],
};

export const exec_options = {
  AttachStdout: true,
  AttachStderr: true,
  AttachStdin: true,
  Tty: true,
  Cmd: ["/bin/bash"],
};

export const exec_start_options = {
  Tty: true,
  stream: true,
  stdin: true,
  stdout: true,
  stderr: true,
  hijack: true,
};
