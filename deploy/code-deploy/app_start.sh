cd /home/ubuntu/tj-Eseller-node
gsutil cp gs://${CREDS_BUCKET:-tj-creds}/config.eseller-backend.env .env
docker compose up --build -d