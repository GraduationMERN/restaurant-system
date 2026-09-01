// One-off seed script for a fresh, empty database.
// Usage: node scripts/seedRestaurant.js   (run from server/ with the dev server already running on PORT)
//
// Step 1 (direct DB, unavoidable): bootstrap one admin user + the single Restaurant
//   settings document. There is no public endpoint that can create either of these
//   on an empty database (register never grants admin safely here, and PUT /api/restaurant
//   404s until a document already exists), so this part talks to Mongoose directly.
// Step 2 (real HTTP calls against the running server): log in as that admin, then
//   create categories, products, and refine restaurant settings entirely through the
//   actual REST endpoints, including real Cloudinary image uploads.

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { env } from "../src/config/env.js";
import User from "../src/modules/user/model/User.js";
import Restaurant from "../src/modules/restaurant/restaurant.model.js";

const IMG_DIR =
  "D:/temp/claude/E--Iti-Projects-restaurant-system/e3c69f96-7ad4-4e87-bdfc-361de3170e1b/scratchpad/seed-images";

const BASE_URL = `http://localhost:${env.port}`;
const ADMIN_EMAIL = "admin@bellavista.local";
const ADMIN_PASSWORD = "SeedAdmin123!";

const categories = [
  { name: "Coffee & Drinks", name_ar: "قهوة ومشروبات", color: "6F4E37" },
  { name: "Pastries & Desserts", name_ar: "معجنات وحلويات", color: "D98CB3" },
  { name: "Breakfast", name_ar: "فطور", color: "F2B134" },
  { name: "Appetizers", name_ar: "مقبلات", color: "8FAF6B" },
  { name: "Main Courses", name_ar: "أطباق رئيسية", color: "B5451B" },
  { name: "Salads & Light Bites", name_ar: "سلطات ووجبات خفيفة", color: "6FA860" },
];

const productsByCategory = {
  "Coffee & Drinks": [
    { name: "Espresso", desc: "Rich, concentrated shot of our house-blend coffee beans.", price: 3.0, points: 5 },
    { name: "Cappuccino", desc: "Espresso topped with steamed milk and a thick layer of foam.", price: 4.5, points: 8 },
    { name: "Caffe Latte", desc: "Smooth espresso with steamed milk and a light layer of foam.", price: 4.75, points: 8 },
    { name: "Iced Caramel Macchiato", desc: "Espresso, vanilla syrup, cold milk, and a caramel drizzle over ice.", price: 5.25, points: 9 },
    { name: "Fresh Mint Lemonade", desc: "House-made lemonade blended with fresh mint leaves.", price: 4.0, points: 6 },
  ],
  "Pastries & Desserts": [
    { name: "Butter Croissant", desc: "Flaky, buttery classic French croissant baked fresh daily.", price: 3.75, points: 6 },
    { name: "New York Cheesecake", desc: "Creamy baked cheesecake on a buttery graham crust.", price: 6.0, points: 10 },
    { name: "Chocolate Fondant Cake", desc: "Warm chocolate cake with a molten center, served with vanilla ice cream.", price: 6.5, points: 11 },
    { name: "Tiramisu", desc: "Espresso-soaked ladyfingers layered with mascarpone cream.", price: 6.75, points: 11 },
    { name: "Almond Biscotti", desc: "Twice-baked Italian almond cookies, perfect with coffee.", price: 2.75, points: 4 },
  ],
  Breakfast: [
    { name: "Avocado Toast", desc: "Smashed avocado, chili flakes, and lemon on toasted sourdough.", price: 8.5, points: 14 },
    { name: "Eggs Benedict", desc: "Poached eggs and Canadian bacon on an English muffin with hollandaise.", price: 9.75, points: 16 },
    { name: "Classic Pancake Stack", desc: "Fluffy buttermilk pancakes served with maple syrup and butter.", price: 7.5, points: 13 },
    { name: "Greek Yogurt Parfait", desc: "Layers of Greek yogurt, honey, granola, and mixed berries.", price: 6.25, points: 10 },
  ],
  Appetizers: [
    { name: "Bruschetta al Pomodoro", desc: "Toasted baguette topped with fresh tomato, basil, and garlic.", price: 7.0, points: 12 },
    { name: "Crispy Calamari", desc: "Lightly fried calamari rings served with marinara and lemon.", price: 9.5, points: 16 },
    { name: "Stuffed Mushrooms", desc: "Button mushrooms filled with herbed cream cheese and breadcrumbs.", price: 8.0, points: 13 },
    { name: "Hummus & Pita", desc: "Creamy house-made hummus served with warm grilled pita.", price: 6.5, points: 11 },
  ],
  "Main Courses": [
    { name: "Grilled Salmon Fillet", desc: "Norwegian salmon grilled with lemon-butter sauce and seasonal vegetables.", price: 18.5, points: 30 },
    { name: "Margherita Pizza", desc: "Wood-fired pizza with San Marzano tomato, fresh mozzarella, and basil.", price: 12.0, points: 20 },
    { name: "Fettuccine Alfredo", desc: "Fettuccine pasta tossed in a creamy parmesan sauce.", price: 13.5, points: 22 },
    { name: "Herb-Roasted Chicken", desc: "Half chicken roasted with rosemary and thyme, served with roasted potatoes.", price: 15.0, points: 25 },
    { name: "Beef Tenderloin Steak", desc: "8oz tenderloin grilled to your liking, served with garlic mashed potatoes.", price: 22.0, points: 36 },
  ],
  "Salads & Light Bites": [
    { name: "Caesar Salad", desc: "Crisp romaine, parmesan, croutons, and classic Caesar dressing.", price: 8.5, points: 14 },
    { name: "Mediterranean Salad", desc: "Mixed greens, feta, olives, cucumber, and tomato with olive oil dressing.", price: 9.0, points: 15 },
    { name: "Quinoa & Roasted Veggie Bowl", desc: "Quinoa with roasted seasonal vegetables and a lemon-tahini dressing.", price: 10.0, points: 17 },
  ],
};

