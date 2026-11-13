const $ = (selector) => document.querySelector(selector);

let products = [];
let scanner = null;
let currentLang = "ar";


// =========================
// الترجمة
// =========================

const translations = {
  ar: {
    subtitle: "إدارة المنتجات وتواريخ الانتهاء",
    total: "إجمالي المنتجات",
    soon: "تنتهي خلال 5 أيام",
    expired: "منتهية",
    qty: "إجمالي الكمية",
    add: "➕ إضافة منتج",
    name: "اسم المنتج",
    quantity: "الكمية",
    expiry: "تاريخ الانتهاء",
    barcode: "الباركود / QR",
    image: "صورة المنتج",
    notes: "ملاحظات",
    save: "💾 حفظ المنتج",
    reset: "مسح الحقول",
    products: "📋 المنتجات",
    search: "بحث بالاسم أو الباركود",
    print: "🖨️ طباعة التقرير",
    scan: "📷 مسح Barcode / QR",
    scanTitle: "📷 مسح الباركود / QR",
    scanText: "وجّه الكاميرا نحو الباركود...",
    ocr: "🔍 قراءة تاريخ الانتهاء من الصورة",
    valid: "صالح",
    soonStatus: "قريب الانتهاء",
    expiredStatus: "منتهي",
    noProducts: "لا توجد منتجات.",
    deleteConfirm: "هل تريد حذف المنتج؟",
    found: "تم العثور على المنتج.",
    barcodeRead: "تمت قراءة الباركود:",
    ocrReading: "جاري قراءة تاريخ الانتهاء...",
    ocrDone: "تمت قراءة التاريخ.",
    ocrFailed: "لم أتمكن من قراءة التاريخ. حاول تصوير التاريخ بوضوح.",
    saved: "تم حفظ المنتج بنجاح.",
    updated: "تم تحديث المنتج بنجاح.",
    deleted: "تم حذف المنتج.",
    notifications: "🔔 التنبيهات",
    notificationTitle: "فحص الصلاحية",
    notificationBody: "سيتم تنبيهك بالمنتجات القريبة من الانتهاء."
  },

  en: {
    subtitle: "Manage products and expiry dates",
    total: "Total products",
    soon: "Expiring within 5 days",
    expired: "Expired",
    qty: "Total quantity",
    add: "➕ Add Product",
    name: "Product name",
    quantity: "Quantity",
    expiry: "Expiry date",
    barcode: "Barcode / QR",
    image: "Product image",
    notes: "Notes",
    save: "💾 Save Product",
    reset: "Clear fields",
    products: "📋 Products",
    search: "Search by name or barcode",
    print: "🖨️ Print report",
    scan: "📷 Scan Barcode / QR",
    scanTitle: "📷 Scan Barcode / QR",
    scanText: "Point the camera at the barcode...",
    ocr: "🔍 Read expiry date from image",
    valid: "Valid",
    soonStatus: "Expiring soon",
    expiredStatus: "Expired",
    noProducts: "No products.",
    deleteConfirm: "Delete this product?",
    found: "Product found.",
    barcodeRead: "Barcode detected:",
    ocrReading: "Reading expiry date...",
    ocrDone: "Date detected.",
    ocrFailed: "Could not read the date. Try taking a clearer photo.",
    saved: "Product saved successfully.",
    updated: "Product updated successfully.",
    deleted: "Product deleted.",
    notifications: "🔔 Notifications",
    notificationTitle: "Expiry Check",
    notificationBody: "You will be notified about products nearing expiry."
  }
};


// =========================
// التاريخ
// =========================

function today() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}


function diffDays(dateString) {

  const expiry = new Date(
    dateString + "T23:59:59"
  );

  const now = new Date();

  return Math.ceil(
    (expiry - now) / 86400000
  );
}


// =========================
// تحميل المنتجات
// =========================

async function loadProducts() {

  try {

    const response = await fetch("/api/products");

    if (!response.ok) {
      throw new Error("Failed to load products");
    }

    products = await response.json();

    render();

  } catch (error) {

    console.error(error);

    $("#products").innerHTML = `
      <div class="alert">
        ⚠️ تعذر تحميل المنتجات.
      </div>
    `;
  }
}


// =========================
// عرض المنتجات
// =========================

