const $ = (s) => document.querySelector(s);

let products = [];
let scanner = null;
let currentLang = "ar";


// =====================================================
// الأدوات
// =====================================================

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}


function normalizeArabicNumbers(text) {
  return String(text || "")
    .replace(/[٠-٩]/g, d =>
      "٠١٢٣٤٥٦٧٨٩".indexOf(d)
    )
    .replace(/[۰-۹]/g, d =>
      "۰۱۲۳۴۵۶۷۸۹".indexOf(d)
    );
}


function cleanDateText(text) {
  return normalizeArabicNumbers(text)
    .replace(/[–—−]/g, "-")
    .replace(/[／]/g, "/")
    .replace(/[٫]/g, ".")
    .replace(/\s+/g, " ")
    .trim();
}


// =====================================================
// التاريخ اليدوي
// =====================================================

function normalizeManualExpiry(value) {

  let v = cleanDateText(value);

  if (!v) return "";

  // 19/02/2027
  let m = v.match(
    /^(\d{1,2})\s*[\/.\-]\s*(\d{1,2})\s*[\/.\-]\s*(\d{2,4})$/
  );

  if (m) {
    let year = Number(m[3]);

    if (String(m[3]).length === 2) {
      year += 2000;
    }

    const date = makeDate(year, m[2], m[1]);

    if (date) return date;
  }


  // 09/2028
  m = v.match(
    /^(\d{1,2})\s*[\/.\-]\s*(20\d{2})$/
  );

  if (m) {

    const month = Number(m[1]);
    const year = Number(m[2]);

    if (
      month >= 1 &&
      month <= 12
    ) {
      return `${year}-${String(month).padStart(2, "0")}-01`;
    }
  }


  // 2028/09
  m = v.match(
    /^(20\d{2})\s*[\/.\-]\s*(\d{1,2})$/
  );

  if (m) {

    const year = Number(m[1]);
    const month = Number(m[2]);

    if (
      month >= 1 &&
      month <= 12
    ) {
      return `${year}-${String(month).padStart(2, "0")}-01`;
    }
  }


  return null;
}


function displayExpiry(value) {

  if (!value) return "";

  // YYYY-MM-DD
  let m = String(value).match(
    /^(\d{4})-(\d{2})-(\d{2})$/
  );

  if (m) {
    return `${m[3]}/${m[2]}/${m[1]}`;
  }

  return value;
}


// =====================================================
// إنشاء تاريخ
// =====================================================

function makeDate(year, month, day) {

  year = Number(year);
  month = Number(month);
  day = Number(day);

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

  const d = new Date(
    year,
    month - 1,
    day
  );

  if (
    d.getFullYear() !== year ||
    d.getMonth() !== month - 1 ||
    d.getDate() !== day
  ) {
    return null;
  }

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}


// =====================================================
// حساب الأيام
// =====================================================

function diffDays(date) {

  if (!date) return 99999;

  const d =
    new Date(date + "T23:59:59");

  return Math.ceil(
    (d - new Date()) / 86400000
  );
}


// =====================================================
// تحميل المنتجات
// =====================================================

async function loadProducts() {

  try {

    const r =
      await fetch("/api/products");

    products =
      await r.json();

    render();

  } catch (e) {

    console.error(e);

    if ($("#products")) {
      $("#products").innerHTML =
        `<div class="alert">⚠️ تعذر تحميل المنتجات.</div>`;
    }
  }
}


// =====================================================
// عرض المنتجات
// =====================================================

