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

  const expiry = new Date(date + "T23:59:59");

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
          Number(x.id) ===
          Number(id)
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


    if ($("#saveBtn")) {

      $("#saveBtn").textContent =
        currentLang === "ar"
          ? "💾 تحديث المنتج"
          : "💾 Update Product";
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
        T[currentLang]
          .deleteConfirm
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

      alert(
        "فشل حذف المنتج"
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
// معاينة الصورة
// =====================================================

if ($("#image")) {

  $("#image")
    .addEventListener(
      "change",
      function () {

        const file =
          this.files[0];


        if (!file) {

          if ($("#preview")) {
            $("#preview")
              .innerHTML = "";
          }

          return;
        }


        const url =
          URL.createObjectURL(file);


        if ($("#preview")) {

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
      }
    );
}


// =====================================================
// قارئ BARCODE / QR
// =====================================================

if ($("#scanBtn")) {

  $("#scanBtn")
    .addEventListener(
      "click",
      startScanner
    );
}


async function startScanner() {

  if (!$("#scanner")) return;


  $("#scanner")
    .classList
    .remove("hidden");


  if ($("#scanStatus")) {

    $("#scanStatus")
      .textContent =
      T[currentLang].scanText;
  }


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
      new Html5Qrcode(
        "reader"
      );


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
          String(
            decodedText
          ).trim();


        $("#barcode").value =
          barcode;


        if ($("#scanStatus")) {

          $("#scanStatus")
            .textContent =
            "🔍 جاري البحث عن اسم المنتج...";
        }


        const local =
          products.find(
            p =>
              String(
                p.barcode || ""
              ).trim() ===
              barcode
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


          if ($("#scanStatus")) {

            $("#scanStatus")
              .textContent =
              `✅ تم العثور على المنتج: ${local.name}`;
          }


          await stopScanner();

          return;
        }


        const product =
          await findProductByBarcode(
            barcode
          );


        if (
          product &&
          product.name
        ) {

          $("#name").value =
            product.name;


          if ($("#scanStatus")) {

            $("#scanStatus")
              .textContent =
              `✅ اسم المنتج: ${product.name}`;
          }

        } else {

          if ($("#scanStatus")) {

            $("#scanStatus")
              .textContent =
              "⚠️ لم يتم العثور على اسم المنتج.";
          }
        }


        setTimeout(
          stopScanner,
          1200
        );
      },


      () => {}

    );

  } catch (error) {

    console.error(
      error
    );


    if ($("#scanStatus")) {

      $("#scanStatus")
        .textContent =
        "❌ تعذر تشغيل الكاميرا. تأكد من السماح باستخدام الكاميرا.";
    }
  }
}


// =====================================================
// البحث عن اسم المنتج بالباركود
// =====================================================

async function findProductByBarcode(
  barcode
) {

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
      name:
        name.trim()
    };

  } catch (error) {

    console.warn(
      "Barcode lookup error:",
      error
    );

    return null;
  }
}// =====================================================
// OCR EXPIRY DATE READER
// =====================================================