function render() {

  const searchValue =
    $("#search").value.trim().toLowerCase();


  const filtered = products.filter(product => {

    const text = `
      ${product.name || ""}
      ${product.barcode || ""}
    `.toLowerCase();

    return text.includes(searchValue);
  });


  // الإحصائيات

  $("#total").textContent =
    products.length;


  $("#soon").textContent =
    products.filter(product => {

      const d = diffDays(product.expiry_date);

      return d >= 0 && d <= 5;

    }).length;


  $("#expired").textContent =
    products.filter(product => {

      return diffDays(product.expiry_date) < 0;

    }).length;


  $("#qty").textContent =
    products.reduce(
      (sum, product) =>
        sum + Number(product.quantity || 0),
      0
    );


  // التنبيهات

  const soonProducts =
    products.filter(product => {

      const d =
        diffDays(product.expiry_date);

      return d >= 0 && d <= 5;

    });


  if (soonProducts.length) {

    $("#alerts").innerHTML =
      soonProducts.map(product => {

        const days =
          diffDays(product.expiry_date);

        return `
          <div class="alert">
            ⚠️
            <b>${escapeHTML(product.name)}</b>

            —
            ${days === 0
              ? "ينتهي اليوم"
              : `ينتهي خلال ${days} يوم`}

            (${product.expiry_date})
          </div>
        `;

      }).join("");

  } else {

    $("#alerts").innerHTML = "";

  }


  // المنتجات

  if (!filtered.length) {

    $("#products").innerHTML =
      `<p>${translations[currentLang].noProducts}</p>`;

    return;
  }


  $("#products").innerHTML =
    filtered.map(productCard).join("");
}


// =========================
// بطاقة المنتج
// =========================

function productCard(product) {

  const days =
    diffDays(product.expiry_date);


  let statusClass =
    "ok";

  let statusText =
    translations[currentLang].valid;


  if (days < 0) {

    statusClass = "expired";

    statusText =
      translations[currentLang].expiredStatus;

  } else if (days <= 5) {

    statusClass = "soon";

    statusText =
      translations[currentLang].soonStatus;
  }


  const image =
    product.image_key
      ? `/images/${encodeURIComponent(product.image_key)}`
      : `
        data:image/svg+xml,
        %3Csvg xmlns='http://www.w3.org/2000/svg'
        width='100' height='100'%3E
        %3Crect width='100%25'
        height='100%25'
        fill='%23e8edf3'/%3E
        %3C/svg%3E
      `;


  return `
    <article class="product">

      <img
        src="${image}"
        alt="${escapeHTML(product.name)}">

      <div>

        <h3>
          ${escapeHTML(product.name)}
        </h3>

        <div class="meta">

          <span>
            📦 ${product.quantity}
          </span>

          <span>
            📅 ${product.expiry_date}
          </span>

          ${
            product.barcode
              ? `
                <span>
                  ▣ ${escapeHTML(product.barcode)}
                </span>
              `
              : ""
          }

        </div>

        ${
          product.notes
            ? `
              <p>
                📝 ${escapeHTML(product.notes)}
              </p>
            `
            : ""
        }

      </div>


      <div>

        <span class="status ${statusClass}">
          ${statusText}
        </span>


        <div
          class="actions"
          style="margin-top:8px">

          <button
            class="secondary"
            onclick="editProduct(${product.id})">

            تعديل

          </button>


          <button
            class="secondary"
            onclick="deleteProduct(${product.id})">

            حذف

          </button>

        </div>

      </div>

    </article>
  `;
}


// =========================
// حماية النص
// =========================

function escapeHTML(value) {

  return String(value ?? "")
    .replace(/[&<>"']/g, char => {

      const map = {

        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"

      };

      return map[char];
    });
}


// =========================
// حفظ المنتج
// =========================

