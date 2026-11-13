const $ = (s) => document.querySelector(s);

let products = [];
let scanner = null;
let currentLang = "ar";

// =====================================================
// اللغة
// =====================================================

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


// =====================================================
// حساب الأيام
// =====================================================

function diffDays(date) {

  if (!date) return 999999;

  const expiry =
    new Date(date + "T23:59:59");

  return Math.ceil(
    (expiry - new Date()) / 86400000
  );
}


// =====================================================
// تحميل المنتجات
// =====================================================

async function loadProducts() {

  try {

    const response =
      await fetch("/api/products");

    if (!response.ok) {
      throw new Error("Failed to load products");
    }

    products =
      await response.json();

    render();

  } catch (error) {

    console.error(error);

    if ($("#products")) {

      $("#products").innerHTML = `
        <div class="alert">
          ⚠️ تعذر تحميل المنتجات.
        </div>
      `;
    }
  }
}


// =====================================================
// عرض المنتجات
// =====================================================

function render() {

  const search =
    ($("#search")?.value || "")
      .trim()
      .toLowerCase();


  const list =
    products.filter(p => {

      const text =
        `${p.name || ""} ${p.barcode || ""}`
          .toLowerCase();

      return text.includes(search);
    });


  if ($("#total")) {

    $("#total").textContent =
      products.length;
  }


  if ($("#soon")) {

    $("#soon").textContent =
      products.filter(p => {

        const d =
          diffDays(p.expiry_date);

        return d >= 0 && d <= 5;

      }).length;
  }


  if ($("#expired")) {

    $("#expired").textContent =
      products.filter(p => {

        return diffDays(p.expiry_date) < 0;

      }).length;
  }


  if ($("#qty")) {

    $("#qty").textContent =
      products.reduce(
        (sum, p) =>
          sum + Number(p.quantity || 0),
        0
      );
  }


  const soonProducts =
    products.filter(p => {

      const d =
        diffDays(p.expiry_date);

      return d >= 0 && d <= 5;

    });


  if ($("#alerts")) {

    if (soonProducts.length) {

      $("#alerts").innerHTML =
        soonProducts.map(p => {

          const days =
            diffDays(p.expiry_date);

          return `
            <div class="alert">
              ⚠️
              <b>${esc(p.name)}</b>
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
  }


  if (!list.length) {

    if ($("#products")) {

      $("#products").innerHTML =
        `<p>${T[currentLang].noProducts}</p>`;
    }

    return;
  }


  if ($("#products")) {

    $("#products").innerHTML =
      list.map(productCard).join("");
  }
}


// =====================================================
// بطاقة المنتج
// =====================================================

function productCard(p) {

  const d =
    diffDays(p.expiry_date);

  let cls = "ok";

  let status =
    T[currentLang].valid;


  if (d < 0) {

    cls = "expired";

    status =
      T[currentLang].expiredStatus;

  } else if (d <= 5) {

    cls = "soon";

    status =
      T[currentLang].soonStatus;
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


// =====================================================
// حماية النص
// =====================================================

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


// =====================================================
// حفظ المنتج
// =====================================================

if ($("#productForm")) {

  $("#productForm")
    .addEventListener("submit", async e => {

      e.preventDefault();

      const id =
        $("#id").value;


      const oldProduct =
        products.find(
          p =>
            String(p.id) ===
            String(id)
        );


      let imageKey =
        oldProduct?.image_key || null;


      const file =
        $("#image")?.files?.[0];


      if (file) {

        const fd =
          new FormData();

        fd.append(
          "image",
          file
        );


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


      if (
        !body.name ||
        !body.expiry_date
      ) {

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

    });
}


// =====================================================
// مسح الحقول
// =====================================================

function resetForm() {

  if ($("#productForm")) {
    $("#productForm").reset();
  }


  if ($("#id")) {
    $("#id").value = "";
  }


  if ($("#quantity")) {
    $("#quantity").value = 1;
  }


  if ($("#preview")) {
    $("#preview").innerHTML = "";
  }


  if ($("#ocrStatus")) {
    $("#ocrStatus").textContent = "";
  }


  if ($("#saveBtn")) {

    $("#saveBtn").textContent =
      T[currentLang].save;
  }
}


if ($("#resetBtn")) {

  $("#resetBtn")
    .addEventListener(
      "click",
      resetForm
    );
}


// =====================================================
// تعديل المنتج
// =====================================================

window.editProduct =
  function(id) {

    const p =
      products.find(
        x =>
          String(x.id) ===
          String(id)
      );

    if (!p) return;


    if ($("#id")) {
      $("#id").value =
        p.id;
    }

    if ($("#name")) {
      $("#name").value =
        p.name || "";
    }

    if ($("#quantity")) {
      $("#quantity").value =
        p.quantity || 1;
    }

    if ($("#expiry")) {
      $("#expiry").value =
        p.expiry_date || "";
    }

    if ($("#barcode")) {
      $("#barcode").value =
        p.barcode || "";
    }

    if ($("#notes")) {
      $("#notes").value =
        p.notes || "";
    }


    if ($("#saveBtn")) {

      $("#saveBtn").textContent =
        "💾 تحديث المنتج";
    }


    if (p.image_key && $("#preview")) {

      $("#preview").innerHTML = `
        <img
          src="/images/${encodeURIComponent(p.image_key)}"
          style="max-width:150px;border-radius:10px;">
      `;
    }


    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };


// =====================================================
// حذف المنتج
// =====================================================

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


    const result =
      await response.json();


    if (!response.ok) {

      alert(
        result.error ||
        "تعذر حذف المنتج"
      );

      return;
    }


    await loadProducts();
  };


// =====================================================
// البحث
// =====================================================

if ($("#search")) {

  $("#search")
    .addEventListener(
      "input",
      render
    );
}


// =====================================================
// صورة المنتج
// =====================================================

if ($("#image")) {

  $("#image")
    .addEventListener(
      "change",
      e => {

        const file =
          e.target.files?.[0];

        if (!file) return;


        const url =
          URL.createObjectURL(file);


        if ($("#preview")) {

          $("#preview").innerHTML = `
            <img
              src="${url}"
              style="
                max-width:180px;
                max-height:180px;
                object-fit:contain;
                border-radius:12px;
              ">
          `;
        }
      }
    );
}


// =====================================================
// BARCODE / QR
// =====================================================

if ($("#scanBtn")) {

  $("#scanBtn")
    .addEventListener(
      "click",
      startScanner
    );
}


async function startScanner() {

  if (
    typeof Html5Qrcode ===
    "undefined"
  ) {

    alert(
      "مكتبة قراءة الباركود غير موجودة."
    );

    return;
  }


  if ($("#scannerModal")) {
    $("#scannerModal").style.display =
      "flex";
  }


  if ($("#scanner")) {

    $("#scanner").innerHTML = "";
  }


  scanner =
    new Html5Qrcode(
      "scanner"
    );


  try {

    const cameras =
      await Html5Qrcode.getCameras();


    if (!cameras.length) {

      throw new Error(
        "No camera"
      );
    }


    const cameraId =
      cameras[0].id;


    await scanner.start(
      cameraId,

      {
        fps: 10,
        qrbox: {
          width: 300,
          height: 200
        }
      },

      async decodedText => {

        if ($("#barcode")) {

          $("#barcode").value =
            decodedText;
        }


        await lookupBarcode(
          decodedText
        );


        stopScanner();
      },

      () => {}
    );

  } catch (error) {

    console.error(error);

    alert(
      "تعذر تشغيل الكاميرا."
    );
  }
}


async function stopScanner() {

  try {

    if (scanner) {

      await scanner.stop();

      await scanner.clear();

      scanner = null;
    }

  } catch (error) {

    console.warn(error);
  }


  if ($("#scannerModal")) {

    $("#scannerModal").style.display =
      "none";
  }
}


if ($("#closeScanner")) {

  $("#closeScanner")
    .addEventListener(
      "click",
      stopScanner
    );
}


// =====================================================
// البحث عن المنتج بواسطة الباركود
// =====================================================

async function lookupBarcode(barcode) {

  if (!barcode) return;


  try {

    const response =
      await fetch(
        `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`
      );


    if (!response.ok) {
      return;
    }


    const data =
      await response.json();


    const product =
      data.product;


    if (!product) {
      return;
    }


    const name =
      product.product_name ||
      product.product_name_ar ||
      product.generic_name ||
      "";


    if (
      name &&
      $("#name")
    ) {

      $("#name").value =
        name;
    }

  } catch (error) {

    console.warn(
      "Barcode lookup failed:",
      error
    );
  }
}


// =====================================================
// OCR — قراءة EXP / E
// =====================================================

if ($("#ocrBtn")) {

  $("#ocrBtn")
    .addEventListener(
      "click",
      readExpiry
    );
}


async function readExpiry() {

  const file =
    $("#image")?.files?.[0];


  if (!file) {

    alert(
      "اختر صورة المنتج أولاً."
    );

    return;
  }


  if (
    typeof Tesseract ===
    "undefined"
  ) {

    alert(
      "مكتبة OCR غير موجودة."
    );

    return;
  }


  const status =
    $("#ocrStatus");


  if (status) {

    status.textContent =
      "🔍 تجهيز الصورة...";
  }


  try {

    const images =
      await createOCRImages(file);


    let foundDate =
      null;


    for (
      let i = 0;
      i < images.length;
      i++
    ) {

      if (status) {

        status.textContent =
          `🔍 قراءة EXP / E — صورة ${i + 1} من ${images.length}...`;
      }


      try {

        const text =
          await recognizeWithTimeout(
            images[i],
            25000
          );


        console.log(
          `OCR ${i + 1}:`,
          text
        );


        foundDate =
          findExpiry(text);


        if (foundDate) {
          break;
        }

      } catch (error) {

        console.warn(
          `OCR attempt ${i + 1} failed:`,
          error
        );
      }


      // حذف الصورة المؤقتة من الذاكرة
      if (images[i]) {

        images[i].width = 1;
        images[i].height = 1;
      }
    }


    if (foundDate) {

      if ($("#expiry")) {

        $("#expiry").value =
          foundDate;
      }


      if (status) {

        status.textContent =
          `✅ تم العثور على تاريخ الانتهاء: ${formatDateArabic(foundDate)}`;
      }

    } else {

      if (status) {

        status.textContent =
          "❌ لم يتم العثور على EXP / E. جرّب صورة أوضح.";
      }
    }

  } catch (error) {

    console.error(
      "OCR ERROR:",
      error
    );


    if (status) {

      status.textContent =
        "❌ حدث خطأ أثناء قراءة الصورة.";
    }
  }
}


// =====================================================
// OCR TIMEOUT
// =====================================================

async function recognizeWithTimeout(
  image,
  timeout = 25000
) {

  return await Promise.race([

    Tesseract.recognize(
      image,
      "eng",
      {
        logger:
          message => {

            if (
              message.status ===
              "recognizing text"
            ) {

              const percent =
                Math.round(
                  (message.progress || 0) *
                  100
                );


              const status =
                $("#ocrStatus");


              if (status) {

                status.textContent =
                  `🔍 قراءة EXP / E... ${percent}%`;
              }
            }
          }
      }
    ),

    new Promise(
      (_, reject) => {

        setTimeout(
          () =>
            reject(
              new Error(
                "OCR timeout"
              )
            ),
          timeout
        );
      }
    )
  ]);
}


// =====================================================
// إنشاء صور OCR
// =====================================================

async function createOCRImages(file) {

  const original =
    await fileToImage(file);

  const results = [];


  // المنطقة الأولى
  results.push(
    processCrop(
      original,
      0.05,
      0.30,
      0.90,
      0.55
    )
  );


  // المنطقة الثانية
  results.push(
    processCrop(
      original,
      0.05,
      0.45,
      0.90,
      0.45
    )
  );


  // المنطقة الثالثة
  results.push(
    processCrop(
      original,
      0.00,
      0.20,
      1.00,
      0.70
    )
  );


  return results;
}


// =====================================================
// تحويل الملف إلى صورة
// =====================================================

function fileToImage(file) {

  return new Promise(
    (resolve, reject) => {

      const img =
        new Image();


      const url =
        URL.createObjectURL(file);


      img.onload =
        () => {

          URL.revokeObjectURL(
            url
          );

          resolve(img);
        };


      img.onerror =
        () => {

          URL.revokeObjectURL(
            url
          );

          reject(
            new Error(
              "تعذر تحميل الصورة"
            )
          );
        };


      img.src =
        url;
    }
  );
}


// =====================================================
// قص منطقة من الصورة
// =====================================================

function processCrop(
  img,
  x,
  y,
  width,
  height
) {

  const sx =
    Math.floor(
      img.width * x
    );

  const sy =
    Math.floor(
      img.height * y
    );

  const sw =
    Math.floor(
      img.width * width
    );

  const sh =
    Math.floor(
      img.height * height
    );


  const maxWidth =
    1800;


  const scale =
    Math.min(
      5,
      maxWidth / sw
    );


  const canvas =
    document.createElement(
      "canvas"
    );


  canvas.width =
    Math.max(
      900,
      Math.floor(
        sw * scale
      )
    );


  canvas.height =
    Math.max(
      550,
      Math.floor(
        sh * scale
      )
    );


  const ctx =
    canvas.getContext(
      "2d",
      {
        willReadFrequently:
          true
      }
    );


  ctx.fillStyle =
    "#ffffff";


  ctx.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );


  ctx.drawImage(
    img,
    sx,
    sy,
    sw,
    sh,
    0,
    0,
    canvas.width,
    canvas.height
  );


  improveCanvas(
    ctx,
    canvas.width,
    canvas.height
  );


  return canvas;
}


// =====================================================
// تحسين صورة OCR
// =====================================================

function improveCanvas(
  ctx,
  width,
  height
) {

  const imageData =
    ctx.getImageData(
      0,
      0,
      width,
      height
    );


  const data =
    imageData.data;


  for (
    let i = 0;
    i < data.length;
    i += 4
  ) {

    const r =
      data[i];

    const g =
      data[i + 1];

    const b =
      data[i + 2];


    let gray =
      0.299 * r +
      0.587 * g +
      0.114 * b;


    gray =
      ((gray - 128) * 1.9) +
      128;


    gray =
      Math.max(
        0,
        Math.min(
          255,
          gray
        )
      );


    data[i] =
      gray;

    data[i + 1] =
      gray;

    data[i + 2] =
      gray;
  }


  ctx.putImageData(
    imageData,
    0,
    0
  );
}


// =====================================================
// البحث عن تاريخ الانتهاء
// =====================================================

function findExpiry(text) {

  if (!text) {
    return null;
  }


  let value =
    normalizeOCRText(text);


  console.log(
    "OCR CLEAN TEXT:",
    value
  );


  let match;
  let date;


  // EXP 19 02 27
  // E 19 02 27
  // E: 19 02 27

  match =
    value.match(
      /\b(?:EXP|EXPIRY|EX|E)\s*[:\-]?\s*(\d{1,2})\s+(\d{1,2})\s+(\d{2,4})\b/i
    );


  if (match) {

    date =
      convertDateParts(
        match[1],
        match[2],
        match[3]
      );


    if (date) {
      return date;
    }
  }


  // EXP 19/02/27
  // EXP 19-02-2027
  // E 19.02.27

  match =
    value.match(
      /\b(?:EXP|EXPIRY|EX|E)\s*[:\-]?\s*(\d{1,2})[\/\.\-](\d{1,2})[\/\.\-](\d{2,4})\b/i
    );


  if (match) {

    date =
      convertDateParts(
        match[1],
        match[2],
        match[3]
      );


    if (date) {
      return date;
    }
  }


  // EXP 02/2027
  // E 02-2027

  match =
    value.match(
      /\b(?:EXP|EXPIRY|EX|E)\s*[:\-]?\s*(\d{1,2})[\/\.\-](20\d{2})\b/i
    );


  if (match) {

    date =
      makeDate(
        match[2],
        match[1],
        1
      );


    if (date) {
      return date;
    }
  }


  // إذا أخطأ OCR في قراءة EXP أو E

  match =
    value.match(
      /\b[A-Z]\s*[:\-]?\s*(\d{1,2})\s+(\d{1,2})\s+(\d{2,4})\b/
    );


  if (match) {

    date =
      convertDateParts(
        match[1],
        match[2],
        match[3]
      );


    if (date) {
      return date;
    }
  }


  // تاريخ منفصل كحل أخير

  match =
    value.match(
      /\b(\d{1,2})[\/\.\-](\d{1,2})[\/\.\-](\d{2,4})\b/
    );


  if (match) {

    date =
      convertDateParts(
        match[1],
        match[2],
        match[3]
      );


    if (date) {
      return date;
    }
  }


  return null;
}


// =====================================================
// تنظيف نص OCR
// =====================================================

function normalizeOCRText(text) {

  return String(text)

    .toUpperCase()

    .replace(
      /[٠-٩]/g,
      d =>
        "٠١٢٣٤٥٦٧٨٩"
          .indexOf(d)
    )

    .replace(
      /[Oo]/g,
      "0"
    )

    .replace(
      /[IiLl|]/g,
      "1"
    )

    .replace(
      /S/g,
      "5"
    )

    .replace(
      /Z/g,
      "2"
    )

    .replace(
      /B/g,
      "8"
    )

    .replace(
      /[^\w\s\/\.\-:]/g,
      " "
    )

    .replace(
      /\s+/g,
      " "
    )

    .trim();
}


// =====================================================
// تحويل أجزاء التاريخ
// =====================================================

function convertDateParts(
  day,
  month,
  year
) {

  let y =
    Number(year);


  if (
    String(year).length === 2
  ) {

    y =
      2000 + y;
  }


  return makeDate(
    y,
    month,
    day
  );
}


// =====================================================
// إنشاء تاريخ
// =====================================================

function makeDate(
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
    year > 2099 ||
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


// =====================================================
// تنسيق التاريخ
// =====================================================

function formatDateArabic(date) {

  if (!date) {
    return "";
  }


  const parts =
    date.split("-");


  if (
    parts.length !== 3
  ) {

    return date;
  }


  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}


// =====================================================
// الطباعة
// =====================================================

if ($("#printBtn")) {

  $("#printBtn")
    .addEventListener(
      "click",
      printReport
    );
}


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

          <th>
            المنتج
          </th>

          <th>
            الكمية
          </th>

          <th>
            تاريخ الانتهاء
          </th>

          <th>
            الباركود
          </th>

          <th>
            الملاحظات
          </th>

        </tr>

        ${rows}

      </table>

      <script>

        window.onload =
          function() {
            window.print();
          };

      <\/script>

    </body>

    </html>
  `);


  win.document.close();
}


// =====================================================
// التنبيهات
// =====================================================

if ($("#notifyBtn")) {

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
          await Notification
            .requestPermission();


        if (
          permission ===
          "granted"
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
}


// =====================================================
// تغيير اللغة
// =====================================================

if ($("#langBtn")) {

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
}


function applyLanguage() {

  const t =
    T[currentLang];


  document.documentElement
    .lang =
    currentLang;


  document.documentElement
    .dir =
    currentLang === "ar"
      ? "rtl"
      : "ltr";


  setText(
    "#subtitle",
    t.subtitle
  );

  setText(
    "#totalLabel",
    t.total
  );

  setText(
    "#soonLabel",
    t.soon
  );

  setText(
    "#expiredLabel",
    t.expired
  );

  setText(
    "#qtyLabel",
    t.qty
  );

  setText(
    "#addTitle",
    t.add
  );

  setText(
    "#nameLabel",
    t.name
  );

  setText(
    "#quantityLabel",
    t.quantity
  );

  setText(
    "#expiryLabel",
    t.expiry
  );

  setText(
    "#barcodeLabel",
    t.barcode
  );

  setText(
    "#imageLabel",
    t.image
  );

  setText(
    "#notesLabel",
    t.notes
  );

  setText(
    "#saveBtn",
    t.save
  );

  setText(
    "#resetBtn",
    t.reset
  );

  setText(
    "#productsTitle",
    t.products
  );


  if ($("#search")) {

    $("#search")
      .placeholder =
      t.search;
  }


  setText(
    "#printBtn",
    t.print
  );

  setText(
    "#scanBtn",
    t.scan
  );

  setText(
    "#scannerTitle",
    t.scanTitle
  );

  setText(
    "#ocrBtn",
    t.ocr
  );


  if ($("#notifyBtn")) {

    $("#notifyBtn")
      .textContent =
      currentLang === "ar"
        ? "🔔 التنبيهات"
        : "🔔 Notifications";
  }


  if ($("#langBtn")) {

    $("#langBtn")
      .textContent =
      currentLang === "ar"
        ? "English"
        : "العربية";
  }


  render();
}


// =====================================================
// تعيين النص
// =====================================================

function setText(
  selector,
  text
) {

  const el =
    $(selector);

  if (el) {

    el.textContent =
      text;
  }
}


// =====================================================
// التشغيل
// =====================================================

applyLanguage();

loadProducts();
