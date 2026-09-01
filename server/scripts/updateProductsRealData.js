// One-off script: replace placeholder text-on-color images with real, properly
// licensed food photos (sourced from Wikimedia Commons - no API key needed, CC/PD
// licensed), and update prices to realistic 2026 Cairo/Egypt EGP market rates.
// Researched reference points: cappuccino ~70 EGP, fast-food meal ~200 EGP,
// modern casual chain (Zooba) mains ~300-500 EGP, traditional koshari 25-80 EGP.
// "Bella Vista" is positioned as a modern casual restaurant & cafe, so pricing
// sits above street food / fast food and below fine dining (which runs 2000+ EGP/person).
//
// Also updates through the real PUT endpoints, which now regenerate each
// product's AI-search embedding as a side effect (see product.controller.js fix),
// backfilling the embeddings that were empty on the original seed.
//
// Usage: node scripts/updateProductsRealData.js   (run from server/ with dev server up)

import fs from "fs";
import path from "path";
import { env } from "../src/config/env.js";

const IMG_DIR =
  "D:/temp/claude/E--Iti-Projects-restaurant-system/e3c69f96-7ad4-4e87-bdfc-361de3170e1b/scratchpad/real-images";
const BASE_URL = `http://localhost:${env.port}`;
const ADMIN_EMAIL = "admin@bellavista.local";
const ADMIN_PASSWORD = "SeedAdmin123!";

// EGP prices grounded in real 2026 Cairo market research (see header).
const categoryUpdates = {
  "Coffee & Drinks": { query: "coffee cups cafe table" },
  "Pastries & Desserts": { query: "pastry display bakery counter" },
  Breakfast: { query: "breakfast plate table" },
  Appetizers: { query: "appetizer platter restaurant" },
  "Main Courses": { query: "restaurant plated main course dinner" },
  "Salads & Light Bites": { query: "fresh green salad bowl" },
};

const productUpdates = {
  "Coffee & Drinks": [
    { name: "Espresso", price: 55, query: "espresso shot cup" },
    { name: "Cappuccino", price: 75, query: "cappuccino cup latte art" },
    { name: "Caffe Latte", price: 80, query: "caffe latte cup latte art" },
    { name: "Iced Caramel Macchiato", price: 95, query: "iced caramel macchiato glass" },
    { name: "Fresh Mint Lemonade", price: 65, query: "mint lemonade glass" },
  ],
  "Pastries & Desserts": [
    { name: "Butter Croissant", price: 70, query: "butter croissant pastry" },
    { name: "New York Cheesecake", price: 130, query: "new york cheesecake slice" },
    { name: "Chocolate Fondant Cake", price: 140, query: "chocolate fondant molten cake" },
    { name: "Tiramisu", price: 145, query: "tiramisu dessert slice" },
    { name: "Almond Biscotti", price: 55, query: "biscotti almond cookies" },
  ],
  Breakfast: [
    { name: "Avocado Toast", price: 165, query: "avocado toast sourdough" },
    { name: "Eggs Benedict", price: 190, query: "eggs benedict hollandaise" },
    { name: "Classic Pancake Stack", price: 150, query: "pancake stack maple syrup" },
    { name: "Greek Yogurt Parfait", price: 120, query: "yogurt parfait berries granola" },
  ],
  Appetizers: [
    { name: "Bruschetta al Pomodoro", price: 135, query: "bruschetta tomato basil" },
    { name: "Crispy Calamari", price: 190, query: "fried calamari rings" },
    { name: "Stuffed Mushrooms", price: 160, query: "stuffed mushrooms appetizer" },
    { name: "Hummus & Pita", price: 120, query: "hummus pita bread" },
  ],
  "Main Courses": [
    { name: "Grilled Salmon Fillet", price: 420, query: "grilled salmon fillet plate" },
    { name: "Margherita Pizza", price: 230, query: "margherita pizza wood fired" },
    { name: "Fettuccine Alfredo", price: 260, query: "fettuccine alfredo pasta" },
    { name: "Herb-Roasted Chicken", price: 300, query: "roasted chicken herbs plate" },
    { name: "Beef Tenderloin Steak", price: 480, query: "beef tenderloin steak plate" },
  ],
  "Salads & Light Bites": [
    { name: "Caesar Salad", price: 170, query: "caesar salad bowl" },
    { name: "Mediterranean Salad", price: 180, query: "mediterranean salad bowl" },
    { name: "Quinoa & Roasted Veggie Bowl", price: 195, query: "quinoa roasted vegetable bowl" },
  ],
};

function log(msg) {
  console.log(`[update] ${msg}`);
}

const COMMONS_HEADERS = {
  "User-Agent": "BellaVista-Seed/1.0 (dev seed script; contact: admin@bellavista.local)",
};