function log(msg) {
  console.log(`[seed] ${msg}`);
}

async function bootstrapDb() {
  await mongoose.connect(env.mongoUri, { dbName: env.dbName || "qr_restaurant" });
  log("Connected to MongoDB for bootstrap");

  let admin = await User.findOne({ email: ADMIN_EMAIL });
  if (!admin) {
    const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);
    admin = await User.create({
      name: "Admin",
      email: ADMIN_EMAIL,
      password: hashed,
      phoneNumber: "01000000000",
      role: "admin",
      isVerified: true,
    });
    log(`Created admin user: ${ADMIN_EMAIL}`);
  } else {
    log("Admin user already exists, reusing it");
  }

  let restaurant = await Restaurant.findOne();
  if (!restaurant) {
    restaurant = await Restaurant.create({
      restaurantName: "Bella Vista",
      description:
        "Bella Vista is a cozy restaurant and cafe serving handcrafted coffee, fresh pastries, and a seasonal Mediterranean-inspired menu made with locally sourced ingredients.",
      phone: "+1 234 567 890",
      address: "12 Ocean Drive, Downtown, Springfield",
      branding: { primaryColor: "#FF5733", secondaryColor: "#33C3FF" },
      support: { email: "support@bellavista.example", phone: "+1 234 567 891" },
      about: {
        title: "About Bella Vista",
        content:
          "Founded in 2015, Bella Vista blends the warmth of a neighborhood cafe with the care of a full-service restaurant. From your morning espresso to a candlelit dinner, we're here for every moment in between.",
      },
    });
    log("Created initial Restaurant settings document");
  } else {
    log("Restaurant settings document already exists, reusing it");
  }

  await mongoose.disconnect();
  log("Disconnected bootstrap DB connection");
}

async function downloadImage(text, color, filename) {
  const filePath = path.join(IMG_DIR, filename);
  if (fs.existsSync(filePath)) return filePath;
  const url = `https://placehold.co/600x400/${color}/FFFFFF.jpg?text=${encodeURIComponent(text)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download placeholder for ${text}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(IMG_DIR, { recursive: true });
  fs.writeFileSync(filePath, buf);
  return filePath;
}

async function login() {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  if (!res.ok) {
    throw new Error(`Login failed: ${res.status} ${await res.text()}`);
  }
  const setCookie = res.headers.getSetCookie ? res.headers.getSetCookie() : res.headers.raw?.()["set-cookie"];
  const cookies = (setCookie || []).map((c) => c.split(";")[0]).join("; ");
  log("Logged in as admin");
  return cookies;
}

async function createCategory(cat) {
  const filePath = await downloadImage(cat.name, cat.color, `cat-${cat.name.replace(/\W+/g, "-")}.jpg`);
  const fileBuf = fs.readFileSync(filePath);
  const form = new FormData();
  form.append("name", cat.name);
  form.append("name_ar", cat.name_ar);
  form.append("categoryImage", new Blob([fileBuf], { type: "image/jpeg" }), path.basename(filePath));

  const res = await fetch(`${BASE_URL}/api/categories`, { method: "POST", body: form });
  if (!res.ok) throw new Error(`Category "${cat.name}" failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  log(`Created category: ${cat.name} (${data._id})`);
  return data;
}

async function createProduct(product, categoryId, cookies) {
  const filePath = await downloadImage(product.name, product.color, `prod-${product.name.replace(/\W+/g, "-")}.jpg`);
  const fileBuf = fs.readFileSync(filePath);
  const form = new FormData();
  form.append("name", product.name);
  form.append("desc", product.desc);
  form.append("categoryId", categoryId);
  form.append("basePrice", String(product.price));
  form.append("stock", "50");
  form.append("productPoints", String(product.points));
  form.append("productImage", new Blob([fileBuf], { type: "image/jpeg" }), path.basename(filePath));

  const res = await fetch(`${BASE_URL}/api/products`, {
    method: "POST",
    headers: { Cookie: cookies },
    body: form,
  });
  if (!res.ok) throw new Error(`Product "${product.name}" failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  log(`  - ${product.name} ($${product.price})`);
  return data;
}

async function refineRestaurantSettings(cookies) {
  const current = await (await fetch(`${BASE_URL}/api/restaurant`)).json();
  const res = await fetch(`${BASE_URL}/api/restaurant`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Cookie: cookies },
    body: JSON.stringify({
      restaurantName: current.restaurantName,
      description: current.description,
      address: current.address,
      about: current.about,
    }),
  });
  if (!res.ok) {
    log(`Warning: restaurant PUT (translation refresh) returned ${res.status}, skipping`);
    return;
  }
  log("Refreshed restaurant settings via PUT (triggers Arabic auto-translation)");
}

async function main() {
  await bootstrapDb();

  const cookies = await login();

  const createdCategories = {};
  for (const cat of categories) {
    const created = await createCategory(cat);
    createdCategories[cat.name] = { id: created._id, color: cat.color };
  }

  for (const [catName, products] of Object.entries(productsByCategory)) {
    const { id, color } = createdCategories[catName];
    log(`Seeding products for "${catName}"`);
    for (const product of products) {
      await createProduct({ ...product, color }, id, cookies);
    }
  }

  await refineRestaurantSettings(cookies);

  log("Done. Admin login for future use:");
  log(`  email: ${ADMIN_EMAIL}`);
  log(`  password: ${ADMIN_PASSWORD}`);
}

main().catch((err) => {
  console.error("[seed] FAILED:", err);
  process.exit(1);
});