async function readExpiry(file) {
    if (!file) return;

    const resultBox = document.getElementById("ocrResult");
    if (resultBox) {
        resultBox.textContent = currentLang === "ar"
            ? "جاري قراءة تاريخ الانتهاء..."
            : "Reading expiry date...";
    }

    try {
        const image = await createOCRImages(file);

        let bestText = "";

        // محاولة أولى
        try {
            const r1 = await recognizeWithTimeout(
                image.normal,
                20000
            );
            bestText += "\n" + (r1?.data?.text || "");
        } catch (e) {
            console.warn("OCR normal failed:", e);
        }

        // محاولة ثانية محسنة
        try {
            const r2 = await recognizeWithTimeout(
                image.enhanced,
                20000
            );
            bestText += "\n" + (r2?.data?.text || "");
        } catch (e) {
            console.warn("OCR enhanced failed:", e);
        }

        // محاولة ثالثة
        try {
            const r3 = await recognizeWithTimeout(
                image.gray,
                20000
            );
            bestText += "\n" + (r3?.data?.text || "");
        } catch (e) {
            console.warn("OCR gray failed:", e);
        }

        console.log("OCR RAW TEXT:", bestText);

        const expiry = findExpiry(bestText);

        if (expiry) {
            const expiryInput =
                document.getElementById("expiryDate") ||
                document.querySelector(
                    'input[name="expiryDate"], input[name="expiry"], #expiry'
                );

            if (expiryInput) {
                expiryInput.value = expiry;
                expiryInput.dispatchEvent(
                    new Event("input", { bubbles: true })
                );
                expiryInput.dispatchEvent(
                    new Event("change", { bubbles: true })
                );
            }

            if (resultBox) {
                resultBox.textContent =
                    currentLang === "ar"
                        ? `تم العثور على تاريخ الانتهاء: ${expiry}`
                        : `Expiry date found: ${expiry}`;

                resultBox.style.color = "green";
            }

            return expiry;
        }

        if (resultBox) {
            resultBox.textContent =
                currentLang === "ar"
                    ? "لم يتم العثور على تاريخ انتهاء واضح."
                    : "No clear expiry date found.";

            resultBox.style.color = "red";
        }

        return null;

    } catch (error) {
        console.error("Expiry OCR error:", error);

        if (resultBox) {
            resultBox.textContent =
                currentLang === "ar"
                    ? "حدث خطأ أثناء قراءة تاريخ الانتهاء."
                    : "Error while reading expiry date.";

            resultBox.style.color = "red";
        }

        return null;
    }
}


// =====================================================
// OCR TIMEOUT
// =====================================================

function recognizeWithTimeout(image, timeout = 20000) {
    return Promise.race([
        Tesseract.recognize(
            image,
            "eng",
            {
                logger: m => {
                    if (m.status) {
                        console.log(
                            "OCR:",
                            m.status,
                            m.progress
                                ? Math.round(m.progress * 100) + "%"
                                : ""
                        );
                    }
                }
            }
        ),

        new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error("OCR timeout"));
            }, timeout);
        })
    ]);
}


// =====================================================
// CREATE OCR IMAGES
// =====================================================

async function createOCRImages(file) {

    const img = await loadImageFromFile(file);

    const normal = improveCanvas(
        img,
        false,
        false
    );

    const enhanced = improveCanvas(
        img,
        true,
        false
    );

    const gray = improveCanvas(
        img,
        true,
        true
    );

    return {
        normal,
        enhanced,
        gray
    };
}


// =====================================================
// LOAD IMAGE
// =====================================================

function loadImageFromFile(file) {
    return new Promise((resolve, reject) => {

        const img = new Image();

        img.onload = () => resolve(img);

        img.onerror = reject;

        img.src = URL.createObjectURL(file);
    });
}


// =====================================================
// IMPROVE IMAGE
// =====================================================

function improveCanvas(
    img,
    enhance = false,
    grayscale = false
) {

    let maxWidth = 1800;
    let scale = Math.min(
        1,
        maxWidth / img.width
    );

    let width = Math.round(
        img.width * scale
    );

    let height = Math.round(
        img.height * scale
    );

    const canvas =
        document.createElement("canvas");

    canvas.width = width;
    canvas.height = height;

    const ctx =
        canvas.getContext("2d", {
            willReadFrequently: true
        });

    ctx.drawImage(
        img,
        0,
        0,
        width,
        height
    );

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

        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        if (grayscale) {

            let gray =
                0.299 * r +
                0.587 * g +
                0.114 * b;

            data[i] =
                data[i + 1] =
                data[i + 2] =
                gray;

        } else if (enhance) {

            let factor = 1.45;

            r = ((r - 128) * factor) + 128;
            g = ((g - 128) * factor) + 128;
            b = ((b - 128) * factor) + 128;

            data[i] =
                Math.max(
                    0,
                    Math.min(255, r)
                );

            data[i + 1] =
                Math.max(
                    0,
                    Math.min(255, g)
                );

            data[i + 2] =
                Math.max(
                    0,
                    Math.min(255, b)
                );
        }
    }

    ctx.putImageData(
        imageData,
        0,
        0
    );

    return canvas;
}


