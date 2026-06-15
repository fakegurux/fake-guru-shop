# FAKE GURU Shop

Static shop + password-protected admin panel, backed by a tiny Node server.
Products, images, prices, stock and payment details are all edited in the admin
panel at `/admin` — no code editing needed. Changes are live for everyone instantly.

## What's where
- `server.js` — the backend (serves the site, stores data, handles image upload)
- `public/index.html` — the public shop
- `public/admin.html` — the admin panel (open at /admin)
- `public/uploads/` — uploaded product images land here
- `data/products.json` — your products + settings (written by the admin panel)

---

## Deploy on your Hetzner server (Ubuntu)

### 1. Install Node (if not already)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
```

### 2. Upload this folder
From your own computer:
```bash
scp -r fake-guru-shop root@YOUR_HETZNER_IP:/var/www/
```

### 3. Install + set your admin password
```bash
cd /var/www/fake-guru-shop
npm install
```

### 4. Run it permanently with a systemd service
Create the service (paste a STRONG password where it says CHANGE_THIS):
```bash
cat > /etc/systemd/system/fakeguru.service <<'EOF'
[Unit]
Description=FAKE GURU Shop
After=network.target

[Service]
WorkingDirectory=/var/www/fake-guru-shop
ExecStart=/usr/bin/node server.js
Environment=PORT=3000
Environment=ADMIN_PASSWORD=CHANGE_THIS
Restart=always
User=root

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now fakeguru
systemctl status fakeguru   # should say "active (running)"
```

### 5. Point nginx (fake-guru.com) at it
```bash
cat > /etc/nginx/sites-available/fake-guru <<'EOF'
server {
    listen 80;
    server_name fake-guru.com www.fake-guru.com;
    client_max_body_size 8M;   # allows image uploads
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF

ln -s /etc/nginx/sites-available/fake-guru /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

### 6. HTTPS (after DNS A-records point to this server)
```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d fake-guru.com -d www.fake-guru.com
```

Open Hetzner firewall ports **80** and **443**.

Done:
- Shop: `https://fake-guru.com`
- Admin: `https://fake-guru.com/admin`  (log in with ADMIN_PASSWORD)

To change the password later: edit the service file, then
`systemctl daemon-reload && systemctl restart fakeguru`.