async function commonsFetchJson(url, attempt = 1) {
  const res = await fetch(url, { headers: COMMONS_HEADERS });
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    if (attempt < 3) {
      await new Promise((r) => setTimeout(r, 1500 * attempt));
      return commonsFetchJson(url, attempt + 1);
    }
    throw new Error(`Commons API returned non-JSON (status ${res.status}): ${text.slice(0, 200)}`);
  }
}

async function commonsSearch(query) {
  const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
    query
  )}&srnamespace=6&format=json&srlimit=5`;
  const searchData = await commonsFetchJson(searchUrl);
  return (searchData.query?.search || []).filter((r) => /\.(jpe?g|png)$/i.test(r.title));
}

async function commonsImageUrl(query) {
  let candidates = await commonsSearch(query);
  if (!candidates.length) {
    // Fall back to a broader search using just the first couple of words.
    const broader = query.split(" ").slice(0, 2).join(" ");
    if (broader !== query) candidates = await commonsSearch(broader);
  }
  if (!candidates.length) throw new Error(`No Commons image found for "${query}"`);
  const title = candidates[0].title;

  const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(
    title
  )}&prop=imageinfo&iiprop=url&iiurlwidth=800&format=json`;
  const infoData = await commonsFetchJson(infoUrl);
  const page = Object.values(infoData.query.pages)[0];
  const url = page.imageinfo?.[0]?.thumburl || page.imageinfo?.[0]?.url;
  if (!url) throw new Error(`No image URL resolved for "${query}" (${title})`);
  return { url, title };
}

async function downloadImage(query, filename) {
  const filePath = path.join(IMG_DIR, filename);
  if (fs.existsSync(filePath)) return filePath;
  const { url, title } = await commonsImageUrl(query);
  const res = await fetch(url, { headers: COMMONS_HEADERS });
  if (!res.ok) throw new Error(`Failed to download image for "${query}": ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(IMG_DIR, { recursive: true });
  fs.writeFileSync(filePath, buf);
  log(`  fetched "${title}" for "${query}"`);
  return filePath;
}

async function login() {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  if (!res.ok) throw new Error(`Login failed: ${res.status} ${await res.text()}`);
  const setCookie = res.headers.getSetCookie ? res.headers.getSetCookie() : res.headers.raw?.()["set-cookie"];
  const cookies = (setCookie || []).map((c) => c.split(";")[0]).join("; ");
  log("Logged in as admin");
  return cookies;
}

async function main() {
  const cookies = await login();

  const categories = await (await fetch(`${BASE_URL}/api/categories`)).json();
  const products = await (await fetch(`${BASE_URL}/api/products`)).json();

  for (const cat of categories) {
    const cfg = categoryUpdates[cat.name];
    if (!cfg) continue;
    const filePath = await downloadImage(cfg.query, `cat-${cat.name.replace(/\W+/g, "-")}.jpg`);
    const fileBuf = fs.readFileSync(filePath);
    const form = new FormData();
    form.append("categoryImage", new Blob([fileBuf], { type: "image/jpeg" }), path.basename(filePath));
    const res = await fetch(`${BASE_URL}/api/categories/${cat._id}`, { method: "PUT", body: form });
    if (!res.ok) throw new Error(`Category "${cat.name}" image update failed: ${res.status} ${await res.text()}`);
    log(`Updated category image: ${cat.name}`);
  }

  for (const [catName, items] of Object.entries(productUpdates)) {
    log(`Updating products for "${catName}"`);
    for (const item of items) {
      const product = products.find((p) => p.name === item.name);
      if (!product) {
        log(`  WARNING: product "${item.name}" not found, skipping`);
        continue;
      }
      const filePath = await downloadImage(item.query, `prod-${item.name.replace(/\W+/g, "-")}.jpg`);
      const fileBuf = fs.readFileSync(filePath);
      const points = Math.max(5, Math.round(item.price / 10));
      const form = new FormData();
      form.append("basePrice", String(item.price));
      form.append("productPoints", String(points));
      form.append("productImage", new Blob([fileBuf], { type: "image/jpeg" }), path.basename(filePath));

      const res = await fetch(`${BASE_URL}/api/products/${product._id}`, {
        method: "PUT",
        headers: { Cookie: cookies },
        body: form,
      });
      if (!res.ok) throw new Error(`Product "${item.name}" update failed: ${res.status} ${await res.text()}`);
      const updated = await res.json();
      const hasEmbedding = Array.isArray(updated.embedding) && updated.embedding.length > 0;
      log(`  - ${item.name}: ${item.price} EGP, ${points} pts, embedding=${hasEmbedding ? "OK" : "MISSING"}`);
    }
  }

  log("Done.");
}

main().catch((err) => {
  console.error("[update] FAILED:", err);
  process.exit(1);
});
