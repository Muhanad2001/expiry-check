const $ = (s) => document.querySelector(s);

let products = [];
let scanner = null;
let currentLang = "ar";

const T = {
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
    ocr: "🔍 قراءة EXP / E من الصورة",
    valid: "صالح",
    soonStatus: "قريب الانتهاء",
    expiredStatus: "منتهي",
    noProducts: "لا توجد منتجات.",
    deleteConfirm: "هل تريد حذف المنتج؟"
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
    ocr: "🔍 Read EXP / E",
    valid: "Valid",
    soonStatus: "Expiring soon",
    expiredStatus: "Expired",
    noProducts: "No products.",
    deleteConfirm: "Delete this product?"
  }
};


// =====================================
// التاريخ
// =====================================

function diffDays(date) {
  const expiry = new Date(date + "T23:59:59");
  return Math.ceil((expiry - new Date()) / 86400000);
}


// =====================================
// تحميل المنتجات
// =====================================

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


// =====================================
// عرض المنتجات
// =====================================

function render() {

  const search =
    ($("#search")?.value || "")
      .trim()
      .toLowerCase();

  const list = products.filter(p => {

    const text =
      `${p.name || ""} ${p.barcode || ""}`
        .toLowerCase();

    return text.includes(search);
  });


  $("#total").textContent =
    products.length;


  $("#soon").textContent =
    products.filter(p => {

      const d = diffDays(p.expiry_date);

      return d >= 0 && d <= 5;

    }).length;


  $("#expired").textContent =
    products.filter(p => {

      return diffDays(p.expiry_date) < 0;

    }).length;


  $("#qty").textContent =
    products.reduce(
      (sum, p) =>
        sum + Number(p.quantity || 0),
      0
    );


  // التنبيهات

  const soonProducts =
    products.filter(p => {

      const d = diffDays(p.expiry_date);

      return d >= 0 && d <= 5;

    });


  if (soonProducts.length) {

    $("#alerts").innerHTML =
      soonProducts.map(p => {

        const days =
          diffDays(p.expiry_date);

        return `
          <div class="alert">
            ⚠️ <b>${esc(p.name)}</b>
            —
            ${
              days === 0
                ? "ينتهي اليوم"
                : `ينتهي خلال ${days} يوم`
            }
            (${p.expiry_date})
          </div>
        `;

      }).join("");

  } else {

    $("#alerts").innerHTML = "";
  }


  if (!list.length) {

    $("#products").innerHTML =
      `<p>${T[currentLang].noProducts}</p>`;

    return;
  }


  $("#products").innerHTML =
    list.map(productCard).join("");
}


// =====================================
// بطاقة المنتج
// =====================================

function productCard(p) {

  const d =
    diffDays(p.expiry_date);

  let cls = "ok";
  let status = T[currentLang].valid;

  if (d < 0) {

    cls = "expired";
    status = T[currentLang].expiredStatus;

  } else if (d <= 5) {

    cls = "soon";
    status = T[currentLang].soonStatus;
  }


  const image =
    p.image_key
      ? `/images/${encodeURIComponent(p.image_key)}`
      : `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100%25' height='100%25' fill='%23e8edf3'/%3E%3C/svg%3E`;


  return `
    <article class="product">

      <img
        src="${image}"
        alt="${esc(p.name)}">

      <div>

        <h3>
          ${esc(p.name)}
        </h3>

        <div class="meta">

          <span>
            📦 ${p.quantity}
          </span>

          <span>
            📅 ${p.expiry_date}
          </span>

          ${
            p.barcode
              ? `
                <span>
                  ▣ ${esc(p.barcode)}
                </span>
              `
              : ""
          }

        </div>

        ${
          p.notes
            ? `
              <p>
                📝 ${esc(p.notes)}
              </p>
            `
            : ""
        }

      </div>


      <div>

        <span class="status ${cls}">
          ${status}
        </span>

        <div
          class="actions"
          style="margin-top:8px">

          <button
            class="secondary"
            onclick="editProduct(${p.id})">
            تعديل
          </button>

          <button
            class="secondary"
            onclick="deleteProduct(${p.id})">
            حذف
          </button>

        </div>

      </div>

    </article>
  `;
}