function render() {

  if (!$("#products")) return;

  const q =
    ($("#search")?.value || "")
      .trim()
      .toLowerCase();


  const list =
    products.filter(p => {

      const text =
        `${p.name || ""} ${p.barcode || ""}`
          .toLowerCase();

      return text.includes(q);
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
      products.filter(p =>
        diffDays(p.expiry_date) < 0
      ).length;
  }


  if ($("#qty")) {
    $("#qty").textContent =
      products.reduce(
        (sum, p) =>
          sum + Number(p.quantity || 0),
        0
      );
  }


  const soon =
    products.filter(p => {

      const d =
        diffDays(p.expiry_date);

      return d >= 0 && d <= 5;
    });


  if ($("#alerts")) {

    $("#alerts").innerHTML =
      soon.length
        ? soon.map(p => {

            const d =
              diffDays(p.expiry_date);

            return `
              <div class="alert">
                ⚠️ <b>${esc(p.name)}</b>
                —
                ${
                  d === 0
                    ? "ينتهي اليوم"
                    : `ينتهي خلال ${d} يوم`
                }
                (${displayExpiry(p.expiry_date)})
              </div>
            `;

          }).join("")
        : "";
  }


  $("#products").innerHTML =
    list.length
      ? list.map(productCard).join("")
      : "<p>لا توجد منتجات.</p>";
}


// =====================================================
// بطاقة المنتج
// =====================================================

function productCard(p) {

  const d =
    diffDays(p.expiry_date);


  let cls = "ok";
  let status = "صالح";


  if (d < 0) {

    cls = "expired";
    status = "منتهي";

  } else if (d <= 5) {

    cls = "soon";
    status = "قريب الانتهاء";
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
            📅 ${displayExpiry(p.expiry_date)}
          </span>

          ${
            p.barcode
              ? `<span>▣ ${esc(p.barcode)}</span>`
              : ""
          }

        </div>

        ${
          p.notes
            ? `<p>📝 ${esc(p.notes)}</p>`
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
// حفظ المنتج
// =====================================================

$("#productForm").addEventListener(
  "submit",
  async e => {

    e.preventDefault();


    const id =
      $("#id").value;


    const rawExpiry =
      $("#expiry").value.trim();


    const normalizedExpiry =
      normalizeManualExpiry(
        rawExpiry
      );


    if (!normalizedExpiry) {

      alert(
        "اكتب تاريخًا صحيحًا مثل:\n19/02/2027\nأو\n09/2028"
      );

      $("#expiry").focus();

      return;
    }


    let imageKey =
      products.find(
        p =>
          String(p.id) ===
          String(id)
      )?.image_key || null;


    const file =
      $("#image")?.files?.[0];


    if (file) {

      const fd =
        new FormData();

      fd.append(
        "image",
        file
      );


      const r =
        await fetch(
          "/api/images",
          {
            method: "POST",
            body: fd
          }
        );


      const data =
        await r.json();


      if (!r.ok) {

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
        normalizedExpiry,

      barcode:
        $("#barcode").value.trim(),

      image_key:
        imageKey,

      notes:
        $("#notes").value.trim()
    };


    const url =
      id
        ? `/api/products/${id}`
        : "/api/products";


    const r =
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
      await r.json();


    if (!r.ok) {

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


// =====================================================
// مسح
// =====================================================

function resetForm() {

  $("#productForm").reset();

  $("#id").value = "";

  $("#quantity").value = 1;

  if ($("#preview")) {
    $("#preview").innerHTML = "";
  }

  if ($("#ocrStatus")) {
    $("#ocrStatus").textContent = "";
  }
}


$("#resetBtn")
  .addEventListener(
    "click",
    resetForm
  );


// =====================================================
// تعديل
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
      displayExpiry(
        p.expiry_date
      );

    $("#barcode").value =
      p.barcode || "";

    $("#notes").value =
      p.notes || "";


    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };


// =====================================================
// حذف
// =====================================================

window.deleteProduct =
  async function(id) {

    if (
      !confirm(
        "هل تريد حذف المنتج؟"
      )
    ) {
      return;
    }


    await fetch(
      `/api/products/${id}`,
      {
        method: "DELETE"
      }
    );


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
                max-width:260px;
                max-height:260px;
                border-radius:14px;
                object-fit:contain;
              ">

          </div>

        `;
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

  $("#scanner")
    .classList
    .remove("hidden");


  $("#scanStatus")
    .textContent =
      "وجّه الكاميرا نحو الباركود...";


  try {

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


        $("#scanStatus").textContent =
          "🔍 جاري البحث عن اسم المنتج...";


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
            displayExpiry(
              local.expiry_date
            );

          $("#notes").value =
            local.notes || "";


          $("#scanStatus").textContent =
            `✅ تم العثور على المنتج: ${local.name}`;

          await stopScanner();

          return;
        }


        const external =
          await findProductByBarcode(
            barcode
          );


        if (
          external &&
          external.name
        ) {

          $("#name").value =
            external.name;


          $("#scanStatus").textContent =
            `✅ اسم المنتج: ${external.name}`;

        } else {

          $("#scanStatus").textContent =
            "⚠️ تم قراءة الباركود، لكن لم يتم العثور على اسم المنتج.";

        }


        setTimeout(
          stopScanner,
          1200
        );
      },

      () => {}

    );

  } catch (e) {

    console.error(e);

    $("#scanStatus").textContent =
      "❌ تعذر تشغيل الكاميرا.";
  }
}


async function findProductByBarcode(barcode) {

  try {

    const r =
      await fetch(
        `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`
      );


    if (!r.ok) return null;


    const data =
      await r.json();


    if (
      data.status !== 1 ||
      !data.product
    ) {
      return null;
    }


    const p =
      data.product;


    return {

      name:
        p.product_name_ar ||
        p.product_name_en ||
        p.product_name ||
        p.generic_name_ar ||
        p.generic_name_en ||
        p.generic_name ||
        ""
    };

  } catch {

    return null;
  }
}


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


if ($("#closeScan")) {

  $("#closeScan")
    .addEventListener(
      "click",
      stopScanner
    );
}


// =====================================================
// OCR — فتح أداة تحديد منطقة EXP/E
// =====================================================

if ($("#ocrBtn")) {

  $("#ocrBtn")
    .addEventListener(
      "click",
      openCropOCR
    );
}


function openCropOCR() {

  const file =
    $("#image")?.files?.[0];


  if (!file) {

    alert(
      "📷 اختر صورة المنتج أولاً."
    );

    return;
  }


  const old =
    document.getElementById(
      "ocrCropModal"
    );

  if (old) {
    old.remove();
  }


  const url =
    URL.createObjectURL(file);


  const modal =
    document.createElement(
      "div"
    );


  modal.id =
    "ocrCropModal";


  modal.style.cssText = `
    position:fixed;
    inset:0;
    z-index:99999;
    background:rgba(0,0,0,.88);
    display:flex;
    flex-direction:column;
    padding:15px;
    box-sizing:border-box;
  `;


  modal.innerHTML = `

    <div style="
      color:white;
      text-align:center;
      font-size:18px;
      font-weight:bold;
      margin:8px 0 12px;
    ">
      حدد سطر EXP / E بإصبعك
    </div>


    <div style="
      color:#ddd;
      text-align:center;
      font-size:14px;
      margin-bottom:10px;
    ">
      كبّر الصورة بإصبعين ثم حدد المنطقة التي تحتوي على التاريخ
    </div>


    <div
      id="cropArea"
      style="
        position:relative;
        flex:1;
        min-height:0;
        overflow:hidden;
        background:#111;
        border-radius:14px;
        touch-action:none;
      ">

      <img
        id="ocrSourceImage"
        src="${url}"
        style="
          position:absolute;
          left:0;
          top:0;
          width:100%;
          height:100%;
          object-fit:contain;
          touch-action:none;
          user-select:none;
        ">

      <div
        id="selectionBox"
        style="
          position:absolute;
          display:none;
          border:3px solid #00ff88;
          background:rgba(0,255,136,.12);
          box-sizing:border-box;
          pointer-events:none;
        ">
      </div>

    </div>


    <div style="
      display:flex;
      gap:10px;
      margin-top:12px;
    ">

      <button
        id="cropCancel"
        style="
          flex:1;
          padding:14px;
          border:0;
          border-radius:12px;
          background:#444;
          color:white;
          font-size:17px;
          font-weight:bold;
        ">
        إلغاء
      </button>


      <button
        id="cropRead"
        style="
          flex:1;
          padding:14px;
          border:0;
          border-radius:12px;
          background:#0b1324;
          color:white;
          font-size:17px;
          font-weight:bold;
        ">
        🔍 قراءة التاريخ
      </button>

    </div>

  `;


  document.body.appendChild(
    modal
  );


  setupCropSelection(
    modal,
    url
  );
}


// =====================================================
// تحديد منطقة التاريخ
// =====================================================

function setupCropSelection(
  modal,
  imageUrl
) {

  const area =
    modal.querySelector(
      "#cropArea"
    );


  const img =
    modal.querySelector(
      "#ocrSourceImage"
    );


  const box =
    modal.querySelector(
      "#selectionBox"
    );


  let startX = 0;
  let startY = 0;

  let selecting = false;


  area.addEventListener(
    "pointerdown",
    e => {

      selecting = true;

      const r =
        area.getBoundingClientRect();


      startX =
        e.clientX -
        r.left;

      startY =
        e.clientY -
        r.top;


      box.style.display =
        "block";


      box.style.left =
        `${startX}px`;

      box.style.top =
        `${startY}px`;

      box.style.width =
        "1px";

      box.style.height =
        "1px";


      area.setPointerCapture(
        e.pointerId
      );
    }
  );


  area.addEventListener(
    "pointermove",
    e => {

      if (!selecting) return;


      const r =
        area.getBoundingClientRect();


      let x =
        e.clientX -
        r.left;

      let y =
        e.clientY -
        r.top;


      x =
        Math.max(
          0,
          Math.min(
            r.width,
            x
          )
        );


      y =
        Math.max(
          0,
          Math.min(
            r.height,
            y
          )
        );


      const left =
        Math.min(
          startX,
          x
        );

      const top =
        Math.min(
          startY,
          y
        );


      const width =
        Math.abs(
          x -
          startX
        );


      const height =
        Math.abs(
          y -
          startY
        );


      box.style.left =
        `${left}px`;

      box.style.top =
        `${top}px`;

      box.style.width =
        `${width}px`;

      box.style.height =
        `${height}px`;
    }
  );


  area.addEventListener(
    "pointerup",
    () => {

      selecting =
        false;
    }
  );


  area.addEventListener(
    "pointercancel",
    () => {

      selecting =
        false;
    }
  );


  modal
    .querySelector(
      "#cropCancel"
    )
    .onclick =
    () => {

      URL.revokeObjectURL(
        imageUrl
      );

      modal.remove();
    };


  modal
    .querySelector(
      "#cropRead"
    )
    .onclick =
    async () => {

      const boxRect =
        box.getBoundingClientRect();


      const areaRect =
        area.getBoundingClientRect();


      if (
        boxRect.width < 15 ||
        boxRect.height < 10
      ) {

        alert(
          "حدد سطر EXP / E أولاً."
        );

        return;
      }


      const result =
        await cropSelectedImage(
          img,
          area,
          box
        );


      modal.remove();


      await runOCROnSelectedImage(
        result
      );


      URL.revokeObjectURL(
        imageUrl
      );
    };
}


// =====================================================
// قص المنطقة المحددة
// =====================================================

async function cropSelectedImage(
  img,
  area,
  box
) {

  await new Promise(
    resolve => {

      if (
        img.complete
      ) {
        resolve();
      } else {
        img.onload =
          resolve;
      }
    }
  );


  const areaRect =
    area.getBoundingClientRect();


  const boxRect =
    box.getBoundingClientRect();


  const sx =
    (boxRect.left -
      areaRect.left) /
    img.clientWidth;


  const sy =
    (boxRect.top -
      areaRect.top) /
    img.clientHeight;


  const sw =
    boxRect.width /
    img.clientWidth;


  const sh =
    boxRect.height /
    img.clientHeight;


  const naturalW =
    img.naturalWidth;


  const naturalH =
    img.naturalHeight;


  const sourceX =
    Math.max(
      0,
      Math.floor(
        sx *
        naturalW
      )
    );


  const sourceY =
    Math.max(
      0,
      Math.floor(
        sy *
        naturalH
      )
    );


  const sourceW =
    Math.min(
      naturalW -
        sourceX,
      Math.floor(
        sw *
        naturalW
      )
    );


  const sourceH =
    Math.min(
      naturalH -
        sourceY,
      Math.floor(
        sh *
        naturalH
      )
    );


  const scale =
    Math.max(
      5,
      1600 /
      sourceW
    );


  const canvas =
    document.createElement(
      "canvas"
    );


  canvas.width =
    Math.floor(
      sourceW *
      scale
    );


  canvas.height =
    Math.floor(
      sourceH *
      scale
    );


  const ctx =
    canvas.getContext(
      "2d"
    );


  ctx.drawImage(
    img,
    sourceX,
    sourceY,
    sourceW,
    sourceH,
    0,
    0,
    canvas.width,
    canvas.height
  );


  enhanceCanvas(
    ctx,
    canvas.width,
    canvas.height
  );


  return canvas;
}


// =====================================================
// تحسين صورة OCR
// =====================================================

function enhanceCanvas(
  ctx,
  width,
  height
) {

  const data =
    ctx.getImageData(
      0,
      0,
      width,
      height
    );


  const p =
    data.data;


  for (
    let i = 0;
    i < p.length;
    i += 4
  ) {

    let gray =
      0.299 * p[i] +
      0.587 * p[i + 1] +
      0.114 * p[i + 2];


    // تباين قوي
    gray =
      (gray - 128) *
      2.2 +
      128;


    gray =
      Math.max(
        0,
        Math.min(
          255,
          gray
        )
      );


    p[i] =
      gray;

    p[i + 1] =
      gray;

    p[i + 2] =
      gray;
  }


  ctx.putImageData(
    data,
    0,
    0
  );
}


// =====================================================
// تشغيل OCR
// =====================================================

async function runOCROnSelectedImage(
  canvas
) {

  let status =
    $("#ocrStatus");


  if (status) {

    status.textContent =
      "🔍 جاري قراءة التاريخ...";
  }


  try {

    const variants =
      createOCRVariants(
        canvas
      );


    let found =
      null;


    for (
      let i = 0;
      i < variants.length;
      i++
    ) {

      if (status) {

        status.textContent =
          `🔍 تحليل الصورة ${i + 1}/${variants.length}...`;
      }


      const result =
        await Tesseract.recognize(
          variants[i],
          "eng",
          {
            tessedit_pageseg_mode:
              "6"
          }
        );


      const text =
        result.data.text;


      console.log(
        "OCR:",
        text
      );


      found =
        findExpiry(
          text
        );


      if (found) {
        break;
      }
    }


    if (found) {

      $("#expiry").value =
        displayExpiry(
          found
        );


      if (status) {

        status.textContent =
          `✅ تم التعرف على التاريخ: ${displayExpiry(found)}`;
      }

    } else {

      if (status) {

        status.textContent =
          "⚠️ لم أتعرف على التاريخ. حدد سطر EXP / E بشكل أضيق وصوّر أوضح.";
      }
    }

  } catch (e) {

    console.error(
      e
    );


    if (status) {

      status.textContent =
        "❌ حدث خطأ أثناء قراءة التاريخ.";
    }
  }
}


// =====================================================
// نسخ OCR متعددة
// =====================================================

function createOCRVariants(
  canvas
) {

  const variants =
    [];


  variants.push(
    canvas
  );


  // نسخة مع عكس الألوان

  const inverted =
    document.createElement(
      "canvas"
    );


  inverted.width =
    canvas.width;

  inverted.height =
    canvas.height;


  const ctx =
    inverted.getContext(
      "2d"
    );


  ctx.drawImage(
    canvas,
    0,
    0
  );


  const data =
    ctx.getImageData(
      0,
      0,
      inverted.width,
      inverted.height
    );


  for (
    let i = 0;
    i < data.data.length;
    i += 4
  ) {

    data.data[i] =
      255 -
      data.data[i];

    data.data[i + 1] =
      255 -
      data.data[i + 1];

    data.data[i + 2] =
      255 -
      data.data[i + 2];
  }


  ctx.putImageData(
    data,
    0,
    0
  );


  variants.push(
    inverted
  );


  return variants;
}


// =====================================================
// استخراج التاريخ من OCR
// =====================================================

function findExpiry(text) {

  let value =
    cleanDateText(
      text
    ).toUpperCase();


  console.log(
    "CLEAN OCR:",
    value
  );


  let m;


  // ---------------------------------------------
  // EXP 09/2028
  // ---------------------------------------------

  m =
    value.match(
      /\b(?:EXP|EXPIRY|EX|E)\s*[:\-]?\s*(0?[1-9]|1[0-2])\s*[\/.\-]\s*(20\d{2})\b/
    );


  if (m) {

    return `${m[2]}-${String(m[1]).padStart(2, "0")}-01`;
  }


  // ---------------------------------------------
  // EXP 19/02/27
  // ---------------------------------------------

  m =
    value.match(
      /\b(?:EXP|EXPIRY|EX|E)\s*[:\-]?\s*(\d{1,2})\s*[\/.\-]\s*(\d{1,2})\s*[\/.\-]\s*(\d{2,4})\b/
    );


  if (m) {

    let y =
      Number(m[3]);

    if (
      String(m[3]).length === 2
    ) {
      y += 2000;
    }


    return makeDate(
      y,
      m[2],
      m[1]
    );
  }


  // ---------------------------------------------
  // EXP 19 02 27
  // ---------------------------------------------

  m =
    value.match(
      /\b(?:EXP|EXPIRY|EX|E)\s*[:\-]?\s*(\d{1,2})\s+(\d{1,2})\s+(\d{2,4})\b/
    );


  if (m) {

    let y =
      Number(m[3]);

    if (
      String(m[3]).length === 2
    ) {
      y += 2000;
    }


    return makeDate(
      y,
      m[2],
      m[1]
    );
  }


  // ---------------------------------------------
  // MM/YYYY
  // ---------------------------------------------

  m =
    value.match(
      /\b(0?[1-9]|1[0-2])\s*[\/.\-]\s*(20\d{2})\b/
    );


  if (m) {

    return `${m[2]}-${String(m[1]).padStart(2, "0")}-01`;
  }


  // ---------------------------------------------
  // DD/MM/YYYY
  // ---------------------------------------------

  m =
    value.match(
      /\b(\d{1,2})\s*[\/.\-]\s*(\d{1,2})\s*[\/.\-]\s*(\d{2,4})\b/
    );


  if (m) {

    let y =
      Number(m[3]);

    if (
      String(m[3]).length === 2
    ) {
      y += 2000;
    }


    return makeDate(
      y,
      m[2],
      m[1]
    );
  }


  // ---------------------------------------------
  // DD MM YY
  // ---------------------------------------------

  m =
    value.match(
      /\b(\d{1,2})\s+(\d{1,2})\s+(\d{2,4})\b/
    );


  if (m) {

    let y =
      Number(m[3]);

    if (
      String(m[3]).length === 2
    ) {
      y += 2000;
    }


    return makeDate(
      y,
      m[2],
      m[1]
    );
  }


  return null;
}


// =====================================================
// الطباعة
// =====================================================

if ($("#printBtn")) {

  $("#printBtn")
    .addEventListener(
      "click",
      () => {

        const win =
          window.open(
            "",
            "_blank"
          );


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
                ${displayExpiry(p.expiry_date)}
              </td>

              <td>
                ${esc(p.barcode || "")}
              </td>

              <td>
                ${esc(p.notes || "")}
              </td>

            </tr>

          `).join("");


        win.document.write(`

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
                font-family:Arial;
                padding:30px;
              }

              h1 {
                text-align:center;
              }

              table {
                width:100%;
                border-collapse:collapse;
              }

              th,
              td {
                border:1px solid #999;
                padding:9px;
                text-align:center;
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
    );
}


// =====================================================
// تشغيل
// =====================================================

loadProducts();