// =====================================================
// FIND EXPIRY DATE
// =====================================================

function findExpiry(text) {

    if (!text) return null;

    let normalized =
        normalizeOCRText(text);

    console.log(
        "OCR NORMALIZED:",
        normalized
    );

    /*
     * الأولوية:
     *
     * EXPIRY DATE
     * EXPIRY
     * EXP
     * EX
     * E
     *
     * ولا نعتمد PROD / MFG / MFD
     */

    const lines =
        normalized
            .split(/\n+/)
            .map(x => x.trim())
            .filter(Boolean);

    // -------------------------------------------------
    // 1. EXPIRY DATE
    // -------------------------------------------------

    const expiryDatePatterns = [
        /\bEXPIRY\s*DATE\s*[:\-]?\s*(\d{1,4})\s*[\/.\-]\s*(\d{1,2})\s*[\/.\-]\s*(\d{2,4})\b/i,

        /\bEXPIRY\s*DATE\s*[:\-]?\s*(\d{1,2})\s*[\/.\-]\s*(\d{1,2})\s*[\/.\-]\s*(\d{2,4})\b/i,

        /\bEXPIRY\s*[:\-]?\s*(\d{1,4})\s*[\/.\-]\s*(\d{1,2})\s*[\/.\-]\s*(\d{2,4})\b/i,

        /\bEXP\s*[:\-]?\s*(\d{1,4})\s*[\/.\-]\s*(\d{1,2})\s*[\/.\-]\s*(\d{2,4})\b/i,

        /\bEX\s*[:\-]?\s*(\d{1,4})\s*[\/.\-]\s*(\d{1,2})\s*[\/.\-]\s*(\d{2,4})\b/i,

        /\bE\s*[:\-]?\s*(\d{1,4})\s*[\/.\-]\s*(\d{1,2})\s*[\/.\-]\s*(\d{2,4})\b/i
    ];

    for (const line of lines) {

        for (
            const pattern
            of expiryDatePatterns
        ) {

            const match =
                line.match(pattern);

            if (match) {

                const date =
                    convertDateParts(
                        match[1],
                        match[2],
                        match[3]
                    );

                if (date) {
                    return date;
                }
            }
        }
    }


    // -------------------------------------------------
    // 2. E / EXP + MONTH / YEAR
    // -------------------------------------------------

    const monthYearPatterns = [
        /\bEXPIRY\s*DATE\s*[:\-]?\s*(\d{1,2})\s*[\/.\-]\s*(\d{4})\b/i,

        /\bEXPIRY\s*[:\-]?\s*(\d{1,2})\s*[\/.\-]\s*(\d{4})\b/i,

        /\bEXP\s*[:\-]?\s*(\d{1,2})\s*[\/.\-]\s*(\d{4})\b/i,

        /\bEX\s*[:\-]?\s*(\d{1,2})\s*[\/.\-]\s*(\d{4})\b/i,

        /\bE\s*[:\-]?\s*(\d{1,2})\s*[\/.\-]\s*(\d{4})\b/i
    ];

    for (const line of lines) {

        for (
            const pattern
            of monthYearPatterns
        ) {

            const match =
                line.match(pattern);

            if (match) {

                const month =
                    parseInt(
                        match[1],
                        10
                    );

                const year =
                    parseInt(
                        match[2],
                        10
                    );

                if (
                    month >= 1 &&
                    month <= 12 &&
                    year >= 2000 &&
                    year <= 2100
                ) {

                    return (
                        String(year) +
                        "-" +
                        String(month)
                            .padStart(2, "0") +
                        "-01"
                    );
                }
            }
        }
    }


    // -------------------------------------------------
    // 3. SEARCH WHOLE TEXT
    // -------------------------------------------------

    const fullPatterns = [

        /\bEXPIRY\s*DATE\s*[:\-]?\s*(\d{1,4})\s*[\/.\-]\s*(\d{1,2})\s*[\/.\-]\s*(\d{2,4})\b/i,

        /\bEXPIRY\s*[:\-]?\s*(\d{1,4})\s*[\/.\-]\s*(\d{1,2})\s*[\/.\-]\s*(\d{2,4})\b/i,

        /\bEXP\s*[:\-]?\s*(\d{1,4})\s*[\/.\-]\s*(\d{1,2})\s*[\/.\-]\s*(\d{2,4})\b/i,

        /\bEX\s*[:\-]?\s*(\d{1,4})\s*[\/.\-]\s*(\d{1,2})\s*[\/.\-]\s*(\d{2,4})\b/i,

        /\bE\s*[:\-]?\s*(\d{1,4})\s*[\/.\-]\s*(\d{1,2})\s*[\/.\-]\s*(\d{2,4})\b/i
    ];

    for (
        const pattern
        of fullPatterns
    ) {

        const match =
            normalized.match(pattern);

        if (match) {

            const date =
                convertDateParts(
                    match[1],
                    match[2],
                    match[3]
                );

            if (date) {
                return date;
            }
        }
    }


    // -------------------------------------------------
    // 4. EXP + MONTH/YEAR FROM WHOLE TEXT
    // -------------------------------------------------

    const monthYearFull = [
        /\bEXPIRY\s*DATE\s*[:\-]?\s*(\d{1,2})\s*[\/.\-]\s*(\d{4})\b/i,

        /\bEXPIRY\s*[:\-]?\s*(\d{1,2})\s*[\/.\-]\s*(\d{4})\b/i,

        /\bEXP\s*[:\-]?\s*(\d{1,2})\s*[\/.\-]\s*(\d{4})\b/i,

        /\bEX\s*[:\-]?\s*(\d{1,2})\s*[\/.\-]\s*(\d{4})\b/i,

        /\bE\s*[:\-]?\s*(\d{1,2})\s*[\/.\-]\s*(\d{4})\b/i
    ];

    for (
        const pattern
        of monthYearFull
    ) {

        const match =
            normalized.match(pattern);

        if (match) {

            const month =
                parseInt(
                    match[1],
                    10
                );

            const year =
                parseInt(
                    match[2],
                    10
                );

            if (
                month >= 1 &&
                month <= 12 &&
                year >= 2000 &&
                year <= 2100
            ) {

                return (
                    String(year) +
                    "-" +
                    String(month)
                        .padStart(2, "0") +
                    "-01"
                );
            }
        }
    }


    return null;
}


