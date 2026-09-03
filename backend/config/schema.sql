-- BREAK & DRIP — MySQL Schema
CREATE DATABASE IF NOT EXISTS break_drip CHARACTER SET utf8mb4;
USE break_drip;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('customer','admin') DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE addresses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  line1 VARCHAR(255) NOT NULL,
  line2 VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100),
  postal_code VARCHAR(20) NOT NULL,
  country VARCHAR(100) NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  slug VARCHAR(150) NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  compare_at_price DECIMAL(10,2),
  category_id INT,
  image_url VARCHAR(500),
  images_json JSON,
  drop_name VARCHAR(100),
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE product_variants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  size VARCHAR(20) NOT NULL,
  color VARCHAR(50) DEFAULT 'default',
  sku VARCHAR(100) UNIQUE,
  stock INT DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE cart_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  variant_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE,
  UNIQUE KEY unique_cart_line (user_id, variant_id)
);

CREATE TABLE wishlists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY unique_wish (user_id, product_id)
);

CREATE TABLE reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  user_id INT NOT NULL,
  rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE coupons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  discount_percent INT,
  discount_flat DECIMAL(10,2),
  max_uses INT,
  used_count INT DEFAULT 0,
  expires_at DATE,
  active BOOLEAN DEFAULT TRUE
);

CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  status ENUM('pending','paid','shipped','delivered','cancelled') DEFAULT 'pending',
  subtotal DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  coupon_code VARCHAR(50),
  razorpay_order_id VARCHAR(255),
  razorpay_payment_id VARCHAR(255),
  shipping_address_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (shipping_address_id) REFERENCES addresses(id)
);

CREATE TABLE order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  variant_id INT NOT NULL,
  product_name VARCHAR(150) NOT NULL,
  size VARCHAR(20),
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (variant_id) REFERENCES product_variants(id)
);

-- Seed data
INSERT INTO categories (name, slug) VALUES
('Hoodies','hoodies'), ('Tees','tees'), ('Outerwear','outerwear'), ('Bottoms','bottoms'), ('Accessories','accessories');

INSERT INTO products (name, slug, description, price, compare_at_price, category_id, image_url, drop_name, is_featured) VALUES
('Static Hoodie', 'static-hoodie', 'Heavyweight 480gsm fleece, boxy fit, embroidered chest logo.', 128.00, 160.00, 1, '/assets/static-hoodie.jpg', 'DROP 004', TRUE),
('Riot Tee', 'riot-tee', 'Oversized fit, garment-dyed, cracked print graphic.', 58.00, NULL, 2, '/assets/riot-tee.jpg', 'DROP 004', TRUE),
('Voidshell Jacket', 'voidshell-jacket', 'Water-resistant shell, taped seams, reflective hardware.', 240.00, NULL, 3, '/assets/voidshell-jacket.jpg', 'DROP 004', TRUE),
('Cargo Static Pants', 'cargo-static-pants', 'Ripstop cargo, adjustable ankle cuffs.', 138.00, NULL, 4, '/assets/cargo-static-pants.jpg', 'DROP 003', FALSE),
('Drip Beanie', 'drip-beanie', 'Ribbed knit, woven label patch.', 32.00, NULL, 5, '/assets/drip-beanie.jpg', 'DROP 003', FALSE);

INSERT INTO product_variants (product_id, size, color, sku, stock) VALUES
(1,'S','Black','SH-BLK-S',4),(1,'M','Black','SH-BLK-M',9),(1,'L','Black','SH-BLK-L',3),(1,'XL','Black','SH-BLK-XL',0),
(2,'S','White','RT-WHT-S',12),(2,'M','White','RT-WHT-M',15),(2,'L','White','RT-WHT-L',6),
(3,'M','Black','VJ-BLK-M',2),(3,'L','Black','VJ-BLK-L',5),
(4,'30','Olive','CSP-OLV-30',7),(4,'32','Olive','CSP-OLV-32',10),(4,'34','Olive','CSP-OLV-34',4),
(5,'One Size','Black','DB-BLK-OS',20);

INSERT INTO coupons (code, discount_percent, max_uses, expires_at, active) VALUES
('DRIP10', 10, 500, '2027-01-01', TRUE),
('BREAK20', 20, 100, '2027-01-01', TRUE);