// =====================================
// حماية النص
// =====================================

function esc(value) {

  return String(value ?? "")
    .replace(/[&<>"']/g, c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[c]));
}


// =====================================
// حفظ المنتج
// =====================================

$("#productForm").addEventListener(
  "submit",
  async e => {

    e.preventDefault();

    const id =
      $("#id").value;

    const oldProduct =
      products.find(
        p => String(p.id) === String(id)
      );


    let imageKey =
      oldProduct?.image_key || null;


    // رفع الصورة

    const file =
      $("#image").files[0];


    if (file) {

      const fd =
        new FormData();

      fd.append("image", file);


      const response =
        await fetch(
          "/api/images",
          {
            method: "POST",
            body: fd
          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        alert(
          data.error ||
          "فشل رفع الصورة"
        );

        return;
      }


      imageKey =
        data.key;
    }


    const body = {

      name:
        $("#name").value.trim(),

      quantity:
        Number(
          $("#quantity").value || 0
        ),

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


    const response =
      await fetch(
        url,
        {
          method:
            id ? "PUT" : "POST",

          headers: {
            "content-type":
              "application/json"
          },

          body:
            JSON.stringify(body)
        }
      );


    const result =
      await response.json();


    if (!response.ok) {

      alert(
        result.error ||
        "حدث خطأ أثناء الحفظ"
      );

      return;
    }


    alert(
      id
        ? "تم تحديث المنتج بنجاح."
        : "تم حفظ المنتج بنجاح."
    );


    resetForm();

    await loadProducts();
  }
);


// =====================================
// إعادة ضبط الحقول
// =====================================

function resetForm() {

  $("#productForm").reset();

  $("#id").value = "";

  $("#quantity").value = 1;

  $("#preview").innerHTML = "";

  $("#ocrStatus").textContent = "";

  $("#saveBtn").textContent =
    T[currentLang].save;
}


$("#resetBtn")
  .addEventListener(
    "click",
    resetForm
  );


// =====================================
// تعديل المنتج
// =====================================

window.editProduct =
  function(id) {

    const p =
      products.find(
        x => Number(x.id) === Number(id)
      );


    if (!p) return;


    $("#id").value =
      p.id;

    $("#name").value =
      p.name || "";

    $("#quantity").value =
      p.quantity || 0;

    $("#expiry").value =
      p.expiry_date || "";

    $("#barcode").value =
      p.barcode || "";

    $("#notes").value =
      p.notes || "";


    $("#saveBtn").textContent =
      currentLang === "ar"
        ? "💾 تحديث المنتج"
        : "💾 Update Product";


    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };


// =====================================
// حذف المنتج
// =====================================

window.deleteProduct =
  async function(id) {

    if (
      !confirm(
        T[currentLang].deleteConfirm
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


    await loadProducts();
  };


// =====================================
// البحث
// =====================================

$("#search")
  .addEventListener(
    "input",
    render
  );


// =====================================
// معاينة الصورة
// =====================================

$("#image")
  .addEventListener(
    "change",
    function () {

      const file =
        this.files[0];


      if (!file) {

        $("#preview").innerHTML = "";

        return;
      }


      const url =
        URL.createObjectURL(file);


      $("#preview").innerHTML = `
        <div style="margin-top:10px">

          <img
            src="${url}"
            style="
              max-width:220px;
              max-height:220px;
              border-radius:12px;
              object-fit:cover;
            ">

        </div>
      `;
    }
  );


// =====================================
// BARCODE / QR
// =====================================

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
      T[currentLang].scanText;


  try {

    if (scanner) {

      try {
        await scanner.stop();
      } catch {}

      try {
        await scanner.clear();
      } catch {}

      scanner = null;
    }


    scanner =
      new Html5Qrcode("reader");


    await scanner.start(

      {
        facingMode:
          "environment"
      },

      {
        fps: 10,

        qrbox: {
          width: 280,
          height: 180
        }
      },

      async decodedText => {

        const barcode =
          String(decodedText).trim();


        $("#barcode").value =
          barcode;


        $("#scanStatus").textContent =
          "🔍 جاري البحث عن اسم المنتج...";


        // =================================
        // البحث داخل منتجات الموقع أولاً
        // =================================

        const local =
          products.find(
            p =>
              String(p.barcode || "")
                .trim() === barcode
          );


        if (local) {

          $("#name").value =
            local.name || "";

          $("#quantity").value =
            local.quantity || 1;

          $("#expiry").value =
            local.expiry_date || "";

          $("#notes").value =
            local.notes || "";


          $("#scanStatus").textContent =
            "✅ تم العثور على المنتج داخل النظام.";


          await stopScanner();

          return;
        }


        // =================================
        // البحث العالمي
        // =================================

        const product =
          await findProductByBarcode(
            barcode
          );


        if (product) {

          $("#name").value =
            product.name;


          $("#scanStatus").textContent =
            `✅ تم العثور على المنتج: ${product.name}`;

        } else {

          $("#scanStatus").textContent =
            "⚠️ لم يتم العثور على اسم المنتج.";

        }


        setTimeout(
          stopScanner,
          1000
        );
      },

      () => {}

    );

  } catch (error) {

    console.error(error);

    $("#scanStatus").textContent =
      "❌ تعذر تشغيل الكاميرا.";
  }
}


// =====================================
// البحث عن المنتج بالباركود
// =====================================

async function findProductByBarcode(barcode) {

  try {

    const url =
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`;


    const response =
      await fetch(url);


    if (!response.ok) {
      return null;
    }


    const data =
      await response.json();


    if (
      data.status !== 1 ||
      !data.product
    ) {
      return null;
    }


    const p =
      data.product;


    const name =
      p.product_name_ar ||
      p.product_name_en ||
      p.product_name ||
      p.generic_name_ar ||
      p.generic_name_en ||
      p.generic_name ||
      "";


    if (!name.trim()) {
      return null;
    }


    return {
      name: name.trim()
    };

  } catch (error) {

    console.error(
      "Barcode lookup error:",
      error
    );

    return null;
  }
}


// =====================================
// إغلاق قارئ الباركود
// =====================================

async function stopScanner() {

  if (scanner) {

    try {
      await scanner.stop();
    } catch {}

    try {
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


// =====================================
// OCR - قراءة EXP / E
// =====================================

$("#ocrBtn")
  .addEventListener(
    "click",
    readExpiry
  );


async function readExpiry() {

  const file =
    $("#image").files[0];


  if (!file) {

    alert(
      "📷 اختر صورة المنتج أولاً."
    );

    return;
  }


  $("#ocrStatus").textContent =
    "🔍 جاري البحث عن EXP / E...";


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


              $("#ocrStatus").textContent =
                `🔍 قراءة الصورة... ${percent}%`;
            }
          }
        }
      );


    const text =
      result.data.text;


    console.log(
      "OCR:",
      text
    );


    const expiry =
      findExpiry(text);


    if (expiry) {

      $("#expiry").value =
        expiry;


      $("#ocrStatus").textContent =
        `✅ تم العثور على EXP: ${expiry}`;

    } else {

      $("#ocrStatus").textContent =
        "⚠️ لم يتم العثور على EXP أو E. صوّر التاريخ بشكل أقرب.";
    }

  } catch (error) {

    console.error(error);

    $("#ocrStatus").textContent =
      "❌ فشل قراءة الصورة.";
  }
}


// =====================================
// البحث عن EXP / E
// =====================================

function findExpiry(text) {

  if (!text) {
    return null;
  }


  let value =
    text
      .toUpperCase()
      .replace(/\s+/g, " ")
      .trim();


  // --------------------------------
  // EXP 12/08/2027
  // E 12/08/2027
  // --------------------------------

  let match =
    value.match(
      /(?:EXP|EXPIRY|EX|E)\s*[:\-]?\s*(\d{1,2})[\/.\-](\d{1,2})[\/.\-](20\d{2})/
    );


  if (match) {

    return makeDate(
      match[3],
      match[2],
      match[1]
    );
  }


  // --------------------------------
  // EXP 08/2027
  // E 08/2027
  // --------------------------------

  match =
    value.match(
      /(?:EXP|EXPIRY|EX|E)\s*[:\-]?\s*(\d{1,2})[\/.\-](20\d{2})/
    );


  if (match) {

    return makeDate(
      match[2],
      match[1],
      1
    );
  }


  // --------------------------------
  // التاريخ الكامل بدون EXP
  // --------------------------------

  match =
    value.match(
      /\b(\d{1,2})[\/.\-](\d{1,2})[\/.\-](20\d{2})\b/
    );


  if (match) {

    return makeDate(
      match[3],
      match[2],
      match[1]
    );
  }


  // --------------------------------
  // شهر / سنة
  // --------------------------------

  match =
    value.match(
      /\b(\d{1,2})[\/.\-](20\d{2})\b/
    );


  if (match) {

    return makeDate(
      match[2],
      match[1],
      1
    );
  }


  return null;
}


// =====================================
// إنشاء التاريخ
// =====================================

function makeDate(year, month, day) {

  year = Number(year);
  month = Number(month);
  day = Number(day);


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


  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}


// =====================================
// الطباعة
// =====================================

$("#printBtn")
  .addEventListener(
    "click",
    printReport
  );


function printReport() {

  const rows =
    products.map(p => `
      <tr>

        <td>
          ${esc(p.name)}
        </td>

        <td>
          ${p.quantity}
        </td>

        <td>
          ${p.expiry_date}
        </td>

        <td>
          ${esc(p.barcode || "")}
        </td>

        <td>
          ${esc(p.notes || "")}
        </td>

      </tr>
    `).join("");


  const win =
    window.open(
      "",
      "_blank"
    );


  if (!win) {

    alert(
      "اسمح بالنوافذ المنبثقة للطباعة."
    );

    return;
  }


  win.document.write(`
    <!doctype html>

    <html
      lang="ar"
      dir="rtl">

    <head>

      <meta charset="utf-8">

      <title>
        تقرير فحص الصلاحية
      </title>

      <style>

        body {
          font-family: Arial;
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
        تقرير المنتجات — فحص الصلاحية
      </h1>

      <table>

        <tr>

          <th>المنتج</th>

          <th>الكمية</th>

          <th>تاريخ الانتهاء</th>

          <th>الباركود</th>

          <th>الملاحظات</th>

        </tr>

        ${rows}

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


// =====================================
// التنبيهات
// =====================================

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
          "فحص الصلاحية",
          {
            body:
              "تم تفعيل تنبيهات المنتجات."
          }
        );
      }
    }
  );


// =====================================
// تغيير اللغة
// =====================================

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
    T[currentLang];


  document.documentElement.lang =
    currentLang;

  document.documentElement.dir =
    currentLang === "ar"
      ? "rtl"
      : "ltr";


  $("#subtitle").textContent =
    t.subtitle;

  $("#totalLabel").textContent =
    t.total;

  $("#soonLabel").textContent =
    t.soon;

  $("#expiredLabel").textContent =
    t.expired;

  $("#qtyLabel").textContent =
    t.qty;

  $("#addTitle").textContent =
    t.add;

  $("#nameLabel").textContent =
    t.name;

  $("#quantityLabel").textContent =
    t.quantity;

  $("#expiryLabel").textContent =
    t.expiry;

  $("#barcodeLabel").textContent =
    t.barcode;

  $("#imageLabel").textContent =
    t.image;

  $("#notesLabel").textContent =
    t.notes;

  $("#saveBtn").textContent =
    t.save;

  $("#resetBtn").textContent =
    t.reset;

  $("#productsTitle").textContent =
    t.products;

  $("#search").placeholder =
    t.search;

  $("#printBtn").textContent =
    t.print;

  $("#scanBtn").textContent =
    t.scan;

  $("#scannerTitle").textContent =
    t.scanTitle;

  $("#ocrBtn").textContent =
    t.ocr;

  $("#notifyBtn").textContent =
    currentLang === "ar"
      ? "🔔 التنبيهات"
      : "🔔 Notifications";

  $("#langBtn").textContent =
    currentLang === "ar"
      ? "English"
      : "العربية";


  render();
}


// =====================================
// تشغيل الموقع
// =====================================

applyLanguage();

loadProducts();