// =====================================================
// NORMALIZE OCR TEXT
// =====================================================

function normalizeOCRText(text) {

    return String(text || "")
        .replace(/[|]/g, "I")
        .replace(/[，]/g, ",")
        .replace(/[：]/g, ":")
        .replace(/[–—−]/g, "-")
        .replace(/[Ｏ]/g, "O")
        .replace(/[Ｅ]/g, "E")
        .replace(/[Ｐ]/g, "P")
        .replace(/[Ｘ]/g, "X")
        .replace(/[\/\\]/g, "/")
        .replace(/\r/g, "\n")
        .replace(/[ \t]+/g, " ")
        .replace(/\n\s+/g, "\n")
        .trim();
}


// =====================================================
// CONVERT DATE PARTS
// =====================================================

function convertDateParts(a, b, c) {

    let first =
        parseInt(a, 10);

    let second =
        parseInt(b, 10);

    let third =
        parseInt(c, 10);

    if (
        Number.isNaN(first) ||
        Number.isNaN(second) ||
        Number.isNaN(third)
    ) {
        return null;
    }

    let day;
    let month;
    let year;


    // -----------------------------------------------
    // YYYY/MM/DD
    // -----------------------------------------------

    if (
        first >= 1900 &&
        first <= 2100
    ) {

        year = first;
        month = second;
        day = third;

    }

    // -----------------------------------------------
    // DD/MM/YYYY
    // -----------------------------------------------

    else if (
        third >= 1900 &&
        third <= 2100
    ) {

        day = first;
        month = second;
        year = third;

    }

    // -----------------------------------------------
    // DD/MM/YY
    // -----------------------------------------------

    else {

        day = first;
        month = second;
        year = third;

        if (year < 100) {

            year =
                year >= 50
                    ? 1900 + year
                    : 2000 + year;
        }
    }


    // -----------------------------------------------
    // VALIDATE
    // -----------------------------------------------

    if (
        month < 1 ||
        month > 12
    ) {
        return null;
    }

    if (
        day < 1 ||
        day > 31
    ) {
        return null;
    }

    if (
        year < 2000 ||
        year > 2100
    ) {
        return null;
    }


    return makeDate(
        year,
        month,
        day
    );
}


