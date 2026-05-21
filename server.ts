import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import cors from "cors";

// Initialize DB
const db = new Database("paynode.db", { verbose: console.log });

// Boot schema
db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    category_id TEXT,
    title_ar TEXT NOT NULL,
    title_en TEXT NOT NULL,
    description_ar TEXT NOT NULL,
    description_en TEXT NOT NULL,
    image_type TEXT NOT NULL,
    image_path TEXT NOT NULL,
    video_type TEXT NOT NULL,
    video_path TEXT,
    cost_usd NUMERIC NOT NULL,
    margin_usd NUMERIC NOT NULL,
    secret_info TEXT,
    is_active INTEGER NOT NULL,
    has_warranty INTEGER NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    order_number TEXT NOT NULL UNIQUE,
    customer_name TEXT,
    customer_phone TEXT NOT NULL,
    user_email TEXT,
    total_usd NUMERIC NOT NULL,
    total_syp NUMERIC NOT NULL,
    exchange_rate_at_purchase NUMERIC NOT NULL,
    payment_method TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    price_usd_at_purchase NUMERIC NOT NULL
  );

  CREATE TABLE IF NOT EXISTS site_settings (
    id TEXT PRIMARY KEY,
    usd_to_syp_rate NUMERIC NOT NULL,
    is_syriatel_cash_active INTEGER NOT NULL,
    is_mtn_cash_active INTEGER NOT NULL,
    is_sham_cash_active INTEGER NOT NULL,
    is_usdt_active INTEGER NOT NULL,
    announcement_ar TEXT,
    announcement_en TEXT
  );

  CREATE TABLE IF NOT EXISTS analytics_logs (
    id TEXT PRIMARY KEY,
    ip_address TEXT,
    country TEXT,
    city TEXT,
    device_type TEXT NOT NULL,
    os_name TEXT NOT NULL,
    visited_page TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
`);

try {
  db.prepare('ALTER TABLE orders ADD COLUMN user_email TEXT').run();
} catch (e: any) {
  // Column might already exist
}

// Insert default settings if empty
const hasSettings = db.prepare('SELECT id FROM site_settings LIMIT 1').get();
if (!hasSettings) {
  db.prepare(`
    INSERT INTO site_settings (id, usd_to_syp_rate, is_syriatel_cash_active, is_mtn_cash_active, is_sham_cash_active, is_usdt_active, announcement_ar, announcement_en)
    VALUES ('settings-row', 15200, 1, 1, 1, 1, '🔥 عروض الصيف الكبرى من متجر باي نود! اشتراكات نتفلكس ويوتيوب بريميوم بخصم يصل لـ 50%! تسليم فوري وضمان كامل.', '🔥 Great Summer Deals from PayNode! Up to 50% discount on Netflix & YouTube. Secure payments & instant delivery.')
  `).run();
}

const hasAdmin = db.prepare("SELECT id FROM users WHERE role = 'admin'").get();
if (!hasAdmin) {
  db.prepare(`
    INSERT INTO users (id, email, password, role, created_at)
    VALUES ('admin-1', 'admin@paynode.com', 'admin123', 'admin', ?)
  `).run(new Date().toISOString());
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes
  
  // -- Auth & Users
  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare('SELECT id, email, role FROM users WHERE email = ? AND password = ?').get(email, password);
    if (user) {
      res.json({ success: true, user });
    } else {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
  });

  app.post("/api/auth/register", (req, res) => {
    const { email, password } = req.body;
    try {
      db.prepare('INSERT INTO users (id, email, password, role, created_at) VALUES (?, ?, ?, ?, ?)').run(
        `user-${Date.now()}`, email, password, 'user', new Date().toISOString()
      );
      res.json({ success: true, email });
    } catch (e: any) {
      if (e.message.includes('UNIQUE constraint')) {
        res.status(400).json({ success: false, error: 'Email already exists' });
      } else {
        res.status(500).json({ success: false, error: 'Registration failed' });
      }
    }
  });

  app.get("/api/users", (req, res) => {
    const users = db.prepare('SELECT id, email, password, role, created_at FROM users ORDER BY created_at DESC').all();
    res.json(users);
  });

  app.delete("/api/users/:id", (req, res) => {
    try {
      db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
      res.json({ success: true });
    } catch(err) {
      console.error(err);
      res.status(500).json({ success: false });
    }
  });

  // -- Categories
  app.get("/api/categories", (req, res) => {
    const cats = db.prepare('SELECT * FROM categories').all();
    res.json(cats);
  });
  app.post("/api/categories", (req, res) => {
    const { id, name_ar, name_en, slug } = req.body;
    db.prepare('INSERT OR REPLACE INTO categories (id, name_ar, name_en, slug) VALUES (?, ?, ?, ?)').run(id, name_ar, name_en, slug);
    res.json(req.body);
  });
  app.delete("/api/categories/:id", (req, res) => {
    db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // -- Products
  app.get("/api/products", (req, res) => {
    const products = db.prepare('SELECT * FROM products ORDER BY created_at DESC').all();
    // SQLite doesn't natively do boolean true/false well from 0/1 without mapping
    const mapped = products.map((p: any) => ({
      ...p,
      is_active: !!p.is_active,
      has_warranty: !!p.has_warranty
    }));
    res.json(mapped);
  });
  app.post("/api/products", (req, res) => {
    const { id, category_id, title_ar, title_en, description_ar, description_en, image_type, image_path, video_type, video_path, cost_usd, margin_usd, secret_info, is_active, has_warranty } = req.body;
    
    db.prepare(`
      INSERT OR REPLACE INTO products 
      (id, category_id, title_ar, title_en, description_ar, description_en, image_type, image_path, video_type, video_path, cost_usd, margin_usd, secret_info, is_active, has_warranty, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, category_id, title_ar, title_en, description_ar, description_en, image_type, image_path, video_type, video_path || null, cost_usd, margin_usd, secret_info || null, is_active ? 1 : 0, has_warranty ? 1 : 0, req.body.created_at || new Date().toISOString()
    );
    res.json(req.body);
  });
  app.delete("/api/products/:id", (req, res) => {
    db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // -- Settings
  app.get("/api/settings", (req, res) => {
    const s: any = db.prepare('SELECT * FROM site_settings LIMIT 1').get();
    if (s) {
      res.json({
        ...s,
        is_syriatel_cash_active: !!s.is_syriatel_cash_active,
        is_mtn_cash_active: !!s.is_mtn_cash_active,
        is_sham_cash_active: !!s.is_sham_cash_active,
        is_usdt_active: !!s.is_usdt_active
      });
    } else {
      res.status(404).json({ error: 'Settings not found' });
    }
  });
  app.post("/api/settings", (req, res) => {
    const { id, usd_to_syp_rate, is_syriatel_cash_active, is_mtn_cash_active, is_sham_cash_active, is_usdt_active, announcement_ar, announcement_en } = req.body;
    db.prepare(`
      INSERT OR REPLACE INTO site_settings 
      (id, usd_to_syp_rate, is_syriatel_cash_active, is_mtn_cash_active, is_sham_cash_active, is_usdt_active, announcement_ar, announcement_en)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, usd_to_syp_rate, is_syriatel_cash_active ? 1 : 0, is_mtn_cash_active ? 1 : 0, is_sham_cash_active ? 1 : 0, is_usdt_active ? 1 : 0, announcement_ar, announcement_en);
    res.json(req.body);
  });

  // -- Orders
  app.get("/api/orders/next-number", (req, res) => {
    try {
      const result = db.prepare('SELECT MAX(CAST(order_number AS INTEGER)) as max_num FROM orders').get();
      const maxNum = (result as any)?.max_num || 0;
      res.json({ next_number: maxNum + 1 });
    } catch(err) {
      res.json({ next_number: 1 });
    }
  });

  app.get("/api/orders", (req, res) => {
    const email = req.query.email as string;
    let orders;
    if (email && email !== 'admin@paynode.com') {
      orders = db.prepare('SELECT * FROM orders WHERE user_email = ? ORDER BY created_at DESC').all(email);
    } else {
      orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
    }
    const items = db.prepare('SELECT * FROM order_items').all();
    const products = db.prepare('SELECT * FROM products').all();

    const result = orders.map((ord: any) => {
      const ordItems = items.filter((i: any) => i.order_id === ord.id).map((i: any) => ({
        ...i,
        product: products.find((p: any) => p.id === i.product_id)
      }));
      return { ...ord, items: ordItems };
    });
    res.json(result);
  });
  
  app.post("/api/orders", (req, res) => {
    const { order, items } = req.body;
    
    db.transaction(() => {
      // Insert order
      db.prepare(`
        INSERT INTO orders (id, order_number, customer_name, customer_phone, user_email, total_usd, total_syp, exchange_rate_at_purchase, payment_method, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(order.id, order.order_number, order.customer_name || '', order.customer_phone, order.user_email || '', order.total_usd, order.total_syp, order.exchange_rate_at_purchase, order.payment_method, order.status, order.created_at || new Date().toISOString());

      // Insert items
      const stmt = db.prepare('INSERT INTO order_items (id, order_id, product_id, quantity, price_usd_at_purchase) VALUES (?, ?, ?, ?, ?)');
      for (const item of items) {
        stmt.run(item.id, item.order_id, item.product_id, item.quantity, item.price_usd_at_purchase);
      }
    })();
    
    res.json({ success: true, order, items });
  });

  app.put("/api/orders/:id/status", (req, res) => {
    const { status } = req.body;
    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/orders/:id", (req, res) => {
    try {
      db.prepare('DELETE FROM order_items WHERE order_id = ?').run(req.params.id);
      db.prepare('DELETE FROM orders WHERE id = ?').run(req.params.id);
      res.json({ success: true });
    } catch(err) {
      console.error(err);
      res.status(500).json({ success: false });
    }
  });

  // -- Analytics
  app.get("/api/analytics", (req, res) => {
    const logs = db.prepare('SELECT * FROM analytics_logs ORDER BY created_at DESC').all();
    res.json(logs);
  });
  
  app.post("/api/analytics", (req, res) => {
    const { id, ip_address, country, city, device_type, os_name, visited_page, created_at } = req.body;
    db.prepare(`
      INSERT INTO analytics_logs (id, ip_address, country, city, device_type, os_name, visited_page, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, ip_address || '', country || '', city || '', device_type, os_name, visited_page, created_at || new Date().toISOString());
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
