const $ = (s) => document.querySelector(s);

let products = [];
let scanner = null;
let dateStream = null;
let currentLang = localStorage.getItem("expiryLang") || "ar";


const T = {

  ar: {
    title: "فحص الصلاحية",
    subtitle: "إدارة المنتجات وتواريخ الانتهاء",

    total: "إجمالي المنتجات",
    soon: "تنتهي خلال 5 أيام",
    expired: "منتهية",
    quantity: "إجمالي الكمية",

    add: "إضافة منتج",
    scan: "📷 مسح Barcode / QR",

    name: "اسم المنتج",
    namePlaceholder: "مثال: حليب نادك",

    qty: "الكمية",

    expiry: "تاريخ الانتهاء",
    readDate: "📷 قراءة التاريخ",

    barcode: "الباركود / QR",
    barcodePlaceholder: "سيتم تعبئته تلقائياً",

    image: "صورة المنتج",
    notes: "ملاحظات",
    notesPlaceholder: "اختياري",

    save: "💾 حفظ المنتج",
    clear: "مسح الحقول",

    products: "المنتجات",
    search: "بحث بالاسم أو الباركود",
    print: "🖨️ طباعة",

    scanTitle: "مسح Barcode / QR",
    scanHint: "وجّه الكاميرا نحو الباركود...",

    dateTitle: "قراءة تاريخ الانتهاء",
    dateHint: "وجّه الكاميرا نحو تاريخ الانتهاء",
    readNow: "📸 قراءة التاريخ",

    valid: "صالح",
    soonStatus: "قريب الانتهاء",
    expiredStatus: "منتهي",

    found: "تم العثور على المنتج",
    notFound: "لم يتم العثور على المنتج. أدخل الاسم مرة واحدة.",

    saved: "تم حفظ المنتج بنجاح",
    updated: "تم تعديل المنتج بنجاح",

    deleteConfirm: "هل تريد حذف المنتج؟",

    cameraError:
      "تعذر تشغيل الكاميرا. تأكد من السماح للموقع باستخدام الكاميرا.",

    dateNotFound:
      "لم يتم العثور على تاريخ واضح. حاول تقريب الكاميرا من التاريخ.",

    noProducts:
      "لا توجد منتجات.",

    today:
      "ينتهي اليوم",

    tomorrow:
      "ينتهي غداً"
  },


  en: {
    title: "Expiry Check",
    subtitle: "Manage products and expiry dates",

    total: "Total Products",
    soon: "Expiring Within 5 Days",
    expired: "Expired",
    quantity: "Total Quantity",

    add: "Add Product",
    scan: "📷 Scan Barcode / QR",

    name: "Product Name",
    namePlaceholder: "Example: Milk",

    qty: "Quantity",

    expiry: "Expiry Date",
    readDate: "📷 Read Date",

    barcode: "Barcode / QR",
    barcodePlaceholder: "Automatically filled",

    image: "Product Image",
    notes: "Notes",
    notesPlaceholder: "Optional",

    save: "💾 Save Product",
    clear: "Clear",

    products: "Products",
    search: "Search by name or barcode",
    print: "🖨️ Print",

    scanTitle: "Scan Barcode / QR",
    scanHint: "Point the camera at the barcode...",

    dateTitle: "Read Expiry Date",
    dateHint: "Point the camera at the expiry date",
    readNow: "📸 Read Date",

    valid: "Valid",
    soonStatus: "Expiring Soon",
    expiredStatus: "Expired",

    found: "Product found",
    notFound: "Product not found. Enter the name once.",

    saved: "Product saved successfully",
    updated: "Product updated successfully",

    deleteConfirm: "Delete this product?",

    cameraError:
      "Unable to start camera. Please allow camera access.",

    dateNotFound:
      "No clear date found. Move the camera closer.",

    noProducts:
      "No products.",

    today:
      "Expires today",

    tomorrow:
      "Expires tomorrow"
  }
};


function tr(key) {
  return T[currentLang][key] || key;
}