// =====================================================
// MAKE DATE
// =====================================================

function makeDate(
    year,
    month,
    day
) {

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

    return (
        String(year) +
        "-" +
        String(month)
            .padStart(2, "0") +
        "-" +
        String(day)
            .padStart(2, "0")
    );
}


// =====================================================
// ARABIC DATE FORMAT
// =====================================================

function formatDateArabic(dateString) {

    if (!dateString) {
        return "";
    }

    const parts =
        dateString.split("-");

    if (parts.length !== 3) {
        return dateString;
    }

    return (
        parts[2] +
        "/" +
        parts[1] +
        "/" +
        parts[0]
    );
}


// =====================================================
// AUTO OCR WHEN IMAGE IS SELECTED
// =====================================================

document.addEventListener(
    "change",
    function (e) {

        const target =
            e.target;

        if (
            target &&
            target.type === "file" &&
            target.files &&
            target.files.length
        ) {

            const isImage =
                target.accept &&
                target.accept.includes("image");

            if (isImage) {

                const file =
                    target.files[0];

                setTimeout(() => {
                    readExpiry(file);
                }, 300);
            }
        }
    }
);// =====================================================
// PRINT PRODUCT
// =====================================================

function printProduct(product) {

    if (!product) return;

    const name =
        product.name || "";

    const barcode =
        product.barcode || "";

    const expiry =
        product.expiryDate ||
        product.expiry ||
        "";

    const quantity =
        product.quantity ?? "";

    const html = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<title>${esc(name)}</title>

<style>
    body {
        font-family: Arial, sans-serif;
        padding: 30px;
        direction: rtl;
    }

    .card {
        max-width: 500px;
        margin: auto;
        border: 1px solid #ddd;
        border-radius: 15px;
        padding: 25px;
    }

    h1 {
        margin-top: 0;
    }

    .row {
        display: flex;
        justify-content: space-between;
        padding: 10px 0;
        border-bottom: 1px solid #eee;
    }

    .label {
        font-weight: bold;
    }

    @media print {
        button {
            display: none;
        }

        body {
            padding: 0;
        }
    }
</style>
</head>

<body>

<div class="card">

<h1>${esc(name)}</h1>

<div class="row">
    <span class="label">الباركود</span>
    <span>${esc(barcode)}</span>
</div>

<div class="row">
    <span class="label">تاريخ الانتهاء</span>
    <span>${esc(expiry)}</span>
</div>

<div class="row">
    <span class="label">الكمية</span>
    <span>${esc(String(quantity))}</span>
</div>

<br>

<button onclick="window.print()">
    طباعة
</button>

</div>

</body>
</html>
`;

    const win =
        window.open(
            "",
            "_blank",
            "width=700,height=700"
        );

    if (!win) return;

    win.document.write(html);
    win.document.close();
}


// =====================================================
// NOTIFICATIONS
// =====================================================

function showNotification(
    message,
    type = "info"
) {

    let box =
        document.getElementById(
            "appNotification"
        );

    if (!box) {

        box =
            document.createElement("div");

        box.id =
            "appNotification";

        box.style.position =
            "fixed";

        box.style.top =
            "20px";

        box.style.left =
            "50%";

        box.style.transform =
            "translateX(-50%)";

        box.style.zIndex =
            "99999";

        box.style.padding =
            "14px 22px";

        box.style.borderRadius =
            "12px";

        box.style.fontWeight =
            "bold";

        box.style.boxShadow =
            "0 5px 20px rgba(0,0,0,.2)";

        document.body.appendChild(box);
    }


    if (type === "success") {
        box.style.background =
            "#d1fae5";

        box.style.color =
            "#065f46";

    } else if (type === "error") {

        box.style.background =
            "#fee2e2";

        box.style.color =
            "#991b1b";

    } else {

        box.style.background =
            "#e0f2fe";

        box.style.color =
            "#075985";
    }

    box.textContent =
        message;

    box.style.display =
        "block";


    clearTimeout(
        box._timer
    );

    box._timer =
        setTimeout(() => {

            box.style.display =
                "none";

        }, 3500);
}


// =====================================================
// CHECK EXPIRY
// =====================================================

function checkExpiryStatus(
    expiryDate
) {

    if (!expiryDate) {
        return {
            status: "unknown",
            days: null
        };
    }

    const today =
        new Date();

    today.setHours(
        0,
        0,
        0,
        0
    );

    const expiry =
        new Date(
            expiryDate
        );

    expiry.setHours(
        0,
        0,
        0,
        0
    );

    const diff =
        Math.ceil(
            (
                expiry - today
            ) /
            86400000
        );

    if (diff < 0) {

        return {
            status: "expired",
            days: diff
        };

    }

    if (diff <= 30) {

        return {
            status: "soon",
            days: diff
        };
    }

    return {
        status: "valid",
        days: diff
    };
}


// =====================================================
// EXPIRY TEXT
// =====================================================

function getExpiryText(
    expiryDate
) {

    const result =
        checkExpiryStatus(
            expiryDate
        );

    if (
        result.status === "expired"
    ) {

        return currentLang === "ar"
            ? `منتهي منذ ${Math.abs(result.days)} يوم`
            : `Expired ${Math.abs(result.days)} days ago`;
    }

    if (
        result.status === "soon"
    ) {

        return currentLang === "ar"
            ? `متبقي ${result.days} يوم`
            : `${result.days} days remaining`;
    }

    if (
        result.status === "valid"
    ) {

        return currentLang === "ar"
            ? `متبقي ${result.days} يوم`
            : `${result.days} days remaining`;
    }

    return "";
}


// =====================================================
// LANGUAGE
// =====================================================

const translations = {

    ar: {
        title:
            "متابعة انتهاء المنتجات",

        addProduct:
            "إضافة منتج",

        productName:
            "اسم المنتج",

        barcode:
            "الباركود",

        expiryDate:
            "تاريخ الانتهاء",

        quantity:
            "الكمية",

        save:
            "حفظ",

        cancel:
            "إلغاء",

        edit:
            "تعديل",

        delete:
            "حذف",

        search:
            "بحث",

        scan:
            "مسح الباركود",

        camera:
            "الكاميرا",

        noProducts:
            "لا توجد منتجات",

        expired:
            "منتهي",

        soon:
            "قارب على الانتهاء",

        valid:
            "صالح",

        readExpiry:
            "قراءة تاريخ الانتهاء",

        uploadImage:
            "رفع صورة",

        productImage:
            "صورة المنتج"
    },

    en: {
        title:
            "Product Expiry Tracker",

        addProduct:
            "Add Product",

        productName:
            "Product Name",

        barcode:
            "Barcode",

        expiryDate:
            "Expiry Date",

        quantity:
            "Quantity",

        save:
            "Save",

        cancel:
            "Cancel",

        edit:
            "Edit",

        delete:
            "Delete",

        search:
            "Search",

        scan:
            "Scan Barcode",

        camera:
            "Camera",

        noProducts:
            "No products",

        expired:
            "Expired",

        soon:
            "Expiring Soon",

        valid:
            "Valid",

        readExpiry:
            "Read Expiry Date",

        uploadImage:
            "Upload Image",

        productImage:
            "Product Image"
    }
};


// =====================================================
// SET TEXT
// =====================================================

function setText(
    selector,
    key
) {

    const element =
        document.querySelector(
            selector
        );

    if (!element) return;

    const value =
        translations[
            currentLang
        ]?.[key];

    if (value) {
        element.textContent =
            value;
    }
}


// =====================================================
// APPLY LANGUAGE
// =====================================================

function applyLanguage() {

    document.documentElement.lang =
        currentLang;

    document.documentElement.dir =
        currentLang === "ar"
            ? "rtl"
            : "ltr";


    document.title =
        translations[
            currentLang
        ]?.title ||
        document.title;


    document
        .querySelectorAll(
            "[data-i18n]"
        )
        .forEach(element => {

            const key =
                element.dataset.i18n;

            const value =
                translations[
                    currentLang
                ]?.[key];

            if (value) {
                element.textContent =
                    value;
            }
        });


    document
        .querySelectorAll(
            "[data-i18n-placeholder]"
        )
        .forEach(element => {

            const key =
                element.dataset
                    .i18nPlaceholder;

            const value =
                translations[
                    currentLang
                ]?.[key];

            if (value) {

                element.placeholder =
                    value;
            }
        });


    localStorage.setItem(
        "appLanguage",
        currentLang
    );


    if (typeof render === "function") {
        render();
    }
}


// =====================================================
// LANGUAGE BUTTON
// =====================================================

document.addEventListener(
    "click",
    function (e) {

        const button =
            e.target.closest(
                "[data-language], #languageBtn, #langBtn"
            );

        if (!button) return;

        currentLang =
            currentLang === "ar"
                ? "en"
                : "ar";

        applyLanguage();
    }
);


// =====================================================
// DELETE CONFIRMATION
// =====================================================

window.confirmDelete =
    function (message) {

        return confirm(
            message ||
            (
                currentLang === "ar"
                    ? "هل أنت متأكد من حذف المنتج؟"
                    : "Are you sure you want to delete this product?"
            )
        );
    };


// =====================================================
// START APP
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        const savedLang =
            localStorage.getItem(
                "appLanguage"
            );

        if (
            savedLang === "ar" ||
            savedLang === "en"
        ) {

            currentLang =
                savedLang;
        }

        applyLanguage();

        try {
            await loadProducts();
        } catch (error) {
            console.error(
                "Initial products loading error:",
                error
            );
        }

        // تشغيل البحث
        const searchInput =
            document.querySelector(
                "#searchInput, #search"
            );

        if (searchInput) {

            searchInput.addEventListener(
                "input",
                function () {

                    if (
                        typeof search === "function"
                    ) {
                        search(
                            this.value
                        );
                    }
                }
            );
        }

        // زر مسح الباركود
        const scanBtn =
            document.querySelector(
                "#scanBtn, #startScanner, [data-scan]"
            );

        if (scanBtn) {

            scanBtn.addEventListener(
                "click",
                function () {

                    if (
                        typeof startScanner ===
                        "function"
                    ) {

                        startScanner();
                    }
                }
            );
        }


        // زر إيقاف الكاميرا
        const stopScanBtn =
            document.querySelector(
                "#stopScanner"
            );

        if (stopScanBtn) {

            stopScanBtn.addEventListener(
                "click",
                function () {

                    if (
                        typeof stopScanner ===
                        "function"
                    ) {

                        stopScanner();
                    }
                }
            );
        }


        // زر اللغة
        const langButton =
            document.querySelector(
                "#languageBtn, #langBtn"
            );

        if (langButton) {

            langButton.textContent =
                currentLang === "ar"
                    ? "English"
                    : "العربية";
        }
    });


// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================

window.addEventListener(
    "error",
    function (event) {

        console.error(
            "Application error:",
            event.error ||
            event.message
        );
    }
);


// =====================================================
// GLOBAL UNHANDLED PROMISE
// =====================================================

window.addEventListener(
    "unhandledrejection",
    function (event) {

        console.error(
            "Unhandled promise rejection:",
            event.reason
        );
    }
);


// =====================================================
// FINISHED
// =====================================================