$("#productForm")
  .addEventListener("submit", async event => {

    event.preventDefault();


    const id =
      $("#id").value;


    let imageKey = null;


    // الاحتفاظ بالصورة القديمة عند التعديل

    const oldProduct =
      products.find(
        p => String(p.id) === String(id)
      );


    if (oldProduct) {

      imageKey =
        oldProduct.image_key || null;

    }


    // رفع صورة جديدة

    const imageFile =
      $("#image").files[0];


    if (imageFile) {

      const formData =
        new FormData();

      formData.append(
        "image",
        imageFile
      );


      const imageResponse =
        await fetch(
          "/api/images",
          {
            method: "POST",
            body: formData
          }
        );


      const imageData =
        await imageResponse.json();


      if (!imageResponse.ok) {

        alert(
          imageData.error ||
          "فشل رفع الصورة"
        );

        return;
      }


      imageKey =
        imageData.key;
    }


    const body = {

      name:
        $("#name").value.trim(),

      quantity:
        Number($("#quantity").value || 0),

      expiry_date:
        $("#expiry").value,

      barcode:
        $("#barcode").value.trim(),

      image_key:
        imageKey,

      notes:
        $("#notes").value.trim()
    };


    if (!body.name ||
        !body.expiry_date) {

      alert(
        "اكتب اسم المنتج وتاريخ الانتهاء"
      );

      return;
    }


    const url =
      id
        ? `/api/products/${id}`
        : "/api/products";


    const method =
      id ? "PUT" : "POST";


    const response =
      await fetch(
        url,
        {
          method,
          headers: {
            "content-type":
              "application/json"
          },
          body:
            JSON.stringify(body)
        }
      );


    const data =
      await response.json();


    if (!response.ok) {

      alert(
        data.error ||
        "حدث خطأ أثناء الحفظ"
      );

      return;
    }


    alert(
      id
        ? translations[currentLang].updated
        : translations[currentLang].saved
    );


    resetForm();

    await loadProducts();

  });


// =========================
// مسح الحقول
// =========================

function resetForm() {

  $("#productForm").reset();

  $("#id").value = "";

  $("#quantity").value = 1;

  $("#preview").innerHTML = "";

  $("#ocrStatus").textContent = "";

  $("#saveBtn").textContent =
    translations[currentLang].save;
}


$("#resetBtn")
  .addEventListener(
    "click",
    resetForm
  );


// =========================
// تعديل المنتج
// =========================

window.editProduct = function(id) {

  const product =
    products.find(
      p => Number(p.id) === Number(id)
    );


  if (!product) return;


  $("#id").value =
    product.id;

  $("#name").value =
    product.name || "";

  $("#quantity").value =
    product.quantity || 0;

  $("#expiry").value =
    product.expiry_date || "";

  $("#barcode").value =
    product.barcode || "";

  $("#notes").value =
    product.notes || "";


  $("#saveBtn").textContent =
    currentLang === "ar"
      ? "💾 تحديث المنتج"
      : "💾 Update Product";


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
};


// =========================
// حذف المنتج
// =========================

window.deleteProduct =
  async function(id) {

    if (
      !confirm(
        translations[currentLang].deleteConfirm
      )
    ) {

      return;
    }


    const response =
      await fetch(
        `/api/products/${id}`,
        {
          method: "DELETE"
        }
      );


    if (!response.ok) {

      alert("فشل حذف المنتج");

      return;
    }


    alert(
      translations[currentLang].deleted
    );


    await loadProducts();
  };


// =========================
// البحث
// =========================

$("#search")
  .addEventListener(
    "input",
    render
  );


// =========================
// معاينة الصورة
// =========================

$("#image")
  .addEventListener(
    "change",
    function () {

      const file =
        this.files[0];


      if (!file) {

        $("#preview").innerHTML =
          "";

        return;
      }


      const url =
        URL.createObjectURL(file);


      $("#preview").innerHTML = `

        <div style="margin-top:10px">

          <img
            src="${url}"
            style="
              max-width:200px;
              max-height:200px;
              border-radius:12px;
              object-fit:cover;
            ">

        </div>

      `;
    }
  );


// =========================
// مسح Barcode / QR
// =========================

$("#scanBtn")
  .addEventListener(
    "click",
    startScanner
  );


async function startScanner() {

  $("#scanner")
    .classList
    .remove("hidden");


  $("#scanStatus")
    .textContent =
      translations[currentLang].scanText;


  if (scanner) {

    try {
      await scanner.clear();
    } catch {}

    scanner = null;
  }


  scanner =
    new Html5Qrcode("reader");


  try {

    await scanner.start(

      {
        facingMode:
          "environment"
      },

      {
        fps: 10,

        qrbox: {
          width: 250,
          height: 150
        },

        aspectRatio: 1.5
      },

      async decodedText => {

        $("#barcode").value =
          decodedText;


        const found =
          products.find(
            product =>
              String(product.barcode) ===
              String(decodedText)
          );


        if (found) {

          $("#scanStatus")
            .textContent =
              translations[currentLang].found;


          stopScanner();


          editProduct(
            found.id
          );

        } else {

          $("#scanStatus")
            .textContent =
              `${translations[currentLang].barcodeRead} ${decodedText}`;


          setTimeout(
            stopScanner,
            700
          );
        }

      },

      () => {}

    );

  } catch (error) {

    console.error(error);


    $("#scanStatus").textContent =
      "تعذر تشغيل الكاميرا. تأكد من السماح باستخدام الكاميرا.";
  }
}