function applyLanguage() {

  document.documentElement.lang =
    currentLang;

  document.documentElement.dir =
    currentLang === "ar"
      ? "rtl"
      : "ltr";


  $("#languageBtn").textContent =
    currentLang === "ar"
      ? "English"
      : "العربية";


  $("#title").textContent =
    tr("title");

  $("#subtitle").textContent =
    tr("subtitle");

  $("#totalLabel").textContent =
    tr("total");

  $("#soonLabel").textContent =
    tr("soon");

  $("#expiredLabel").textContent =
    tr("expired");

  $("#qtyLabel").textContent =
    tr("quantity");

  $("#addTitle").textContent =
    tr("add");

  $("#scanBtn").textContent =
    tr("scan");

  $("#nameLabel").textContent =
    tr("name");

  $("#quantityLabel").textContent =
    tr("qty");

  $("#expiryLabel").textContent =
    tr("expiry");

  $("#readDateBtn").textContent =
    tr("readDate");

  $("#barcodeLabel").textContent =
    tr("barcode");

  $("#imageLabel").textContent =
    tr("image");

  $("#notesLabel").textContent =
    tr("notes");

  $("#saveBtn").textContent =
    tr("save");

  $("#resetBtn").textContent =
    tr("clear");

  $("#productsTitle").textContent =
    tr("products");

  $("#search").placeholder =
    tr("search");

  $("#printBtn").textContent =
    tr("print");

  $("#scannerTitle").textContent =
    tr("scanTitle");

  $("#scanStatus").textContent =
    tr("scanHint");

  $("#dateScannerTitle").textContent =
    tr("dateTitle");

  $("#dateStatus").textContent =
    tr("dateHint");

  $("#captureDateBtn").textContent =
    tr("readNow");

  $("#name").placeholder =
    tr("namePlaceholder");

  $("#barcode").placeholder =
    tr("barcodePlaceholder");

  $("#notes").placeholder =
    tr("notesPlaceholder");


  render();
}


$("#languageBtn").onclick =
  () => {

    currentLang =
      currentLang === "ar"
        ? "en"
        : "ar";

    localStorage.setItem(
      "expiryLang",
      currentLang
    );

    applyLanguage();
  };


function daysLeft(date) {

  const end =
    new Date(
      date + "T23:59:59"
    );

  return Math.ceil(
    (end - new Date()) /
    86400000
  );
}


function esc(value) {

  return String(
    value ?? ""
  ).replace(
    /[&<>"']/g,
    c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[c])
  );
}


async function loadProducts() {

  try {

    const response =
      await fetch(
        "/api/products"
      );

    if (!response.ok) {
      throw new Error();
    }

    products =
      await response.json();

    render();

  } catch (error) {

    console.error(error);

    $("#products").innerHTML =
      `<div class="alert">
        ⚠️ تعذر تحميل المنتجات.
      </div>`;
  }
}


function render() {

  const q =
    ($("#search").value || "")
      .trim()
      .toLowerCase();


  const list =
    products.filter(p =>
      `${p.name} ${p.barcode || ""}`
        .toLowerCase()
        .includes(q)
    );


  const soon =
    products.filter(p => {

      const d =
        daysLeft(
          p.expiry_date
        );

      return d >= 0 &&
             d <= 5;
    });


  const expired =
    products.filter(p =>
      daysLeft(
        p.expiry_date
      ) < 0
    );


  $("#total").textContent =
    products.length;

  $("#soon").textContent =
    soon.length;

  $("#expired").textContent =
    expired.length;

  $("#qty").textContent =
    products.reduce(
      (sum, p) =>
        sum +
        Number(
          p.quantity || 0
        ),
      0
    );


  $("#alerts").innerHTML =
    soon.map(p => {

      const d =
        daysLeft(
          p.expiry_date
        );

      let text;

      if (d === 0) {
        text = tr("today");
      } else if (d === 1) {
        text = tr("tomorrow");
      } else {
        text =
          currentLang === "ar"
            ? `ينتهي خلال ${d} أيام`
            : `Expires in ${d} days`;
      }

      return `
        <div class="alert">
          ⚠️ <b>${esc(p.name)}</b>
          — ${text}
          (${esc(p.expiry_date)})
        </div>
      `;
    }).join("");


  $("#products").innerHTML =
    list.length
      ? list.map(productCard).join("")
      : `<p>${tr("noProducts")}</p>`;
}


