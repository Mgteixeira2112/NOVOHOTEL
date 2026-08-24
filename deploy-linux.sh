#!/bin/bash
# Script de deploy e configuração no Linux para https://goncalves.guiadamantiqueira.com.br/

set -e

DOMAIN="goncalves.guiadamantiqueira.com.br"
WEB_ROOT="/var/www/$DOMAIN/public_html"
APACHE_CONF="/etc/apache2/sites-available/$DOMAIN.conf"

echo "=== Configurando Servidor Apache para $DOMAIN ==="

# 1. Instalar módulos necessários do Apache
sudo apt update
sudo apt install apache2 certbot python3-certbot-apache rsync -y
sudo a2enmod rewrite ssl headers expires deflate

# 2. Criar diretório do site
sudo mkdir -p "$WEB_ROOT"

# 3. Criar arquivo de configuração do Apache VirtualHost
sudo bash -c "cat > $APACHE_CONF" << 'EOF'
<VirtualHost *:80>
    ServerName goncalves.guiadamantiqueira.com.br
    DocumentRoot /var/www/goncalves.guiadamantiqueira.com.br/public_html

    <Directory /var/www/goncalves.guiadamantiqueira.com.br/public_html>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/goncalves_error.log
    CustomLog ${APACHE_LOG_DIR}/goncalves_access.log combined
</VirtualHost>
EOF

# 4. Habilitar o site e reiniciar o Apache
sudo a2ensite "$DOMAIN.conf"
sudo systemctl reload apache2

# 5. Ajustar permissões
sudo chown -R www-data:www-data "/var/www/$DOMAIN"
sudo chmod -R 755 "/var/www/$DOMAIN"

echo "=== Apache configurado com sucesso! ==="
echo "Para gerar o certificado SSL (HTTPS), execute:"
echo "sudo certbot --apache -d $DOMAIN"