// =========================
// إيقاف الماسح
// =========================

async function stopScanner() {

  if (scanner) {

    try {

      await scanner.stop();

      await scanner.clear();

    } catch {}

    scanner = null;
  }


  $("#scanner")
    .classList
    .add("hidden");
}


$("#closeScan")
  .addEventListener(
    "click",
    stopScanner
  );


// =========================
// قراءة تاريخ الانتهاء OCR
// =========================

$("#ocrBtn")
  .addEventListener(
    "click",
    readExpiryFromImage
  );


async function readExpiryFromImage() {

  const file =
    $("#image").files[0];


  if (!file) {

    alert(
      "اختر صورة المنتج أولاً."
    );

    return;
  }


  $("#ocrStatus")
    .textContent =
      translations[currentLang].ocrReading;


  try {

    const result =
      await Tesseract.recognize(
        file,
        "eng",
        {
          logger: message => {

            if (
              message.status ===
              "recognizing text"
            ) {

              const percent =
                Math.round(
                  (message.progress || 0) *
                  100
                );


              $("#ocrStatus")
                .textContent =
                  `جاري قراءة الصورة... ${percent}%`;
            }
          }
        }
      );


    const text =
      result.data.text;


    console.log(
      "OCR TEXT:",
      text
    );


    const date =
      findExpiryDate(text);


    if (date) {

      $("#expiry").value =
        date;


      $("#ocrStatus")
        .textContent =
          `${translations[currentLang].ocrDone} ${date}`;

    } else {

      $("#ocrStatus")
        .textContent =
          translations[currentLang].ocrFailed;

    }

  } catch (error) {

    console.error(error);


    $("#ocrStatus")
      .textContent =
        translations[currentLang].ocrFailed;
  }
}


// =========================
// اكتشاف التاريخ
// =========================

function findExpiryDate(text) {

  if (!text) return null;


  const normalized =
    text
      .replace(/[Oo]/g, "0")
      .replace(/[Il]/g, "1")
      .replace(/\s+/g, " ");


  // YYYY-MM-DD

  let match =
    normalized.match(
      /\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b/
    );


  if (match) {

    return normalizeDate(
      match[1],
      match[2],
      match[3]
    );
  }


  // DD-MM-YYYY

  match =
    normalized.match(
      /\b(\d{1,2})[-/.](\d{1,2})[-/.](20\d{2})\b/
    );


  if (match) {

    return normalizeDate(
      match[3],
      match[2],
      match[1]
    );
  }


  // MM/YYYY

  match =
    normalized.match(
      /\b(\d{1,2})[-/.](20\d{2})\b/
    );


  if (match) {

    return normalizeDate(
      match[2],
      match[1],
      1
    );
  }


  // MM/YY

  match =
    normalized.match(
      /\b(\d{1,2})[-/.](\d{2})\b/
    );


  if (match) {

    return normalizeDate(
      "20" + match[2],
      match[1],
      1
    );
  }


  return null;
}