function productCard(p) {

  const d =
    daysLeft(
      p.expiry_date
    );


  let cls = "ok";
  let status = tr("valid");

  if (d < 0) {

    cls = "expired";
    status =
      tr("expiredStatus");

  } else if (d <= 5) {

    cls = "soon";
    status =
      tr("soonStatus");
  }


  const image =
    p.image_key
      ? `/images/${encodeURIComponent(p.image_key)}`
      : `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='90' height='90'%3E%3Crect width='100%25' height='100%25' fill='%23e8edf3'/%3E%3C/svg%3E`;


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
            📦 ${esc(p.quantity)}
          </span>

          <span>
            📅 ${esc(p.expiry_date)}
          </span>

          ${
            p.barcode
              ? `<span>
                  ▣ ${esc(p.barcode)}
                </span>`
              : ""
          }

        </div>

      </div>

      <div>

        <span
          class="status ${cls}">
          ${status}
        </span>

        <div
          class="actions"
          style="margin-top:8px">

          <button
            class="secondary"
            onclick="editProduct(${p.id})">
            ${currentLang === "ar"
              ? "تعديل"
              : "Edit"}
          </button>

          <button
            class="secondary"
            onclick="deleteProduct(${p.id})">
            ${currentLang === "ar"
              ? "حذف"
              : "Delete"}
          </button>

        </div>

      </div>

    </article>
  `;
}


/* حفظ */

$("#productForm").addEventListener(
  "submit",
  async e => {

    e.preventDefault();


    const id =
      $("#id").value;


    let imageKey =
      products.find(
        p =>
          String(p.id) ===
          String(id)
      )?.image_key ||
      null;


    const file =
      $("#image").files[0];


    try {

      if (file) {

        const form =
          new FormData();

        form.append(
          "image",
          file
        );


        const upload =
          await fetch(
            "/api/images",
            {
              method: "POST",
              body: form
            }
          );


        const data =
          await upload.json();


        if (!upload.ok) {
          throw new Error();
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

        notes:
          $("#notes").value.trim(),

        image_key:
          imageKey
      };


      const response =
        await fetch(
          id
            ? `/api/products/${id}`
            : "/api/products",
          {
            method:
              id
                ? "PUT"
                : "POST",

            headers: {
              "content-type":
                "application/json"
            },

            body:
              JSON.stringify(
                body
              )
          }
        );


      if (!response.ok) {
        throw new Error();
      }


      resetForm();

      await loadProducts();


      alert(
        id
          ? tr("updated")
          : tr("saved")
      );

    } catch (error) {

      console.error(error);

      alert(
        "حدث خطأ أثناء الحفظ."
      );
    }
  }
);


function resetForm() {

  $("#productForm")
    .reset();

  $("#id").value =
    "";

  $("#quantity").value =
    1;

  $("#preview").innerHTML =
    "";
}


$("#resetBtn").onclick =
  resetForm;


/* تعديل */

window.editProduct =
  function(id) {

    const p =
      products.find(
        x => x.id === id
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


    $("#preview").innerHTML =
      p.image_key
        ? `<img
            src="/images/${encodeURIComponent(p.image_key)}"
            style="max-width:180px;border-radius:12px;margin-top:10px;">`
        : "";


    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };


/* حذف */

window.deleteProduct =
  async function(id) {

    if (
      !confirm(
        tr("deleteConfirm")
      )
    ) {
      return;
    }


    try {

      await fetch(
        `/api/products/${id}`,
        {
          method: "DELETE"
        }
      );

      await loadProducts();

    } catch {

      alert(
        "حدث خطأ أثناء الحذف."
      );
    }
  };


/* بحث */

$("#search").oninput =
  render;


/* صورة */

$("#image").onchange =
  () => {

    const file =
      $("#image").files[0];

    if (!file) {

      $("#preview").innerHTML =
        "";

      return;
    }


    const url =
      URL.createObjectURL(
        file
      );


    $("#preview").innerHTML =
      `<img
        src="${url}"
        style="max-width:180px;border-radius:12px;margin-top:10px;">`;
  };


/* =================================
   Barcode / QR
================================= */

$("#scanBtn").onclick =
  async () => {

    $("#scanner")
      .classList
      .remove("hidden");


    $("#scanStatus").textContent =
      tr("scanHint");


    try {

      scanner =
        new Html5Qrcode(
          "barcodeReader"
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

        async text => {

          await processBarcode(
            text
          );
        },

        () => {}

      );

    } catch (error) {

      console.error(
        error
      );

      alert(
        tr("cameraError")
      );

      closeScanner();
    }
  };


async function processBarcode(
  code
) {

  code =
    String(code)
      .trim();


  $("#barcode").value =
    code;


  /* البحث المحلي */

  let product =
    products.find(
      p =>
        String(
          p.barcode || ""
        ).trim() === code
    );


  if (product) {

    await closeScanner();

    editProduct(
      product.id
    );

    alert(
      `${tr("found")}: ${product.name}`
    );

    return;
  }


  /*
   البحث في Open Food Facts
  */

  try {

    const response =
      await fetch(
        `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json`
      );


    if (response.ok) {

      const data =
        await response.json();


      if (
        data.status === 1 &&
        data.product
      ) {

        const p =
          data.product;


        const name =
          p.product_name_ar ||
          p.product_name ||
          p.generic_name_ar ||
          p.generic_name ||
          "";


        if (name) {

          $("#name").value =
            name;


          await closeScanner();


          alert(
            `${tr("found")}: ${name}`
          );

          return;
        }
      }
    }

  } catch (error) {

    console.log(
      "Product lookup failed",
      error
    );
  }


  await closeScanner();

  alert(
    tr("notFound")
  );

  $("#name").focus();
}


async function closeScanner() {

  if (scanner) {

    try {
      await scanner.stop();
    } catch {}

    try {
      await scanner.clear();
    } catch {}
  }


  scanner =
    null;


  $("#barcodeReader").innerHTML =
    "";


  $("#scanner")
    .classList
    .add("hidden");
}


$("#closeScan").onclick =
  closeScanner;


/* =================================
   OCR تاريخ الانتهاء
================================= */

$("#readDateBtn").onclick =
  async () => {

    $("#dateScanner")
      .classList
      .remove("hidden");


    $("#dateStatus").textContent =
      tr("dateHint");


    try {

      dateStream =
        await navigator
          .mediaDevices
          .getUserMedia({

            video: {
              facingMode: {
                ideal:
                  "environment"
              }
            },

            audio: false

          });


      $("#dateVideo")
        .srcObject =
        dateStream;

    } catch (error) {

      console.error(
        error
      );

      alert(
        tr("cameraError")
      );

      closeDateScanner();
    }
  };


$("#captureDateBtn").onclick =
  async () => {

    $("#dateStatus").textContent =
      "جاري قراءة التاريخ...";


    try {

      const video =
        $("#dateVideo");


      if (
        !video.videoWidth
      ) {

        throw new Error();
      }


      const canvas =
        document.createElement(
          "canvas"
        );


      canvas.width =
        video.videoWidth;


      canvas.height =
        video.videoHeight;


      const ctx =
        canvas.getContext(
          "2d"
        );


      ctx.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height
      );


      /*
       OCR
      */

      const result =
        await Tesseract.recognize(
          canvas,
          "eng",
          {
            logger: data => {

              if (
                data.status ===
                "recognizing text"
              ) {

                const percent =
                  Math.round(
                    data.progress *
                    100
                  );

                $("#dateStatus")
                  .textContent =
                  `Reading ${percent}%`;
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
        findDate(
          text
        );


      if (!date) {

        $("#dateStatus")
          .textContent =
          tr("dateNotFound");

        alert(
          tr("dateNotFound")
        );

        return;
      }


      $("#expiry").value =
        date;


      closeDateScanner();


      alert(
        `${tr("expiry")}: ${date}`
      );

    } catch (error) {

      console.error(
        error
      );

      alert(
        tr("dateNotFound")
      );
    }
  };


function findDate(text) {

  let s =
    String(text)
      .replace(/O/g, "0")
      .replace(/I/g, "1")
      .replace(/l/g, "1")
      .replace(/\s+/g, " ");


  /* DD/MM/YYYY */

  let m =
    s.match(
      /\b(\d{1,2})[\/.\-](\d{1,2})[\/.\-](20\d{2}|19\d{2})\b/
    );


  if (m) {

    return makeDate(
      m[3],
      m[2],
      m[1]
    );
  }


  /* YYYY/MM/DD */

  m =
    s.match(
      /\b(20\d{2}|19\d{2})[\/.\-](\d{1,2})[\/.\-](\d{1,2})\b/
    );


  if (m) {

    return makeDate(
      m[1],
      m[2],
      m[3]
    );
  }


  /* MM/DD/YYYY */

  m =
    s.match(
      /\b(\d{1,2})[\/.\-](\d{1,2})[\/.\-](20\d{2}|19\d{2})\b/
    );


  if (m) {

    /*
     نفترض DD/MM/YYYY
     أولاً لأن الاستخدام
     المحلي أكثر شيوعاً.
    */

    return makeDate(
      m[3],
      m[1],
      m[2]
    );
  }


  return null;
}


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


  const date =
    new Date(
      year,
      month - 1,
      day
    );


  if (
    date.getFullYear() !== year ||
    date.getMonth() !==
      month - 1 ||
    date.getDate() !== day
  ) {

    return null;
  }


  return (
    `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
  );
}


