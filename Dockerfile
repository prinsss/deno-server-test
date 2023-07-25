# https://github.com/denoland/deno/issues/17444
FROM denoland/deno:ubuntu

EXPOSE 8080
ENV PORT=8080

WORKDIR /appops

# Failed writing lockfile. Caused by: Permission denied (os error 13)
USER root

COPY deps.ts deno.json ./
RUN deno cache deps.ts

ADD . .
RUN deno cache main.ts

CMD ["task", "start"]
