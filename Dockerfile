FROM ubuntu:20.04
LABEL email="mkcho1997@daum.net"
LABEL name="pazbear"
LABEL version="1.0.0"
LABEL description="Ubuntu for compile"

RUN apt-get -y update
RUN apt-get -y install vim

RUN apt-get -y install python3
RUN apt-get -y install python3-pip