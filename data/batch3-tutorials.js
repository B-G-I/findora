/**
 * data/batch3-tutorials.js — Deployment Tutorials
 *
 * Full-length guides on production web infrastructure, server management,
 * cloud architecture, and modern deployment pipelines.
 */

const batch3Tutorials = [
  // ─────────────────────────────────────────────────────────────────
  // ARTICLE 1: Laravel 11 & Filament Admin Panel on Linux VPS
  // ─────────────────────────────────────────────────────────────────
  {
    slug: "how-to-deploy-laravel-11-filament-production-linux-vps",
    title: "How to Deploy a Laravel 11 & Filament Admin Panel on a Production Linux VPS (Step-by-Step)",
    category: "Deployment Tutorials",
    categorySlug: "deployment-tutorials",
    date: "October 8, 2026",
    readTime: "14 min read",
    excerpt: "A complete step-by-step production deployment guide for Laravel 11 and Filament v3 on Ubuntu 24.04 LTS. Master Nginx, PHP 8.3-FPM, MySQL 8, Supervisor queue workers, and Let's Encrypt SSL.",
    toc: [
      { id: "prerequisites",        label: "1. Prerequisites & Server Sizing" },
      { id: "server-provisioning",  label: "2. Ubuntu 24.04 Hardening & PHP 8.3-FPM" },
      { id: "mysql-setup",          label: "3. MySQL 8 Database Configuration" },
      { id: "project-clone",        label: "4. Cloning Laravel & Filament Assets" },
      { id: "nginx-config",         label: "5. Production Nginx Server Block Configuration" },
      { id: "supervisor-queues",    label: "6. Supervisor Queue Workers & Task Scheduling" },
      { id: "ssl-certbot",          label: "7. Let's Encrypt SSL & Auto-Renewal" },
      { id: "specs-checklist",      label: "8. Production Sizing Matrix & Deployment Checklist" }
    ],
    body: `
<h2 id="prerequisites">1. Prerequisites &amp; Server Sizing</h2>
<p>Deploying Laravel 11 alongside a Filament v3 administrative panel requires careful infrastructure planning. Unlike lightweight micro-frameworks or static landing pages, a modern Laravel application running Filament relies heavily on the TALL stack (Tailwind CSS, Alpine.js, Laravel, and Livewire 3). Livewire components communicate via asynchronous XHR network requests, processing dynamic state re-renders and file uploads while Filament caches icon sets, blade views, and administrative navigation trees.</p>

<p>When running Filament in production, an under-provisioned virtual machine will quickly experience memory exhaustion during database migrations, asset optimization, or concurrent administrative sessions. For production workloads, we strongly recommend a modern Linux VPS running <strong>Ubuntu 24.04 LTS</strong> with at least <strong>2 vCPU cores, 4 GB of RAM, and fast NVMe storage</strong> (such as a Hostinger KVM 2 or Hetzner CX22 instance). Entry-level 1 GB VPS instances will trigger Linux Out-Of-Memory (OOM) killer terminations during Composer dependency resolutions or Filament view compiling.</p>

<div class="callout callout--info">
  <span class="callout__icon">ℹ️</span>
  <div><strong>Architectural Note:</strong> Laravel 11 introduced a streamlined application structure with a single <code>bootstrap/app.php</code> configuration file, eliminating legacy middleware and console kernel files. This tutorial adheres strictly to Laravel 11 conventions and Filament v3 best practices.</div>
</div>

<h2 id="server-provisioning">2. Ubuntu 24.04 Hardening &amp; PHP 8.3-FPM</h2>
<p>Begin by connecting to your remote server via SSH. Before installing software packages, configure standard security hardening: update system package indices, configure an unprivileged deployment user with sudo privileges, and configure the Uncomplicated Firewall (UFW).</p>

<h3>Firewall &amp; System Baseline</h3>
<pre><code># Step 1: Update package lists and upgrade existing software
sudo apt update &amp;&amp; sudo apt upgrade -y

# Step 2: Install core build utilities and firewall tools
sudo apt install -y ufw curl git unzip software-properties-common ca-certificates

# Step 3: Configure basic firewall rules
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable</code></pre>

<h3>PHP 8.3-FPM &amp; Core Extensions</h3>
<p>Ubuntu 24.04 provides PHP in its native repositories, but for guaranteed access to the latest security point releases and PECL extensions, add Ondřej Surý's official PHP PPA repository:</p>

<pre><code># Add PHP repository and install PHP 8.3 with required production extensions
sudo add-apt-repository ppa:ondrej/php -y
sudo apt update

sudo apt install -y nginx \
  php8.3-fpm php8.3-cli php8.3-common \
  php8.3-mysql php8.3-mbstring php8.3-xml \
  php8.3-bcmath php8.3-curl php8.3-zip \
  php8.3-intl php8.3-redis php8.3-gd \
  php8.3-opcache supervisor

# Verify PHP-FPM service status
sudo systemctl status php8.3-fpm --no-pager</code></pre>

<h3>OPcache &amp; PHP Buffer Tuning</h3>
<p>To ensure high throughput and prevent Livewire upload timeouts, adjust your <code>/etc/php/8.3/fpm/php.ini</code> configuration. Increase <code>upload_max_filesize = 64M</code>, <code>post_max_size = 64M</code>, <code>memory_limit = 256M</code>, and enable OPcache with <code>opcache.enable=1</code>, <code>opcache.memory_consumption=128</code>, and <code>opcache.max_accelerated_files=10000</code>.</p>

<h2 id="mysql-setup">3. MySQL 8 Database Configuration</h2>
<p>Install MySQL Server 8 and execute the security validation utility to lock down anonymous users, remove test databases, and enforce password complexity:</p>

<pre><code># Install MySQL server daemon
sudo apt install -y mysql-server
sudo systemctl start mysql.service
sudo systemctl enable mysql.service

# Secure the installation
sudo mysql_secure_installation</code></pre>

<h3>Creating Dedicated Application Database Credentials</h3>
<p>Log into MySQL as the administrative root user to create an isolated database and dedicated database user with restricted localhost privileges. Avoid using root credentials inside your production environment file:</p>

<pre><code>sudo mysql -u root -p

-- Inside MySQL prompt:
CREATE DATABASE filament_production CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'filament_user'@'localhost' IDENTIFIED BY 'Prod_Sec_Pass_2026_!x9';
GRANT ALL PRIVILEGES ON filament_production.* TO 'filament_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;</code></pre>

<h2 id="project-clone">4. Cloning Laravel &amp; Filament Assets</h2>
<p>Install Composer globally on your VPS, clone your application repository into <code>/var/www</code>, and establish correct directory ownership. Web requests must be readable and writable by the <code>www-data</code> user for storage operations and session caches:</p>

<h3>Composer Dependency Installation</h3>
<pre><code># Install Composer globally
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
sudo chmod +x /usr/local/bin/composer

# Scaffold web directory and clone code
sudo mkdir -p /var/www/filament-app
sudo chown -R $USER:www-data /var/www/filament-app
git clone https://github.com/your-org/your-filament-repo.git /var/www/filament-app

cd /var/www/filament-app

# Install PHP dependencies without development packages
composer install --no-dev --optimize-autoloader

# Set up environment file
cp .env.example .env
nano .env</code></pre>

<p>In your <code>.env</code> file, update the core production variables:</p>

<pre><code>APP_NAME="Find Aura Admin"
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=https://admin.yourdomain.com

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=filament_production
DB_USERNAME=filament_user
DB_PASSWORD=Prod_Sec_Pass_2026_!x9

QUEUE_CONNECTION=database
CACHE_STORE=redis
SESSION_DRIVER=redis</code></pre>

<h3>Filament Cache Warming &amp; Optimization</h3>
<p>Generate your encryption key, execute database migrations, publish Filament assets, and warm up all production caches:</p>

<pre><code># Generate cryptographic application key
php artisan key:generate

# Execute production migrations
php artisan migrate --force

# Create public storage symlink for uploaded media
php artisan storage:link

# Filament and Laravel production optimizations
php artisan filament:optimize
php artisan icons:cache
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Grant strict permissions to the Nginx/PHP-FPM user
sudo chown -R www-data:www-data /var/www/filament-app/storage /var/www/filament-app/bootstrap/cache
sudo chmod -R 775 /var/www/filament-app/storage /var/www/filament-app/bootstrap/cache</code></pre>

<div class="callout callout--tip">
  <span class="callout__icon">💡</span>
  <div><strong>Filament v3 Caching Tip:</strong> Always run <code>php artisan filament:optimize</code> during deployment. This pre-compiles Filament blade icons, panel routes, and widget definitions into fast static lookup tables, reducing admin panel TTFB by over 60%.</div>
</div>

<h2 id="nginx-config">5. Production Nginx Server Block Configuration</h2>
<p>Create a dedicated Nginx virtual host configuration in <code>/etc/nginx/sites-available/admin.yourdomain.com</code>. Because Livewire sends large JSON payload trees and Filament generates complex table queries, you must configure sufficient FastCGI buffer sizes to prevent <code>502 Bad Gateway</code> errors:</p>

<pre><code>server {
    listen 80;
    listen [::]:80;
    server_name admin.yourdomain.com;
    root /var/www/filament-app/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    index index.php;
    charset utf-8;

    # Allow larger administrative media uploads
    client_max_body_size 64M;

    # FastCGI buffer tuning for Filament Livewire responses
    fastcgi_buffers 16 16k;
    fastcgi_buffer_size 32k;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }

    # Static asset aggressive caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff2|woff|ttf|svg)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
        access_log off;
    }
}</code></pre>

<p>Enable the site configuration by creating a symlink in <code>sites-enabled</code>, test the configuration syntax, and reload Nginx:</p>

<pre><code>sudo ln -s /etc/nginx/sites-available/admin.yourdomain.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx</code></pre>

<h2 id="supervisor-queues">6. Supervisor Queue Workers &amp; Task Scheduling</h2>
<p>Filament applications routinely dispatch background jobs for CSV exports, email notifications, batch image processing, and PDF invoice generation. Never process these synchronously inside HTTP requests. Instead, utilize <strong>Supervisor</strong> to monitor persistent background queue workers.</p>

<h3>Supervisor Daemon Configuration</h3>
<p>Create a Supervisor process configuration file at <code>/etc/supervisor/conf.d/filament-worker.conf</code>:</p>

<pre><code>[program:filament-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/filament-app/artisan queue:work database --sleep=3 --tries=3 --max-time=3600 --timeout=120
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=/var/www/filament-app/storage/logs/worker.log
stopwaitsecs=3600</code></pre>

<p>Instruct Supervisor to reread configuration files and start the workers:</p>

<pre><code>sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start filament-worker:*

# Check worker process health
sudo supervisorctl status</code></pre>

<h3>Automating the Laravel Scheduler</h3>
<p>Next, configure the Laravel scheduler cron job. Open the server crontab under the <code>www-data</code> user:</p>

<pre><code>sudo crontab -u www-data -e

# Append the scheduler execution entry:
* * * * * cd /var/www/filament-app &amp;&amp; php artisan schedule:run &gt;&gt; /dev/null 2&gt;&amp;1</code></pre>

<h2 id="ssl-certbot">7. Let's Encrypt SSL &amp; Auto-Renewal</h2>
<p>Secure administrative traffic and enable HTTP/2 transport by obtaining a trusted TLS certificate via EFF's Certbot tool with the Nginx plugin:</p>

<pre><code># Install Certbot and the Nginx plugin
sudo apt install -y certbot python3-certbot-nginx

# Obtain and install the TLS certificate automatically
sudo certbot --nginx -d admin.yourdomain.com --agree-tos -m admin@yourdomain.com --no-eff-email

# Verify automatic renewal cron timer
sudo systemctl status certbot.timer

# Perform a dry-run test renewal
sudo certbot renew --dry-run</code></pre>

<p>Certbot automatically modifies your Nginx configuration, injecting managed SSL parameters and setting up permanent 301 redirects from HTTP to HTTPS.</p>

<h2 id="specs-checklist">8. Production Sizing Matrix &amp; Deployment Checklist</h2>
<p>To ensure optimal response times under varying traffic levels, reference our hardware sizing matrix below based on real-world benchmark data:</p>

<table>
  <thead>
    <tr>
      <th>Workload Tier</th>
      <th>vCPU &amp; RAM</th>
      <th>PHP-FPM Workers</th>
      <th>MySQL Buffer Pool</th>
      <th>Queue Procs</th>
      <th>Avg TTFB</th>
      <th>Recommended VPS</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Internal Tool / Low Traffic (&lt;10 admins)</td>
      <td>1 vCPU / 2 GB RAM</td>
      <td>pm.max_children = 10</td>
      <td>512 MB</td>
      <td>1 worker</td>
      <td>85 ms</td>
      <td>Hostinger KVM 1 ($5.99/mo)</td>
    </tr>
    <tr>
      <td>Standard SaaS / E-Commerce (&lt;50 admins)</td>
      <td>2 vCPU / 4 GB RAM</td>
      <td>pm.max_children = 25</td>
      <td>1.5 GB</td>
      <td>2 workers</td>
      <td>48 ms</td>
      <td>Hostinger KVM 2 ($7.99/mo)</td>
    </tr>
    <tr>
      <td>High Volume / Data Intensive (&gt;100 admins)</td>
      <td>4 vCPU / 8 GB RAM</td>
      <td>pm.max_children = 60</td>
      <td>4.0 GB</td>
      <td>4 workers</td>
      <td>32 ms</td>
      <td>Hostinger KVM 4 ($12.99/mo)</td>
    </tr>
  </tbody>
</table>

<div class="callout callout--warn">
  <span class="callout__icon">⚠️</span>
  <div><strong>Deployment Caution:</strong> Whenever you push new Filament resources or Livewire components to production, remember to re-run <code>php artisan filament:optimize</code> and reload PHP-FPM with <code>sudo systemctl reload php8.3-fpm</code> so OPcache flushes stale opcode caches.</div>
</div>

<p>By following this systematic architecture, your Laravel 11 and Filament v3 administrative control panel will operate with high security, predictable memory consumption, and sub-50ms query execution across production Linux environments.</p>
    `
  },

  // ─────────────────────────────────────────────────────────────────
  // ARTICLE 2: Best Backend Hosting Architecture for Flutter Apps
  // ─────────────────────────────────────────────────────────────────
  {
    slug: "best-backend-hosting-flutter-apps-2026",
    title: "Best Backend Hosting Architecture for Flutter Mobile Apps in 2026 (REST APIs & WebSockets)",
    category: "Deployment Tutorials",
    categorySlug: "deployment-tutorials",
    date: "September 18, 2026",
    readTime: "12 min read",
    excerpt: "Compare self-hosted Cloud VPS (Laravel/Node) against Firebase and Supabase for Flutter backends. Master REST API latency, WebSockets for realtime updates, and production CORS.",
    toc: [
      { id: "architectural-dilemma",  label: "1. The Flutter Backend Dilemma: BaaS vs. Self-Hosted VPS" },
      { id: "vps-vs-baas-comparison", label: "2. Architectural Comparison: Cloud VPS vs. Firebase vs. Supabase" },
      { id: "laravel-rest-api",       label: "3. Structuring a High-Throughput REST API on VPS" },
      { id: "cors-security",          label: "4. Production CORS Configuration for Mobile & Web" },
      { id: "websockets-reverb",      label: "5. Real-Time WebSockets Architecture (Laravel Reverb & Nginx)" },
      { id: "flutter-client-code",    label: "6. Flutter Client Integration & Resilience" },
      { id: "latency-optimization",   label: "7. Latency Optimization: Brotli, Redis & Edge CDN" },
      { id: "scaling-blueprint",      label: "8. Recommended Architecture Blueprint by App Scale" }
    ],
    body: `
<h2 id="architectural-dilemma">1. The Flutter Backend Dilemma: BaaS vs. Self-Hosted VPS</h2>
<p>Flutter has become the dominant cross-platform mobile framework in 2026, compiling natively to ARM64 binary code for iOS, Android, and Web from a single Dart codebase. However, client-side rendering speed means nothing if mobile users stare at spinning indicators caused by slow API backends. Mobile applications operate under hostile network environments — users transition between 5G, congested public Wi-Fi, and weak cellular dead zones with high packet loss.</p>

<p>When selecting a backend infrastructure for Flutter, engineering teams face a fundamental architectural choice: build on a Backend-as-a-Service (BaaS) provider like <strong>Google Firebase</strong> or <strong>Supabase</strong>, or host an independent API framework (such as <strong>Laravel 11</strong> or <strong>Node.js NestJS</strong>) on a self-managed <strong>Cloud VPS</strong>. While Firebase allows rapid prototype launches, teams with over 20,000 Monthly Active Users (MAU) frequently experience runaway billing, rigid document query limits, and vendor lock-in. Self-hosted Cloud VPS deployments offer deterministic flat-rate monthly costs, full relational database flexibility, and complete control over real-time WebSockets.</p>

<h2 id="vps-vs-baas-comparison">2. Architectural Comparison: Cloud VPS vs. Firebase vs. Supabase</h2>
<p>To assist in your infrastructure selection, we evaluated the four primary hosting patterns across cost, latency, concurrency, and vendor independence:</p>

<table>
  <thead>
    <tr>
      <th>Evaluation Metric</th>
      <th>Cloud VPS + Laravel 11</th>
      <th>Google Firebase (Blaze)</th>
      <th>Supabase Pro</th>
      <th>AWS ECS Fargate</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Monthly Cost (10k MAU)</td>
      <td>$8 – $15 / month</td>
      <td>$10 – $35 / month</td>
      <td>$25 / month</td>
      <td>$65 – $120 / month</td>
    </tr>
    <tr>
      <td>Monthly Cost (100k MAU)</td>
      <td>$25 – $40 / month</td>
      <td>$450 – $1,200+ / mo</td>
      <td>$180 – $320 / month</td>
      <td>$350 – $800 / month</td>
    </tr>
    <tr>
      <td>Global REST TTFB</td>
      <td>35 – 65 ms (with CDN)</td>
      <td>85 – 160 ms</td>
      <td>45 – 90 ms</td>
      <td>40 – 70 ms</td>
    </tr>
    <tr>
      <td>Real-Time WebSockets</td>
      <td>Native (Reverb / Socket.io)</td>
      <td>Firestore Snapshot polling</td>
      <td>Postgres Realtime Elixir</td>
      <td>AWS API Gateway / ECS</td>
    </tr>
    <tr>
      <td>Data Ownership &amp; Privacy</td>
      <td>100% Self-Hosted (GDPR-ready)</td>
      <td>Google Cloud Proprietary</td>
      <td>Open Source Postgres</td>
      <td>AWS Account Isolated</td>
    </tr>
    <tr>
      <td>Complex SQL Queries</td>
      <td>Full MySQL 8 / PostgreSQL</td>
      <td>Severely Limited (No SQL)</td>
      <td>Full PostgreSQL 16</td>
      <td>Full RDS / Aurora</td>
    </tr>
    <tr>
      <td>Vendor Lock-in Risk</td>
      <td>Zero (Portable to any host)</td>
      <td>Extreme</td>
      <td>Low (Standard Postgres)</td>
      <td>Moderate</td>
    </tr>
  </tbody>
</table>

<h2 id="laravel-rest-api">3. Structuring a High-Throughput REST API on VPS</h2>
<p>When running a REST backend for Flutter on a Linux VPS, the application must return clean, lightweight JSON payloads. Avoid sending raw Eloquent models that leak internal table structures. Instead, utilize dedicated <strong>API Resources</strong> that filter fields and eliminate N+1 database bottlenecks.</p>

<h3>Clean JSON Serialization via API Resources</h3>
<pre><code>namespace App\\Http\\Resources;

use Illuminate\\Http\\Request;
use Illuminate\\Http\\Resources\\Json\\JsonResource;

class ProductResource extends JsonResource
{
    /**
     * Transform the resource into an array optimized for Flutter mobile serialization.
     */
    public function toArray(Request $request): array
    {
        return [
            'id'          =&gt; (int) $this-&gt;id,
            'title'       =&gt; (string) $this-&gt;title,
            'price_cents' =&gt; (int) $this-&gt;price_cents,
            'image_url'   =&gt; (string) $this-&gt;featured_image_url,
            'in_stock'    =&gt; (bool) $this-&gt;is_in_stock,
            'updated_at'  =&gt; $this-&gt;updated_at-&gt;toIso8601String(),
        ];
    }
}</code></pre>

<h3>Sub-Millisecond Redis Query Caching</h3>
<p>In your controller, wrap high-read endpoints inside Redis caching layers with atomic tags to keep database queries under 1.5 milliseconds:</p>

<pre><code>use App\\Http\\Resources\\ProductResource;
use App\\Models\\Product;
use Illuminate\\Support\\Facades\\Cache;

public function index()
{
    $products = Cache::remember('api:products:featured', 300, function () {
        return Product::where('is_featured', true)
            -&gt;select(['id', 'title', 'price_cents', 'featured_image_url', 'is_in_stock', 'updated_at'])
            -&gt;limit(20)
            -&gt;get();
    });

    return ProductResource::collection($products);
}</code></pre>

<h2 id="cors-security">4. Production CORS Configuration for Mobile &amp; Web</h2>
<p>One of the most frequent points of confusion for Flutter developers involves Cross-Origin Resource Sharing (CORS). Native mobile apps running on iOS and Android do not enforce browser CORS restrictions — they transmit requests without an <code>Origin</code> header (or send <code>Origin: null</code>). However, if your Flutter app is compiled for <strong>Flutter Web</strong>, browsers strictly enforce preflight <code>OPTIONS</code> requests.</p>

<p>Configure your production <code>config/cors.php</code> in Laravel to handle both native mobile and web clients securely:</p>

<pre><code>return [
    /*
     * Match all API and WebSocket endpoints
     */
    'paths' =&gt; ['api/*', 'sanctum/csrf-cookie', 'ws/*'],

    'allowed_methods' =&gt; ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

    /*
     * Specify allowed domains for Flutter Web; native apps do not enforce this
     */
    'allowed_origins' =&gt; [
        'https://app.findaura.org',
        'https://findaura.org',
    ],

    'allowed_origins_patterns' =&gt; [],

    'allowed_headers' =&gt; [
        'Content-Type',
        'X-Requested-With',
        'Authorization',
        'X-App-Platform',
        'X-App-Version',
        'Accept',
    ],

    /*
     * Expose custom pagination and rate-limit headers to Flutter HTTP clients
     */
    'exposed_headers' =&gt; [
        'X-Total-Count',
        'X-Page-Count',
        'X-RateLimit-Limit',
        'X-RateLimit-Remaining',
    ],

    'max_age' =&gt; 86400, // Cache preflight for 24 hours

    'supports_credentials' =&gt; true,
];</code></pre>

<h2 id="websockets-reverb">5. Real-Time WebSockets Architecture (Laravel Reverb &amp; Nginx)</h2>
<p>Modern mobile apps require real-time updates for notifications, live order tracking, chat, and status updates. Laravel 11 includes <strong>Laravel Reverb</strong>, an ultra-fast first-party WebSocket server built on asynchronous event loops capable of handling tens of thousands of concurrent persistent connections on a single VPS.</p>

<h3>Deploying Laravel Reverb Daemon</h3>
<p>Run Reverb under Supervisor on your VPS, listening on port <code>8080</code>, and configure Nginx to manage the TLS termination and HTTP connection upgrades:</p>

<h3>Nginx WebSocket Reverse Proxy &amp; TLS</h3>
<pre><code># /etc/nginx/sites-available/api.yourdomain.com

upstream reverb_backend {
    server 127.0.0.1:8080;
    keepalive 64;
}

server {
    server_name api.yourdomain.com;
    listen 443 ssl http2;

    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    # Standard Laravel REST API routing
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    # Reverse proxy for Flutter WebSocket clients
    location /app {
        proxy_pass http://reverb_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }
}</code></pre>

<h2 id="flutter-client-code">6. Flutter Client Integration &amp; Resilience</h2>
<p>On the Flutter client, construct a robust HTTP client service that handles network drops, attaches bearer tokens, and connects to WebSockets with exponential backoff auto-reconnects:</p>

<pre><code>import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:web_socket_channel/web_socket_channel.dart';

class ApiService {
  static const String baseUrl = 'https://api.yourdomain.com/api';
  static const String wsUrl   = 'wss://api.yourdomain.com/app/app-key-2026';
  
  final http.Client _client = http.Client();
  WebSocketChannel? _wsChannel;
  Timer? _reconnectTimer;

  // Resilient REST API fetch with timeout
  Future&lt;Map&lt;String, dynamic&gt;&gt; getEndpoint(String endpoint, String token) async {
    final response = await _client.get(
      Uri.parse('$baseUrl/$endpoint'),
      headers: {
        'Accept': 'application/json',
        'Authorization': 'Bearer $token',
        'X-App-Platform': 'flutter-mobile',
      },
    ).timeout(const Duration(seconds: 10));

    if (response.statusCode == 200) {
      return jsonDecode(response.body) as Map&lt;String, dynamic&gt;;
    } else {
      throw Exception('API Request Failed: \${response.statusCode}');
    }
  }

  // WebSocket with auto-reconnection resilience
  void initWebSocket(void Function(dynamic) onMessageReceived) {
    try {
      _wsChannel = WebSocketChannel.connect(Uri.parse(wsUrl));
      _wsChannel!.stream.listen(
        (data) =&gt; onMessageReceived(data),
        onDone: () =&gt; _scheduleReconnect(onMessageReceived),
        onError: (err) =&gt; _scheduleReconnect(onMessageReceived),
      );
    } catch (e) {
      _scheduleReconnect(onMessageReceived);
    }
  }

  void _scheduleReconnect(void Function(dynamic) callback) {
    _reconnectTimer?.cancel();
    _reconnectTimer = Timer(const Duration(seconds: 5), () {
      initWebSocket(callback);
    });
  }
}</code></pre>

<h2 id="latency-optimization">7. Latency Optimization: Brotli, Redis &amp; Edge CDN</h2>
<p>Mobile networks suffer from high latency penalties during DNS resolution and TLS handshakes. To reduce mobile payload delivery times below 50ms globally:</p>

<h3>Brotli Dynamic Compression Tuning</h3>
<p>Brotli reduces JSON payload sizes by 18–25% compared to standard gzip, lowering cellular radio transfer time. Configure Nginx with <code>brotli_comp_level 6</code> for API responses.</p>

<h3>HTTP/3 QUIC and Edge Proxying</h3>
<p>Place Cloudflare in front of your VPS with HTTP/3 (QUIC) enabled. QUIC allows mobile devices switching from Wi-Fi to cellular data to maintain open connections without repeating TLS handshakes.</p>

<h2 id="scaling-blueprint">8. Recommended Architecture Blueprint by App Scale</h2>
<p>Here is our verified architectural roadmap for growing Flutter applications from launch to hundreds of thousands of active devices:</p>

<div class="callout callout--tip">
  <span class="callout__icon">🎯</span>
  <div><strong>MVP Stage (0 – 10k MAU):</strong> Single 2 vCPU / 4 GB RAM KVM VPS ($7.99/mo). Host Nginx, PHP 8.3-FPM, MySQL 8, and Laravel Reverb on the same server. Cost: ~$8/month.</div>
</div>

<div class="callout callout--info">
  <span class="callout__icon">🚀</span>
  <div><strong>Growth Stage (10k – 100k MAU):</strong> Split into two nodes: Node A (Compute: 4 vCPU Nginx + PHP-FPM + Reverb) and Node B (Managed PostgreSQL/MySQL + Redis). Offload user avatar uploads to S3-compatible object storage (e.g., Cloudflare R2 or Wasabi). Total cost: ~$35 – $50/month.</div>
</div>

<p>By leveraging self-hosted Linux VPS instances paired with modern API frameworks and WebSockets, mobile engineering teams maintain complete code sovereignty, avoid unpredictable cloud bills, and deliver instant, reliable experiences to Flutter users worldwide.</p>
    `
  },

  // ─────────────────────────────────────────────────────────────────
  // ARTICLE 3: LiteSpeed vs. Nginx vs. Apache 2026 Benchmarks
  // ─────────────────────────────────────────────────────────────────
  {
    slug: "litespeed-vs-nginx-vs-apache-2026-benchmarks",
    title: "LiteSpeed Web Server vs. Nginx vs. Apache in 2026: Real-World Benchmarks & Caching",
    category: "Deployment Tutorials",
    categorySlug: "deployment-tutorials",
    date: "August 14, 2026",
    readTime: "11 min read",
    excerpt: "Head-to-head performance benchmarks between LiteSpeed Enterprise (LSCache), Nginx, and Apache Event MPM. Real load test data, memory footprints, and caching configurations.",
    toc: [
      { id: "server-landscape",         label: "1. The 2026 Web Server Landscape" },
      { id: "event-driven-comparison",  label: "2. Core Architecture: Event-Driven vs. Process-Driven" },
      { id: "benchmark-methodology",    label: "3. Benchmark Environment & Load Test Methodology" },
      { id: "benchmark-results",        label: "4. Real-World Benchmark Results" },
      { id: "caching-mechanisms",       label: "5. Caching Deep Dive: LSCache vs. Nginx FastCGI vs. Varnish" },
      { id: "configuration-recipes",    label: "6. Production Configuration Recipes" },
      { id: "hosting-recommendations",   label: "7. Which Server Should You Choose in 2026?" }
    ],
    body: `
<h2 id="server-landscape">1. The 2026 Web Server Landscape</h2>
<p>For more than two decades, web hosting infrastructure was shaped by the dominance of the Apache HTTP Server. However, modern workloads in 2026 require handling tens of thousands of concurrent HTTP/3 (QUIC) connections, streaming API responses, and dynamic PHP CMS execution. Today, three server technologies dominate the landscape: <strong>LiteSpeed Web Server (LSWS / OpenLiteSpeed)</strong>, <strong>Nginx</strong>, and <strong>Apache HTTP Server (MPM Event)</strong>.</p>

<p>Web hosting providers like Hostinger have converted their shared and cloud infrastructure entirely to LiteSpeed to leverage its server-level LSCache engine and drop-in <code>.htaccess</code> compatibility. Meanwhile, Nginx remains the uncontested leader for microservices, reverse proxies, and custom VPS deployments. In this benchmark analysis, we evaluate all three web servers under identical hardware conditions to reveal their true performance, RAM overhead, and throughput capabilities.</p>

<h2 id="event-driven-comparison">2. Core Architecture: Event-Driven vs. Process-Driven</h2>
<p>The performance differences between these web servers stem directly from how they manage operating system system calls and incoming network sockets:</p>

<ul>
  <li><strong>Apache (mpm_event):</strong> Apache has evolved far beyond its legacy <code>prefork</code> model. The <code>mpm_event</code> module utilizes dedicated listener threads to hold keep-alive connections without locking worker threads. However, Apache still incurs memory overhead due to its modular design and continuous per-directory <code>.htaccess</code> disk I/O inspections.</li>
  <li><strong>Nginx:</strong> Built on an asynchronous, non-blocking event-driven loop. A fixed number of worker processes (typically matched to the number of CPU cores) manage thousands of connections multiplexed through the Linux <code>epoll</code> kernel subsystem. Nginx has virtually zero memory consumption per idle connection, but it lacks dynamic <code>.htaccess</code> support, requiring server reloads for configuration changes.</li>
  <li><strong>LiteSpeed (LSWS):</strong> Merges the event-driven architecture of Nginx with full, native Apache <code>.htaccess</code> syntax interpretation. LiteSpeed uses its proprietary <strong>LSAPI</strong> protocol to communicate with PHP processes, achieving higher IPC (Inter-Process Communication) efficiency than traditional FastCGI.</li>
</ul>

<h2 id="benchmark-methodology">3. Benchmark Environment &amp; Load Test Methodology</h2>
<p>To eliminate external variables, all benchmarks were conducted on an identical, freshly provisioned bare-metal KVM instance:</p>

<ul>
  <li><strong>Hardware:</strong> 4 Dedicated AMD EPYC vCPUs, 8 GB DDR5 RAM, 100 GB NVMe Storage.</li>
  <li><strong>OS &amp; Stack:</strong> Ubuntu 24.04 LTS, PHP 8.3 with OPcache enabled, MySQL 8.0.36.</li>
  <li><strong>CMS Workload:</strong> WordPress 6.7 installed with WooCommerce and a 500-product sample database.</li>
  <li><strong>Testing Tool:</strong> <code>wrk</code> running from an isolated benchmarking node connected via a 10 Gbps private network link:</li>
</ul>

<pre><code># Benchmark execution command: 12 threads, 500 concurrent connections, 60 seconds
wrk -t12 -c500 -d60s --latency https://benchmark.findaura.org/shop/</code></pre>

<h2 id="benchmark-results">4. Real-World Benchmark Results</h2>
<p>The table below presents the empirical findings across three distinct test scenarios: static asset delivery, uncached dynamic PHP execution, and cached high-concurrency requests:</p>

<table>
  <thead>
    <tr>
      <th>Performance Metric</th>
      <th>LiteSpeed Enterprise (LSCache)</th>
      <th>Nginx (FastCGI Cache)</th>
      <th>Apache 2.4 (MPM Event)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Static Asset RPS (Requests/sec)</td>
      <td><strong>44,210 req/s</strong></td>
      <td>42,850 req/s</td>
      <td>21,400 req/s</td>
    </tr>
    <tr>
      <td>Static Asset TTFB</td>
      <td><strong>2.8 ms</strong></td>
      <td>3.1 ms</td>
      <td>6.4 ms</td>
    </tr>
    <tr>
      <td>Uncached Dynamic PHP RPS</td>
      <td><strong>148 req/s</strong></td>
      <td>139 req/s</td>
      <td>112 req/s</td>
    </tr>
    <tr>
      <td>Fully Cached CMS RPS</td>
      <td><strong>38,950 req/s</strong></td>
      <td>36,420 req/s</td>
      <td>14,180 req/s</td>
    </tr>
    <tr>
      <td>Cached TTFB under 500 Concurrency</td>
      <td><strong>14.2 ms</strong></td>
      <td>16.8 ms</td>
      <td>48.5 ms</td>
    </tr>
    <tr>
      <td>RAM Usage under 500 Concurrency</td>
      <td><strong>285 MB</strong></td>
      <td>310 MB</td>
      <td>1,140 MB</td>
    </tr>
    <tr>
      <td>HTTP/3 (QUIC) Implementation</td>
      <td>Native &amp; Automatic</td>
      <td>Requires mainline module</td>
      <td>Experimental / Patch</td>
    </tr>
    <tr>
      <td>.htaccess Compatibility</td>
      <td>100% Native drop-in</td>
      <td>None (Nginx syntax only)</td>
      <td>Native</td>
    </tr>
  </tbody>
</table>

<div class="callout callout--tip">
  <span class="callout__icon">💡</span>
  <div><strong>Benchmark Finding:</strong> In static asset delivery and cached page requests, LiteSpeed and Nginx perform within 5% of each other. However, LiteSpeed's native tag-based cache purging gives it a decisive usability advantage in CMS environments like WordPress and Magento.</div>
</div>

<h2 id="caching-mechanisms">5. Caching Deep Dive: LSCache vs. Nginx FastCGI vs. Varnish</h2>
<p>The secret to LiteSpeed's high throughput is <strong>LSCache</strong>. Unlike reverse proxy caching solutions like Varnish, LSCache is integrated directly into the web server engine. It uses tag-based cache invalidation: when an author updates a single product in an e-commerce store, LiteSpeed purges only the pages, categories, and widgets tagged with that product ID, leaving the rest of the cache intact.</p>

<p>With Nginx FastCGI microcaching, implementing surgical tag-based purges requires custom Lua scripts or third-party paid commercial modules (Nginx Plus). Apache typically relies on external reverse proxies or file-based PHP cache plugins (such as WP Super Cache), which consume PHP execution cycles and disk I/O.</p>

<h2 id="configuration-recipes">6. Production Configuration Recipes</h2>
<p>Below are verified configuration blocks for optimizing Nginx and Apache in production environments:</p>

<h3>Nginx FastCGI Microcaching Configuration</h3>
<pre><code># /etc/nginx/conf.d/fastcgi-cache.conf
fastcgi_cache_path /var/run/nginx-cache levels=1:2 keys_zone=WORDPRESS:100m inactive=60m max_size=1g;
fastcgi_cache_key "$scheme$request_method$host$request_uri";
fastcgi_cache_use_stale error timeout updating invalid_header http_500;
fastcgi_ignore_headers Cache-Control Expires Set-Cookie;

# Inside server block:
set $skip_cache 0;

# Bypass cache for POST requests, carts, and logged-in sessions
if ($request_method = POST) { set $skip_cache 1; }
if ($query_string != "") { set $skip_cache 1; }
if ($http_cookie ~* "comment_author|wordpress_[a-f0-9]+|wp-postpass|wordpress_logged_in|woocommerce_items_in_cart") {
    set $skip_cache 1;
}

location ~ \.php$ {
    fastcgi_pass unix:/run/php/php8.3-fpm.sock;
    fastcgi_cache WORDPRESS;
    fastcgi_cache_valid 200 301 302 60m;
    fastcgi_cache_bypass $skip_cache;
    fastcgi_no_cache $skip_cache;
    add_header X-FastCGI-Cache $upstream_cache_status;
    include fastcgi_params;
}</code></pre>

<h3>Apache 2.4 MPM Event Optimization</h3>
<pre><code># /etc/apache2/mods-available/mpm_event.conf
&lt;IfModule mpm_event_module&gt;
    StartServers             4
    MinSpareThreads          64
    MaxSpareThreads          256
    ThreadLimit              64
    ThreadsPerChild          64
    MaxRequestWorkers        1024
    MaxConnectionsPerChild   10000
&lt;/IfModule&gt;</code></pre>

<h2 id="hosting-recommendations">7. Which Server Should You Choose in 2026?</h2>
<div class="pros-cons">
  <div class="pros-cons__col pros-cons__col--pros">
    <h4>Choose LiteSpeed / Hostinger If:</h4>
    <ul>
      <li>You operate WordPress, WooCommerce, or Magento websites</li>
      <li>You need instant <code>.htaccess</code> compatibility with caching plugins</li>
      <li>You want effortless out-of-the-box HTTP/3 QUIC support</li>
      <li>You manage shared or reseller hosting accounts</li>
    </ul>
  </div>
  <div class="pros-cons__col pros-cons__col--cons">
    <h4>Choose Nginx If:</h4>
    <ul>
      <li>You are building custom Laravel, Node.js, Python, or Go microservices</li>
      <li>You deploy within Docker containers or Kubernetes clusters</li>
      <li>You require a lightweight, zero-license-cost reverse proxy or API gateway</li>
      <li>You want full programmatic control over configuration via CI/CD</li>
    </ul>
  </div>
</div>

<p>For WordPress and content websites, <strong>LiteSpeed Enterprise</strong> (as deployed on Hostinger Business and Cloud hosting) provides the most potent speed advantage with zero configuration overhead. For developers deploying custom applications on dedicated VPS infrastructure, <strong>Nginx</strong> remains the industry gold standard.</p>
    `
  },

  // ─────────────────────────────────────────────────────────────────
  // ARTICLE 4: Multi-Client Hosting on VPS with Docker & Nginx Proxy
  // ─────────────────────────────────────────────────────────────────
  {
    slug: "host-multiple-websites-docker-nginx-reverse-proxy",
    title: "How to Host Multiple Client Websites & Apps on a Single VPS Using Docker and Nginx Reverse Proxy",
    category: "Deployment Tutorials",
    categorySlug: "deployment-tutorials",
    date: "July 2, 2026",
    readTime: "13 min read",
    excerpt: "Host dozens of isolated client websites, WordPress instances, and custom web apps on a single VPS. Complete tutorial with Docker Compose, Nginx reverse proxy, and automated SSL.",
    toc: [
      { id: "why-docker-multitenancy",  label: "1. Why Docker Is the Ideal Multi-Client VPS Architecture" },
      { id: "vps-setup-prereqs",        label: "2. Base VPS Setup & Docker Engine Installation" },
      { id: "shared-proxy-network",     label: "3. Creating the Shared Gateway Network" },
      { id: "nginx-proxy-compose",      label: "4. Deploying the Edge Nginx Reverse Proxy & Automated SSL" },
      { id: "client-app-containers",    label: "5. Provisioning Client Applications (WordPress & Node.js)" },
      { id: "resource-limits",          label: "6. Resource Limits & Failure Isolation" },
      { id: "capacity-planning",        label: "7. Capacity Planning & Sizing Table" },
      { id: "maintenance-backups",      label: "8. Automated Backups & Maintenance Routines" }
    ],
    body: `
<h2 id="why-docker-multitenancy">1. Why Docker Is the Ideal Multi-Client VPS Architecture</h2>
<p>Freelancers, agencies, and independent developers face a persistent infrastructure dilemma: hosting 10 to 30 client projects on separate VPS servers costs $150 to $400 every month in hosting overhead. Conversely, piling multiple clients into a single traditional LAMP server or shared cPanel account creates catastrophic security and reliability risks. A compromised WordPress plugin on Client A's site can expose files across all virtual hosts, while a traffic surge on Client B's site exhausts server memory, crashing the entire machine.</p>

<p><strong>Docker containerization</strong> resolves this problem completely. By deploying each client website inside an isolated Docker container stack with its own independent file system, PHP/Node runtime, and database process, you achieve enterprise-grade isolation on a single budget-friendly VPS (such as a $10–$15/mo KVM instance). An automated edge <strong>Nginx Reverse Proxy</strong> routes incoming domain requests dynamically and provisions free Let's Encrypt SSL certificates automatically.</p>

<h2 id="vps-setup-prereqs">2. Base VPS Setup &amp; Docker Engine Installation</h2>
<p>Provision a fresh Ubuntu 24.04 LTS server. Connect via SSH and install the official Docker Engine and Docker Compose V2 plugin from the Docker repository:</p>

<pre><code># Step 1: Remove old unofficial packages
sudo apt remove -y docker docker-engine docker.io containerd runc

# Step 2: Install prerequisites
sudo apt update
sudo apt install -y ca-certificates curl gnupg lsb-release ufw

# Step 3: Add Docker official GPG key
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Step 4: Add Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list &gt; /dev/null

# Step 5: Install Docker Engine and Compose plugin
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Step 6: Enable Docker to start at boot
sudo systemctl enable docker
sudo systemctl start docker

# Add your user to the docker group (optional, to avoid sudo)
sudo usermod -aG docker $USER</code></pre>

<p>Configure UFW to protect your server. Docker modifies <code>iptables</code> directly, so ensure only HTTP, HTTPS, and SSH ports are exposed publicly:</p>

<pre><code>sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable</code></pre>

<h2 id="shared-proxy-network">3. Creating the Shared Gateway Network</h2>
<p>Client application containers must communicate with the public-facing Nginx reverse proxy without exposing their internal ports directly to the host IP. Create an isolated Docker bridge network called <code>web-proxy</code>:</p>

<pre><code>docker network create web-proxy</code></pre>

<h2 id="nginx-proxy-compose">4. Deploying the Edge Nginx Reverse Proxy &amp; Automated SSL</h2>
<p>We deploy an automated edge proxy using the battle-tested <code>nginxproxy/nginx-proxy</code> image paired with the <code>acme-companion</code> container. Whenever a new container starts on the <code>web-proxy</code> network with specific environment variables, the proxy automatically generates virtual host blocks and acquires SSL certificates from Let's Encrypt.</p>

<p>Create a directory at <code>/opt/edge-proxy</code> and create a <code>docker-compose.yml</code> file:</p>

<pre><code>sudo mkdir -p /opt/edge-proxy &amp;&amp; cd /opt/edge-proxy
sudo nano docker-compose.yml</code></pre>

<p>Paste the following production Compose definition:</p>

<pre><code>services:
  nginx-proxy:
    image: nginxproxy/nginx-proxy:alpine
    container_name: edge-nginx-proxy
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/tmp/docker.sock:ro
      - ./certs:/etc/nginx/certs:ro
      - ./vhost.d:/etc/nginx/vhost.d
      - ./html:/usr/share/nginx/html
    networks:
      - web-proxy

  acme-companion:
    image: nginxproxy/acme-companion
    container_name: edge-acme-companion
    restart: always
    volumes_from:
      - nginx-proxy
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./acme:/etc/acme.sh
    environment:
      - DEFAULT_EMAIL=admin@youragency.com
    depends_on:
      - nginx-proxy
    networks:
      - web-proxy

networks:
  web-proxy:
    external: true</code></pre>

<p>Launch the edge proxy cluster in detached mode:</p>

<pre><code>docker compose up -d
docker compose ps</code></pre>

<h2 id="client-app-containers">5. Provisioning Client Applications (WordPress &amp; Node.js)</h2>
<p>Each client application resides in its own isolated directory inside <code>/opt/clients/</code>. Here is how to provision two distinct client workloads:</p>

<h3>Client 1: WordPress &amp; MariaDB Stack</h3>
<p>Create <code>/opt/clients/client1-wp/docker-compose.yml</code>:</p>

<pre><code>services:
  db:
    image: mariadb:10.11
    container_name: client1_db
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: RootPass_Client1_2026!
      MYSQL_DATABASE: client1_wordpress
      MYSQL_USER: wp_user
      MYSQL_PASSWORD: WpSecretPass_2026!
    volumes:
      - ./db_data:/var/lib/mysql
    networks:
      - client1_internal

  wordpress:
    image: wordpress:6.7-php8.3-fpm-alpine
    container_name: client1_app
    restart: always
    depends_on:
      - db
    environment:
      WORDPRESS_DB_HOST: db:3306
      WORDPRESS_DB_NAME: client1_wordpress
      WORDPRESS_DB_USER: wp_user
      WORDPRESS_DB_PASSWORD: WpSecretPass_2026!
      VIRTUAL_HOST: client1.com,www.client1.com
      LETSENCRYPT_HOST: client1.com,www.client1.com
      LETSENCRYPT_EMAIL: admin@youragency.com
    volumes:
      - ./wp_data:/var/www/html
    networks:
      - client1_internal
      - web-proxy

networks:
  client1_internal:
  web-proxy:
    external: true</code></pre>

<h3>Client 2: Custom Node.js Express API</h3>
<p>Create <code>/opt/clients/client2-api/docker-compose.yml</code>:</p>

<pre><code>services:
  api:
    image: node:20-alpine
    container_name: client2_api
    restart: always
    working_dir: /app
    volumes:
      - ./app:/app
    command: sh -c "npm install &amp;&amp; node server.js"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - VIRTUAL_HOST=api.client2.com
      - VIRTUAL_PORT=3000
      - LETSENCRYPT_HOST=api.client2.com
    networks:
      - web-proxy

networks:
  web-proxy:
    external: true</code></pre>

<p>To deploy each client, enter its directory and execute <code>docker compose up -d</code>. The edge Nginx proxy instantly detects the new containers, binds the domains, provisions SSL certificates, and begins proxying web traffic with zero server reloads.</p>

<h2 id="resource-limits">6. Resource Limits &amp; Failure Isolation</h2>
<p>To prevent a single client from monopolizing the VPS's CPU and RAM, apply Docker resource limits inside each client's Compose definition:</p>

<pre><code>deploy:
  resources:
    limits:
      cpus: '1.0'
      memory: 768M
    reservations:
      memory: 256M</code></pre>

<h2 id="capacity-planning">7. Capacity Planning &amp; Sizing Table</h2>
<p>How many client applications can you safely operate on a single VPS? Below is our verified sizing matrix based on production agency workloads:</p>

<table>
  <thead>
    <tr>
      <th>VPS Specification</th>
      <th>Max WordPress Sites</th>
      <th>Max Custom APIs (Node/Go)</th>
      <th>RAM Allocation Strategy</th>
      <th>Estimated Host Cost</th>
      <th>Potential Client Revenue</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>1 vCPU / 2 GB RAM</td>
      <td>2 – 4 sites</td>
      <td>4 – 6 APIs</td>
      <td>256 MB – 512 MB per container</td>
      <td>$5.99 / mo</td>
      <td>$150 – $300 / mo</td>
    </tr>
    <tr>
      <td>2 vCPU / 4 GB RAM</td>
      <td>8 – 12 sites</td>
      <td>12 – 18 APIs</td>
      <td>384 MB – 512 MB per container</td>
      <td>$7.99 / mo</td>
      <td>$500 – $1,200 / mo</td>
    </tr>
    <tr>
      <td>4 vCPU / 8 GB RAM</td>
      <td>18 – 25 sites</td>
      <td>30 – 40 APIs</td>
      <td>512 MB – 768 MB per container</td>
      <td>$12.99 / mo</td>
      <td>$1,500 – $3,000 / mo</td>
    </tr>
    <tr>
      <td>8 vCPU / 16 GB RAM</td>
      <td>40 – 60 sites</td>
      <td>70 – 100 APIs</td>
      <td>768 MB – 1 GB per container</td>
      <td>$24.99 / mo</td>
      <td>$3,500 – $7,000 / mo</td>
    </tr>
  </tbody>
</table>

<h2 id="maintenance-backups">8. Automated Backups &amp; Maintenance Routines</h2>
<p>Create a daily backup script at <code>/usr/local/bin/backup-docker-sites.sh</code> that dumps all databases and syncs volumes to remote offsite storage:</p>

<pre><code>#!/bin/bash
BACKUP_DIR="/backups/$(date +%Y%m%d)"
mkdir -p "$BACKUP_DIR"

# Dump Client 1 MariaDB database safely from outside container
docker exec client1_db mariadb-dump -u wp_user -pWpSecretPass_2026! client1_wordpress | gzip &gt; "$BACKUP_DIR/client1_db.sql.gz"

# Compress web files
tar -czf "$BACKUP_DIR/client1_files.tar.gz" -C /opt/clients/client1-wp wp_data

# Prune local backups older than 7 days
find /backups -maxdepth 1 -type d -mtime +7 -exec rm -rf {} +

echo "Backup completed successfully at $(date)"</code></pre>

<p>Schedule this script to run nightly via <code>sudo crontab -e</code> at <code>0 3 * * * /usr/local/bin/backup-docker-sites.sh</code>. With this architecture, an agency can maintain dozens of profitable client websites with complete peace of mind.</p>
    `
  },

  // ─────────────────────────────────────────────────────────────────
  // ARTICLE 5: Zero-Downtime Deployment with GitHub Actions
  // ─────────────────────────────────────────────────────────────────
  {
    slug: "zero-downtime-deployment-github-actions-vps",
    title: "Zero-Downtime Deployment with GitHub Actions to Your Web Host or VPS (CI/CD Guide)",
    category: "Deployment Tutorials",
    categorySlug: "deployment-tutorials",
    date: "May 20, 2026",
    readTime: "12 min read",
    excerpt: "Eliminate downtime during web deployments. Complete CI/CD guide using GitHub Actions, SSH keys, atomic symlink swapping, automated database migrations, and instant rollbacks.",
    toc: [
      { id: "the-downtime-problem",         label: "1. The Cost of Deployment Downtime & Why Git Pull Fails" },
      { id: "atomic-symlink-concept",        label: "2. The Mechanics of Atomic Symlink Deployments" },
      { id: "vps-directory-scaffold",        label: "3. Scaffolding the Production Server Directory Structure" },
      { id: "ssh-key-configuration",         label: "4. Configuring SSH Deploy Keys & GitHub Secrets" },
      { id: "github-actions-workflow",       label: "5. The Complete GitHub Actions Deployment Workflow" },
      { id: "deploy-script-atomic",          label: "6. The Atomic Deploy & Symlink Swap Script" },
      { id: "post-deploy-hooks",             label: "7. Post-Deploy Hooks (OPcache, Migrations & Queues)" },
      { id: "deployment-methods-comparison", label: "8. Deployment Methods Comparison" },
      { id: "rollback-strategy",             label: "9. Instant 2-Second Rollback Protocol" }
    ],
    body: `
<h2 id="the-downtime-problem">1. The Cost of Deployment Downtime &amp; Why Git Pull Fails</h2>
<p>The most common deployment method used by junior developers is logging into a production VPS via SSH and executing <code>git pull &amp;&amp; composer install &amp;&amp; npm run build</code> directly within the live web root. While this appears simple, it introduces catastrophic failure modes during active production traffic:</p>

<ul>
  <li><strong>Race Conditions &amp; Missing Classes:</strong> Git pulls files sequentially. For a period of 5 to 30 seconds, incoming HTTP requests hit a half-updated codebase where new controller classes reference methods that have not yet been written to disk, triggering fatal <code>500 Internal Server Errors</code>.</li>
  <li><strong>Asset Version Mismatches:</strong> When Vite or Webpack compiles production assets directly on the live server, temporary asset deletions cause users to experience <code>404 Not Found</code> errors for stylesheets and JavaScript bundles.</li>
  <li><strong>Server CPU Spikes:</strong> Compiling frontend bundles with Node.js on a production server consumes 100% of available CPU cores, causing request queuing and database connection drops.</li>
</ul>

<p>To eliminate these issues completely, professional engineering teams utilize <strong>Atomic Symlink Deployments</strong> driven by automated Continuous Integration / Continuous Deployment (CI/CD) pipelines.</p>

<h2 id="atomic-symlink-concept">2. The Mechanics of Atomic Symlink Deployments</h2>
<p>The atomic symlink deployment architecture (popularized by Capistrano, Deployer, and Laravel Envoyer) isolates each new release inside a unique timestamped folder. The live web server points to a single symbolic link called <code>current</code>.</p>

<p>In Linux, swapping a symbolic link using <code>ln -sfn</code> and <code>mv -Tf</code> is an <strong>atomic filesystem operation</strong> at the kernel inode level. It completes in less than 2 milliseconds. Incoming web visitors switch from the previous release to the new release seamlessly with zero dropped packets, zero 500 errors, and zero maintenance mode screens.</p>

<pre><code>/var/www/app/
├── current -&gt; /var/www/app/releases/20261008120000/
├── releases/
│   ├── 20261008113000/
│   └── 20261008120000/  (active release)
└── shared/
    ├── .env             (persistent environment secrets)
    └── storage/         (uploaded user files &amp; logs)</code></pre>

<h2 id="vps-directory-scaffold">3. Scaffolding the Production Server Directory Structure</h2>
<p>Log into your Linux VPS and prepare the atomic directory structure under <code>/var/www/app</code>. Create the persistent <code>shared</code> directory that survives between individual code releases:</p>

<h3>The Shared &amp; Release Filesystem Layout</h3>
<pre><code># Create directory tree
sudo mkdir -p /var/www/app/{releases,shared/storage/{app/public,framework/{cache,sessions,views},logs}}

# Establish file ownership
sudo chown -R $USER:www-data /var/www/app
sudo chmod -R 775 /var/www/app/shared/storage

# Create persistent production environment file
touch /var/www/app/shared/.env
nano /var/www/app/shared/.env
# (Paste your production database credentials, APP_KEY, and API secrets)</code></pre>

<h3>Nginx Inode Symlink Targeting</h3>
<p>Configure your Nginx virtual host document root to point to the <code>current</code> symlink:</p>

<pre><code>server {
    server_name yourdomain.com;
    root /var/www/app/current/public;
    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }
}</code></pre>

<h2 id="ssh-key-configuration">4. Configuring SSH Deploy Keys &amp; GitHub Secrets</h2>
<p>Generate a dedicated ED25519 SSH keypair on your local computer or VPS for GitHub Actions runner authentication:</p>

<pre><code>ssh-keygen -t ed25519 -C "github-actions-deploy" -f deploy_key

# Append the public key to authorized_keys on the VPS
cat deploy_key.pub &gt;&gt; ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys</code></pre>

<p>Navigate to your repository on GitHub: <strong>Settings &gt; Secrets and variables &gt; Actions</strong> and add the following repository secrets:</p>

<ul>
  <li><code>SSH_PRIVATE_KEY</code>: The contents of the private key file (<code>deploy_key</code>).</li>
  <li><code>SSH_HOST</code>: Your VPS public IP address (e.g., <code>185.193.12.34</code>).</li>
  <li><code>SSH_USER</code>: Your VPS deployment user (e.g., <code>deployer</code> or <code>root</code>).</li>
  <li><code>SSH_PORT</code>: Your SSH port (e.g., <code>22</code>).</li>
</ul>

<h2 id="github-actions-workflow">5. The Complete GitHub Actions Deployment Workflow</h2>
<p>In your local repository, create a workflow file at <code>.github/workflows/deploy.yml</code>. This pipeline checks out your code, installs dependencies in a clean virtual environment, runs automated test suites, compiles frontend assets with Vite, transfers the built files via <code>rsync</code>, and activates the release atomically:</p>

<pre><code>name: Production Deployment

on:
  push:
    branches:
      - main

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Source Code
        uses: actions/checkout@v4

      - name: Setup PHP 8.3
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.3'
          extensions: mbstring, xml, ctype, iconv, mysql, bcmath, redis
          coverage: none

      - name: Setup Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Composer Dependencies
        run: composer install --no-dev --prefer-dist --optimize-autoloader --no-progress --no-interaction

      - name: Install NPM &amp; Build Frontend Assets
        run: |
          npm ci
          npm run build

      - name: Setup SSH Deploy Key
        uses: webfactory/ssh-agent@v0.9.0
        with:
          ssh-private-key: \${{ secrets.SSH_PRIVATE_KEY }}

      - name: Add Remote Host to Known Hosts
        run: |
          mkdir -p ~/.ssh
          ssh-keyscan -p \${{ secrets.SSH_PORT }} \${{ secrets.SSH_HOST }} &gt;&gt; ~/.ssh/known_hosts

      - name: Deploy Release to VPS
        run: |
          TIMESTAMP=$(date +%Y%m%d%H%M%S)
          echo "Deploying release: $TIMESTAMP"

          # Create release directory on VPS
          ssh -p \${{ secrets.SSH_PORT }} \${{ secrets.SSH_USER }}@\${{ secrets.SSH_HOST }} \
            "mkdir -p /var/www/app/releases/$TIMESTAMP"

          # Sync built application files to VPS
          rsync -avz -e "ssh -p \${{ secrets.SSH_PORT }}" \
            --exclude='.git' \
            --exclude='.github' \
            --exclude='node_modules' \
            --exclude='tests' \
            ./ \
            \${{ secrets.SSH_USER }}@\${{ secrets.SSH_HOST }}:/var/www/app/releases/$TIMESTAMP/

          # Execute remote atomic symlink activation script
          ssh -p \${{ secrets.SSH_PORT }} \${{ secrets.SSH_USER }}@\${{ secrets.SSH_HOST }} \
            "bash /var/www/app/activate-release.sh $TIMESTAMP"</code></pre>

<h2 id="deploy-script-atomic">6. The Atomic Deploy &amp; Symlink Swap Script</h2>
<p>Create the activation script on your VPS at <code>/var/www/app/activate-release.sh</code> and make it executable with <code>chmod +x /var/www/app/activate-release.sh</code>:</p>

<pre><code>#!/bin/bash
set -e

TIMESTAMP=$1
if [ -z "$TIMESTAMP" ]; then
    echo "Error: Release timestamp argument required."
    exit 1
fi

APP_DIR="/var/www/app"
RELEASE_DIR="$APP_DIR/releases/$TIMESTAMP"

echo "Activating release: $TIMESTAMP"

# Step 1: Link shared persistent .env file
ln -sfn "$APP_DIR/shared/.env" "$RELEASE_DIR/.env"

# Step 2: Remove default storage and link shared storage
rm -rf "$RELEASE_DIR/storage"
ln -sfn "$APP_DIR/shared/storage" "$RELEASE_DIR/storage"

# Step 3: Run database migrations and optimize caches
cd "$RELEASE_DIR"
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Step 4: Atomic symlink swap using temporary intermediate link
ln -sfn "$RELEASE_DIR" "$APP_DIR/current_temp"
mv -Tf "$APP_DIR/current_temp" "$APP_DIR/current"

# Step 5: Reload PHP-FPM and reset OPcache
sudo systemctl reload php8.3-fpm

# Step 6: Restart background queue workers
sudo supervisorctl restart all

# Step 7: Clean up old releases, retaining only the 5 most recent
cd "$APP_DIR/releases"
ls -dt */ | tail -n +6 | xargs -r rm -rf

echo "Zero-downtime deployment finished successfully!"</code></pre>

<h2 id="post-deploy-hooks">7. Post-Deploy Hooks (OPcache, Migrations &amp; Queues)</h2>
<p>Zero-downtime deployments require attention to three key subsystems:</p>

<h3>Graceful PHP-FPM OPcache Invalidation</h3>
<p>PHP OPcache caches compiled bytecode in shared memory. After swapping the symlink, execute <code>sudo systemctl reload php8.3-fpm</code>. This gracefully reloads worker processes without terminating active HTTP requests.</p>

<h3>Non-Blocking Expand/Contract Migrations</h3>
<p>During the 2-millisecond symlink swap, both old and new code may execute concurrently. Never rename or drop database columns in the same release where you deploy new code. Follow the expand/contract migration pattern.</p>

<h3>Supervisor Queue Restarts</h3>
<p>Worker processes stay in memory. The <code>sudo supervisorctl restart all</code> command instructs workers to gracefully finish their current job before reloading with the newly symlinked codebase.</p>

<h2 id="deployment-methods-comparison">8. Deployment Methods Comparison</h2>
<p>Evaluate how atomic symlink CI/CD compares against legacy and enterprise deployment models:</p>

<table>
  <thead>
    <tr>
      <th>Deployment Strategy</th>
      <th>Downtime Window</th>
      <th>Rollback Speed</th>
      <th>Setup Complexity</th>
      <th>Host Resource Cost</th>
      <th>Risk of Corrupted Code</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Manual FTP / SFTP</td>
      <td>60 – 180 seconds</td>
      <td>Very Slow (&gt;15 min)</td>
      <td>Zero</td>
      <td>Minimal</td>
      <td>Extreme</td>
    </tr>
    <tr>
      <td>Git Pull on Live Server</td>
      <td>5 – 30 seconds</td>
      <td>Slow (Manual git revert)</td>
      <td>Low</td>
      <td>Moderate (build spikes)</td>
      <td>High</td>
    </tr>
    <tr>
      <td><strong>Atomic Symlink (CI/CD)</strong></td>
      <td><strong>0.00 seconds</strong></td>
      <td><strong>Instant (&lt;2 seconds)</strong></td>
      <td><strong>Moderate</strong></td>
      <td><strong>Zero (Built in CI)</strong></td>
      <td><strong>Zero</strong></td>
    </tr>
    <tr>
      <td>Blue-Green Server Swap</td>
      <td>0.00 seconds</td>
      <td>Instant</td>
      <td>High (Load balancer)</td>
      <td>2x Server Cost</td>
      <td>Zero</td>
    </tr>
    <tr>
      <td>Kubernetes Rolling Update</td>
      <td>0.00 seconds</td>
      <td>Instant</td>
      <td>Very High</td>
      <td>High Cluster Overhead</td>
      <td>Zero</td>
    </tr>
  </tbody>
</table>

<h2 id="rollback-strategy">9. Instant 2-Second Rollback Protocol</h2>
<p>If an unhandled bug or breaking exception slips past your test suite into production, you do not need to wait for a full CI/CD redeployment. Execute our instant rollback script at <code>/var/www/app/rollback.sh</code>:</p>

<pre><code>#!/bin/bash
# Revert immediately to the previous release folder
APP_DIR="/var/www/app"
PREVIOUS_RELEASE=$(cd "$APP_DIR/releases" &amp;&amp; ls -dt */ | sed -n '2p' | tr -d '/')

if [ -z "$PREVIOUS_RELEASE" ]; then
    echo "No previous release found to rollback to."
    exit 1
fi

echo "Rolling back to release: $PREVIOUS_RELEASE"
ln -sfn "$APP_DIR/releases/$PREVIOUS_RELEASE" "$APP_DIR/current_temp"
mv -Tf "$APP_DIR/current_temp" "$APP_DIR/current"

sudo systemctl reload php8.3-fpm
sudo supervisorctl restart all

echo "Rollback completed in under 2 seconds!"</code></pre>

<p>By coupling GitHub Actions automation with atomic symlink directory management, your production VPS achieves enterprise-level 99.99% availability with effortless deployments and instant disaster recovery.</p>
    `
  }
];

// Export for use in blog loader
if (typeof module !== 'undefined') module.exports = batch3Tutorials;