function normalizeDate(
  year,
  month,
  day
) {

  year =
    Number(year);

  month =
    Number(month);

  day =
    Number(day);


  if (
    year < 2000 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {

    return null;
  }


  const date =
    new Date(
      year,
      month - 1,
      day
    );


  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {

    return null;
  }


  return [
    year,
    String(month).padStart(2, "0"),
    String(day).padStart(2, "0")
  ].join("-");
}


// =========================
// طباعة التقرير
// =========================

$("#printBtn")
  .addEventListener(
    "click",
    printReport
  );


function printReport() {

  const rows =
    products.map(product => {

      return `
        <tr>

          <td>
            ${escapeHTML(product.name)}
          </td>

          <td>
            ${product.quantity}
          </td>

          <td>
            ${product.expiry_date}
          </td>

          <td>
            ${escapeHTML(product.barcode || "")}
          </td>

          <td>
            ${
              product.notes
                ? escapeHTML(product.notes)
                : ""
            }
          </td>

        </tr>
      `;
    }).join("");


  const win =
    window.open(
      "",
      "_blank"
    );


  if (!win) {

    alert(
      "المتصفح منع نافذة الطباعة. اسمح بالنوافذ المنبثقة."
    );

    return;
  }


  win.document.write(`

    <!doctype html>

    <html
      lang="${currentLang}"
      dir="${currentLang === "ar" ? "rtl" : "ltr"}">

    <head>

      <meta charset="utf-8">

      <title>
        ${currentLang === "ar"
          ? "تقرير المنتجات"
          : "Products Report"}
      </title>

      <style>

        body {
          font-family:
            Arial,
            sans-serif;

          padding: 30px;
        }

        h1 {
          text-align: center;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 25px;
        }

        th,
        td {
          border: 1px solid #999;
          padding: 10px;
          text-align: center;
        }

        th {
          background: #eee;
        }

      </style>

    </head>

    <body>

      <h1>
        ${
          currentLang === "ar"
            ? "تقرير المنتجات — فحص الصلاحية"
            : "Products Report — Expiry Check"
        }
      </h1>

      <table>

        <thead>

          <tr>

            <th>
              ${
                currentLang === "ar"
                  ? "المنتج"
                  : "Product"
              }
            </th>

            <th>
              ${
                currentLang === "ar"
                  ? "الكمية"
                  : "Quantity"
              }
            </th>

            <th>
              ${
                currentLang === "ar"
                  ? "تاريخ الانتهاء"
                  : "Expiry date"
              }
            </th>

            <th>
              Barcode
            </th>

            <th>
              ${
                currentLang === "ar"
                  ? "ملاحظات"
                  : "Notes"
              }
            </th>

          </tr>

        </thead>

        <tbody>

          ${rows}

        </tbody>

      </table>

      <script>
        window.onload = function() {
          window.print();
        };
      <\/script>

    </body>

    </html>

  `);


  win.document.close();
}


// =========================
// التنبيهات
// =========================

$("#notifyBtn")
  .addEventListener(
    "click",
    async () => {

      if (
        !("Notification" in window)
      ) {

        alert(
          "المتصفح لا يدعم التنبيهات."
        );

        return;
      }


      const permission =
        await Notification.requestPermission();


      if (
        permission === "granted"
      ) {

        new Notification(
          translations[currentLang]
            .notificationTitle,
          {
            body:
              translations[currentLang]
                .notificationBody
          }
        );

      }
    }
  );


// =========================
// اللغة
// =========================

$("#langBtn")
  .addEventListener(
    "click",
    () => {

      currentLang =
        currentLang === "ar"
          ? "en"
          : "ar";


      applyLanguage();
    }
  );


function applyLanguage() {

  const t =
    translations[currentLang];


  document.documentElement
    .lang =
      currentLang;


  document.documentElement
    .dir =
      currentLang === "ar"
        ? "rtl"
        : "ltr";


  $("#subtitle")
    .textContent =
      t.subtitle;

  $("#totalLabel")
    .textContent =
      t.total;

  $("#soonLabel")
    .textContent =
      t.soon;

  $("#expiredLabel")
    .textContent =
      t.expired;

  $("#qtyLabel")
    .textContent =
      t.qty;

  $("#addTitle")
    .textContent =
      t.add;

  $("#nameLabel")
    .textContent =
      t.name;

  $("#quantityLabel")
    .textContent =
      t.quantity;

  $("#expiryLabel")
    .textContent =
      t.expiry;

  $("#barcodeLabel")
    .textContent =
      t.barcode;

  $("#imageLabel")
    .textContent =
      t.image;

  $("#notesLabel")
    .textContent =
      t.notes;

  $("#saveBtn")
    .textContent =
      t.save;

  $("#resetBtn")
    .textContent =
      t.reset;

  $("#productsTitle")
    .textContent =
      t.products;

  $("#search")
    .placeholder =
      t.search;

  $("#printBtn")
    .textContent =
      t.print;

  $("#scanBtn")
    .textContent =
      t.scan;

  $("#scannerTitle")
    .textContent =
      t.scanTitle;

  $("#ocrBtn")
    .textContent =
      t.ocr;

  $("#notifyBtn")
    .textContent =
      t.notifications;

  $("#langBtn")
    .textContent =
      currentLang === "ar"
        ? "English"
        : "العربية";


  render();
}


// =========================
// تشغيل الموقع
// =========================

applyLanguage();

loadProducts();