function closeDateScanner() {

  if (dateStream) {

    dateStream
      .getTracks()
      .forEach(
        track =>
          track.stop()
      );

    dateStream =
      null;
  }


  $("#dateVideo")
    .srcObject =
    null;


  $("#dateScanner")
    .classList
    .add("hidden");
}


$("#closeDateScan").onclick =
  closeDateScanner;


/* =================================
   التنبيهات
================================= */

$("#notifyBtn").onclick =
  async () => {

    if (
      !("Notification" in window)
    ) {

      alert(
        "Notifications are not supported."
      );

      return;
    }


    const permission =
      await Notification
        .requestPermission();


    if (
      permission === "granted"
    ) {

      new Notification(
        T[currentLang].title,
        {
          body:
            currentLang === "ar"
              ? "تم تفعيل التنبيهات."
              : "Notifications enabled."
        }
      );
    }
  };


/* =================================
   الطباعة
================================= */

$("#printBtn").onclick =
  () => {

    const w =
      window.open(
        "",
        "_blank"
      );


    if (!w) return;


    const rtl =
      currentLang === "ar";


    w.document.write(`
      <html
        lang="${currentLang}"
        dir="${rtl ? "rtl" : "ltr"}">

      <head>

        <meta charset="UTF-8">

        <title>
          ${rtl
            ? "تقرير المنتجات"
            : "Product Report"}
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
          }

          th, td {
            border: 1px solid #999;
            padding: 10px;
          }

        </style>

      </head>

      <body>

        <h1>
          ${rtl
            ? "تقرير المنتجات — فحص الصلاحية"
            : "Product Report — Expiry Check"}
        </h1>

        <table>

          <tr>

            <th>
              ${rtl ? "المنتج" : "Product"}
            </th>

            <th>
              ${rtl ? "الكمية" : "Quantity"}
            </th>

            <th>
              ${rtl ? "تاريخ الانتهاء" : "Expiry Date"}
            </th>

            <th>
              ${rtl ? "الباركود" : "Barcode"}
            </th>

          </tr>

          ${products.map(p => `
            <tr>

              <td>
                ${esc(p.name)}
              </td>

              <td>
                ${esc(p.quantity)}
              </td>

              <td>
                ${esc(p.expiry_date)}
              </td>

              <td>
                ${esc(p.barcode || "")}
              </td>

            </tr>
          `).join("")}

        </table>

        <script>
          window.onload = () => window.print();
        <\/script>

      </body>
      </html>
    `);


    w.document.close();
  };


/* تشغيل */

applyLanguage();

loadProducts();
