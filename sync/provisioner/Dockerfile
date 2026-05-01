FROM cloudflare/cloudflared:latest

USER root
RUN apk add --no-cache curl

COPY start.sh /start.sh
RUN chmod +x /start.sh

ENTRYPOINT ["/start.sh"]
