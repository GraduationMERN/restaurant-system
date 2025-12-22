import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium-min";
import { v2 as cloudinary } from "cloudinary";

// Remote Chromium URL for serverless environments (official Sparticuz release matching v143)
const CHROMIUM_REMOTE_URL = "https://github.com/Sparticuz/chromium/releases/download/v143.0.0/chromium-v143.0.0-pack.tar";

/**
 * Generates HTML template for the restaurant menu - Exact replica of the flyer design
 * @param {Array} products - Array of products from database
 * @param {Array} categories - Array of categories
 * @param {Object} restaurant - Restaurant settings including branding
 * @param {Object} options - Optional customization options
 * @returns {string} HTML string
 */
export function generateMenuHTML(products, categories, restaurant, options = {}) {
  const restaurantName = restaurant?.restaurantName || "Your Logo";
  const logoUrl = restaurant?.branding?.logoUrl || "";
  const phone = restaurant?.phone || "+1 604-257-7884";
  const address = restaurant?.address || "2143 Robson St\nVancouver, BC V6B 3K9";
  const accentColor = "#F97316"; // Orange color from the design

  // Group products by category
  const productsByCategory = {};
  categories.forEach(cat => {
    productsByCategory[cat._id.toString()] = {
      name: cat.name,
      name_ar: cat.name_ar,
      imgURL: cat.imgURL,
      products: []
    };
  });

  products.forEach(prod => {
    const catId = prod.categoryId?.toString() || prod.categoryId;
    if (productsByCategory[catId]) {
      productsByCategory[catId].products.push(prod);
    }
  });

  // Get all products flat for the layout
  const allProducts = products.slice(0, 20);
  const featuredProduct = allProducts.find(p => p.imgURL) || allProducts[0];
  
  // Get products for each section
  const favoriteFood = allProducts.slice(0, 8);
  const mainCourse = allProducts.slice(8, 12);
  const desserts = allProducts.slice(0, 4);
  const drinks = allProducts.slice(4, 7);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800;900&family=Poppins:wght@300;400;500;600;700;800&family=Dancing+Script:wght@400;500;600;700&family=Great+Vibes&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Poppins', sans-serif;
      background: #0d0d0d;
      color: #ffffff;
    }

    .menu-container {
      width: 800px;
      margin: 0 auto;
      background: #0d0d0d;
    }

    /* ======================= HERO SECTION ======================= */
    .hero-section {
      background: #0d0d0d;
      padding: 40px 40px 60px 40px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      position: relative;
      min-height: 380px;
    }

    .hero-left {
      display: flex;
      flex-direction: column;
    }

    .hero-image-wrapper {
      position: relative;
      width: 240px;
      height: 240px;
      margin-bottom: 20px;
    }

    .hero-image {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
      border: 6px solid ${accentColor};
    }

    .hero-image-placeholder {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
      border: 6px solid ${accentColor};
    }

    .qr-code {
      width: 60px;
      height: 60px;
      background: #ffffff;
      border-radius: 4px;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 8px;
      color: #000;
    }

    .address-box {
      background: #ffffff;
      color: #000000;
      padding: 10px 14px;
      border-radius: 4px;
      font-size: 10px;
      line-height: 1.5;
      max-width: 160px;
      margin-bottom: 16px;
    }

    .contact-label {
      font-size: 12px;
      color: #888888;
      margin-bottom: 4px;
    }

    .phone-number {
      font-size: 20px;
      font-weight: 700;
      color: ${accentColor};
      margin-bottom: 4px;
    }

    .website {
      font-size: 11px;
      color: #666666;
      margin-bottom: 12px;
    }

    .social-icons {
      display: flex;
      gap: 6px;
    }

    .social-icon {
      width: 26px;
      height: 26px;
      background: ${accentColor};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      color: #ffffff;
      font-weight: 600;
    }

    /* Hero Right */
    .hero-right {
      display: flex;
      flex-direction: column;
      padding-top: 10px;
    }

    .logo-section {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 20px;
    }

    .logo-icon {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      object-fit: cover;
    }

    .logo-placeholder {
      width: 36px;
      height: 36px;
      background: ${accentColor};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      color: #fff;
    }

    .brand-name-container {
      display: flex;
      flex-direction: column;
    }

    .brand-name {
      font-size: 11px;
      color: #ffffff;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .brand-tagline {
      font-size: 8px;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .todays-text {
      font-family: 'Poppins', sans-serif;
      font-size: 14px;
      color: ${accentColor};
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 3px;
      transform: rotate(-5deg);
      margin-bottom: -10px;
      margin-left: 5px;
    }

    .special-text {
      font-family: 'Great Vibes', cursive;
      font-size: 80px;
      color: ${accentColor};
      line-height: 0.9;
      margin-left: -5px;
    }

    .food-menu-text {
      font-family: 'Poppins', sans-serif;
      font-size: 38px;
      font-weight: 800;
      color: #ffffff;
      text-transform: uppercase;
      line-height: 1;
      letter-spacing: 2px;
      margin-top: -5px;
    }

    .limited-offer {
      font-family: 'Great Vibes', cursive;
      font-size: 26px;
      color: #ffffff;
      margin-top: 5px;
    }

    .offer-badge {
      position: absolute;
      bottom: 70px;
      right: 40px;
      background: ${accentColor};
      color: #ffffff;
      padding: 16px 20px;
      border-radius: 8px;
      max-width: 150px;
      text-align: center;
    }

    .offer-badge-text {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      line-height: 1.5;
      letter-spacing: 0.5px;
    }

    /* ======================= TORN PAPER TOP ======================= */
    .torn-paper-top {
      height: 35px;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 35' preserveAspectRatio='none'%3E%3Cpath d='M0,35 L0,15 Q30,0 60,15 T120,15 T180,15 T240,15 T300,15 T360,15 T420,15 T480,15 T540,15 T600,15 T660,15 T720,15 T780,15 T840,15 T900,15 T960,15 T1020,15 T1080,15 T1140,15 T1200,15 L1200,35 Z' fill='%23faf9f6'/%3E%3C/svg%3E");
      background-size: 100% 100%;
      background-repeat: no-repeat;
      margin-top: -1px;
    }

    /* ======================= MENU CONTENT ======================= */
    .menu-content {
      background: #faf9f6;
      padding: 30px 35px 35px 35px;
      color: #1a1a1a;
    }

    .menu-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 35px;
    }

    .menu-column-left {
      display: flex;
      flex-direction: column;
      gap: 25px;
    }

    .menu-column-right {
      display: flex;
      flex-direction: column;
      gap: 25px;
    }

    /* Section Title */
    .section-title {
      text-align: center;
      margin-bottom: 15px;
    }

    .section-title-text {
      font-family: 'Playfair Display', serif;
      font-size: 22px;
      font-weight: 700;
      color: #1a1a1a;
      text-transform: uppercase;
      letter-spacing: 2px;
      display: inline-block;
      position: relative;
    }

    .section-title-text::before,
    .section-title-text::after {
      content: '';
      position: absolute;
      top: 50%;
      width: 40px;
      height: 1px;
      background: #1a1a1a;
    }

    .section-title-text::before {
      right: 100%;
      margin-right: 15px;
    }

    .section-title-text::after {
      left: 100%;
      margin-left: 15px;
    }

    /* Products Grid 2 columns */
    .products-grid-2col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px 25px;
    }

    .product-item {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 10px;
    }

    .product-info {
      flex: 1;
    }

    .product-name {
      font-size: 11px;
      font-weight: 700;
      color: ${accentColor};
      text-transform: uppercase;
      margin-bottom: 2px;
      letter-spacing: 0.5px;
    }

    .product-desc {
      font-size: 8px;
      color: #666666;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .product-price {
      font-size: 12px;
      font-weight: 700;
      color: #1a1a1a;
      white-space: nowrap;
    }

    /* Main Course with images */
    .main-course-section {
      margin-top: 5px;
    }

    .main-course-title {
      font-family: 'Playfair Display', serif;
      font-size: 18px;
      font-weight: 700;
      color: #1a1a1a;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 15px;
      text-align: center;
    }

    .main-course-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
    }

    .main-course-item {
      text-align: center;
    }

    .main-course-image {
      width: 70px;
      height: 70px;
      border-radius: 50%;
      object-fit: cover;
      margin: 0 auto 8px auto;
      display: block;
      border: 2px solid #eee;
    }

    .main-course-placeholder {
      width: 70px;
      height: 70px;
      border-radius: 50%;
      background: linear-gradient(135deg, #f0f0f0 0%, #e0e0e0 100%);
      margin: 0 auto 8px auto;
      border: 2px solid #eee;
    }

    .main-course-name {
      font-size: 9px;
      font-weight: 700;
      color: ${accentColor};
      text-transform: uppercase;
      margin-bottom: 2px;
    }

    .main-course-price {
      font-size: 10px;
      font-weight: 700;
      color: #1a1a1a;
    }

    .main-course-desc {
      font-size: 7px;
      color: #888;
      line-height: 1.3;
    }

    /* Right Column - Desserts with image */
    .desserts-section {
      display: flex;
      gap: 15px;
    }

    .desserts-image {
      width: 130px;
      height: 130px;
      border-radius: 10px;
      object-fit: cover;
      flex-shrink: 0;
    }

    .desserts-image-placeholder {
      width: 130px;
      height: 130px;
      border-radius: 10px;
      background: linear-gradient(135deg, #f0f0f0 0%, #e0e0e0 100%);
      flex-shrink: 0;
    }

    .desserts-content {
      flex: 1;
    }

    .desserts-title {
      font-family: 'Playfair Display', serif;
      font-size: 18px;
      font-weight: 700;
      color: #1a1a1a;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 12px;
    }

    .desserts-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    /* Drinks Section */
    .drinks-section {
      margin-top: 5px;
    }

    .drinks-title {
      font-family: 'Playfair Display', serif;
      font-size: 18px;
      font-weight: 700;
      color: #1a1a1a;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 12px;
    }

    .drinks-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    /* Delivery Badge */
    .delivery-badge {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #ffffff;
      border: 2px solid ${accentColor};
      border-radius: 8px;
      padding: 12px 16px;
      margin-top: 15px;
      max-width: 180px;
      margin-left: auto;
    }

    .delivery-icon {
      width: 40px;
      height: 40px;
      background: ${accentColor};
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }

    .delivery-text-container {
      display: flex;
      flex-direction: column;
    }

    .delivery-free {
      font-size: 10px;
      font-weight: 700;
      color: ${accentColor};
      text-transform: uppercase;
    }

    .delivery-text {
      font-size: 14px;
      font-weight: 800;
      color: ${accentColor};
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    /* ======================= TORN PAPER BOTTOM ======================= */
    .torn-paper-bottom {
      height: 35px;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 35' preserveAspectRatio='none'%3E%3Cpath d='M0,0 L0,20 Q30,35 60,20 T120,20 T180,20 T240,20 T300,20 T360,20 T420,20 T480,20 T540,20 T600,20 T660,20 T720,20 T780,20 T840,20 T900,20 T960,20 T1020,20 T1080,20 T1140,20 T1200,20 L1200,0 Z' fill='%23faf9f6'/%3E%3C/svg%3E");
      background-size: 100% 100%;
      background-repeat: no-repeat;
      background-color: #0d0d0d;
    }

    /* Footer */
    .footer-section {
      background: #0d0d0d;
      padding: 25px 40px;
      text-align: center;
    }

    .footer-icons {
      display: flex;
      justify-content: center;
      gap: 60px;
      margin-bottom: 15px;
    }

    .footer-icon-item {
      text-align: center;
    }

    .footer-icon-circle {
      width: 45px;
      height: 45px;
      border: 1px solid #444;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 8px auto;
    }

    .footer-icon-circle svg {
      width: 20px;
      height: 20px;
      stroke: #888;
    }

    .footer-icon-text {
      font-size: 9px;
      color: #666;
      line-height: 1.3;
    }
  </style>
</head>
<body>
  <div class="menu-container">
    <!-- ======================= HERO SECTION ======================= -->
    <div class="hero-section">
      <div class="hero-left">
        <div class="hero-image-wrapper">
          ${featuredProduct?.imgURL 
            ? `<img src="${featuredProduct.imgURL}" alt="Featured" class="hero-image">`
            : `<div class="hero-image-placeholder"></div>`
          }
        </div>
        
        <div class="qr-code">
          <svg width="50" height="50" viewBox="0 0 50 50">
            <rect x="5" y="5" width="12" height="12" fill="#000"/>
            <rect x="33" y="5" width="12" height="12" fill="#000"/>
            <rect x="5" y="33" width="12" height="12" fill="#000"/>
            <rect x="20" y="20" width="10" height="10" fill="#000"/>
          </svg>
        </div>
        
        <div class="address-box">
          ${address.replace(/\\n/g, '<br>')}
        </div>
        
        <div class="contact-label">Contact Us:</div>
        <div class="phone-number">${phone}</div>
        <div class="website">www.yourwebsite.com</div>
        
        <div class="social-icons">
          <div class="social-icon">f</div>
          <div class="social-icon">𝕏</div>
          <div class="social-icon">in</div>
          <div class="social-icon">▶</div>
        </div>
      </div>
      
      <div class="hero-right">
        <div class="logo-section">
          ${logoUrl 
            ? `<img src="${logoUrl}" alt="Logo" class="logo-icon">`
            : `<div class="logo-placeholder">🍴</div>`
          }
          <div class="brand-name-container">
            <span class="brand-name">${restaurantName.toUpperCase()}</span>
            <span class="brand-tagline">YOURWEBSITE.COM</span>
          </div>
        </div>
        
        <div class="todays-text">TODAY'S</div>
        <div class="special-text">Special</div>
        <div class="food-menu-text">FOOD MENU</div>
        <div class="limited-offer">Limited Time Offer</div>
      </div>
      
      <div class="offer-badge">
        <div class="offer-badge-text">SPECIAL OFFER FOR ALL CUSTOMERS.<br>WE ARE OPEN 24 HOURS.</div>
      </div>
    </div>

    <!-- TORN PAPER TOP -->
    <div class="torn-paper-top"></div>

    <!-- ======================= MENU CONTENT ======================= -->
    <div class="menu-content">
      <div class="menu-grid">
        <!-- LEFT COLUMN -->
        <div class="menu-column-left">
          <!-- OUR FAVORITE FOOD -->
          <div>
            <div class="section-title">
              <span class="section-title-text">OUR<br>FAVORITE FOOD</span>
            </div>
            <div class="products-grid-2col">
              ${favoriteFood.map((product, i) => `
                <div class="product-item">
                  <div class="product-info">
                    <div class="product-name">${product.name || `FOOD NAME 0${i+1}`}</div>
                    <div class="product-desc">${product.desc || 'Lorem ipsum dolor sit amet consectetur adipiscing elit.'}</div>
                  </div>
                  <div class="product-price">$${product.basePrice?.toFixed(2) || '10.25'}</div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- MAIN COURSE -->
          <div class="main-course-section">
            <div class="main-course-title">MAIN COURSE</div>
            <div class="main-course-grid">
              ${(mainCourse.length > 0 ? mainCourse : [{}, {}, {}, {}]).map((product, i) => `
                <div class="main-course-item">
                  ${product.imgURL 
                    ? `<img src="${product.imgURL}" alt="${product.name || ''}" class="main-course-image">`
                    : `<div class="main-course-placeholder"></div>`
                  }
                  <div class="main-course-name">${product.name || `FOOD NAME 0${i+1}`}</div>
                  <div class="main-course-price">$${product.basePrice?.toFixed(2) || '10.25'}</div>
                  <div class="main-course-desc">${product.desc?.substring(0, 40) || 'Lorem ipsum dolor'}</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- RIGHT COLUMN -->
        <div class="menu-column-right">
          <!-- DESSERTS with image -->
          <div class="desserts-section">
            ${desserts[0]?.imgURL 
              ? `<img src="${desserts[0].imgURL}" alt="Desserts" class="desserts-image">`
              : `<div class="desserts-image-placeholder"></div>`
            }
            <div class="desserts-content">
              <div class="desserts-title">DESSERTS</div>
              <div class="desserts-list">
                ${desserts.map((product, i) => `
                  <div class="product-item">
                    <div class="product-info">
                      <div class="product-name">${product.name || `FOOD NAME 0${i+1}`}</div>
                      <div class="product-desc">${product.desc || 'Lorem ipsum dolor sit amet consectetur.'}</div>
                    </div>
                    <div class="product-price">$${product.basePrice?.toFixed(2) || '10.25'}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- DRINKS -->
          <div class="drinks-section">
            <div class="drinks-title">DRINKS</div>
            <div class="drinks-list">
              ${drinks.map((product, i) => `
                <div class="product-item">
                  <div class="product-info">
                    <div class="product-name">${product.name || `FOOD NAME 0${i+1}`}</div>
                    <div class="product-desc">${product.desc || 'Lorem ipsum dolor sit amet consectetur.'}</div>
                  </div>
                  <div class="product-price">$${product.basePrice?.toFixed(2) || '10.25'}</div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- DELIVERY BADGE -->
          <div class="delivery-badge">
            <div class="delivery-icon">🛵</div>
            <div class="delivery-text-container">
              <span class="delivery-free">FREE HOME</span>
              <span class="delivery-text">DELIVERY</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- TORN PAPER BOTTOM -->
    <div class="torn-paper-bottom"></div>

    <!-- FOOTER -->
    <div class="footer-section">
      <div class="footer-icons">
        <div class="footer-icon-item">
          <div class="footer-icon-circle">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
            </svg>
          </div>
          <div class="footer-icon-text">Well Organized<br>Layers and Groups</div>
        </div>
        <div class="footer-icon-item">
          <div class="footer-icon-circle">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
            </svg>
          </div>
          <div class="footer-icon-text">Fully<br>Editable</div>
        </div>
        <div class="footer-icon-item">
          <div class="footer-icon-circle">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
          </div>
          <div class="footer-icon-text">PSD File With<br>Smart object</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Converts HTML to PNG image using Puppeteer
 * @param {string} html - HTML content to render
 * @returns {Promise<Buffer>} PNG image buffer
 */
export async function htmlToImage(html) {
  // In production: use remote Chromium binary for serverless
  // In development: use local Chrome/Chromium
  // Render sets RENDER=true automatically, so we check for that too
  const isProduction = process.env.NODE_ENV === "production" || process.env.RENDER === "true";
  
  let executablePath;
  if (isProduction) {
    executablePath = await chromium.executablePath(CHROMIUM_REMOTE_URL);
  } else {
    // For local development - use local Chrome
    executablePath = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  }

  const browser = await puppeteer.launch({
    args: isProduction ? chromium.args : [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu"
    ],
    defaultViewport: chromium.defaultViewport,
    executablePath,
    headless: isProduction ? chromium.headless : true,
  });

  try {
    const page = await browser.newPage();
    
    await page.setViewport({
      width: 800,
      height: 1200,
      deviceScaleFactor: 2
    });

    await page.setContent(html, {
      waitUntil: ["load", "networkidle0"],
      timeout: 30000
    });

    await page.evaluate(() => document.fonts.ready);
    await new Promise(resolve => setTimeout(resolve, 1500));

    const bodyHandle = await page.$("body");
    const boundingBox = await bodyHandle.boundingBox();
    await bodyHandle.dispose();

    const screenshot = await page.screenshot({
      type: "png",
      clip: {
        x: 0,
        y: 0,
        width: 800,
        height: Math.ceil(boundingBox.height)
      }
    });

    return screenshot;
  } finally {
    await browser.close();
  }
}

/**
 * Uploads an image buffer to Cloudinary
 * @param {Buffer} buffer - Image buffer
 * @param {string} folder - Cloudinary folder name
 * @returns {Promise<string>} Cloudinary URL
 */
export async function uploadBufferToCloudinary(buffer, folder = "menu-images") {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        format: "png"
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result.secure_url);
        }
      }
    );

    uploadStream.end(buffer);
  });
}

/**
 * Parse prompt to extract theme options
 * @param {string} prompt - User prompt
 * @returns {Object} Theme options
 */
export function parsePromptOptions(prompt = "") {
  return { prompt };
}
