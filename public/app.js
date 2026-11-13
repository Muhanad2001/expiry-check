const $ = (s) => document.querySelector(s);

let products = [];
let scanner = null;
let loading = false;


/* =========================
   أدوات عامة
========================= */

function today() {
  return new Date().toISOString().slice(0, 10);
}


function diff(d) {
  const expiry = new Date(d + "T23:59:59");
  const now = new Date();

  return Math.ceil(
    (expiry - now) / 86400000
  );
}


function esc(s) {
  return String(s ?? "").replace(
    /[&<>"']/g,
    (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[c])
  );
}


/* =========================
   تحميل المنتجات
========================= */

async function load() {

  try {

    const response = await fetch("/api/products");

    if (!response.ok) {
      throw new Error("فشل تحميل المنتجات");
    }

    products = await response.json();

    render();

  } catch (error) {

    console.error(error);

    $("#products").innerHTML = `
      <div class="alert">
        ⚠️ تعذر تحميل المنتجات.
        تأكد من اتصال الموقع بقاعدة البيانات.
      </div>
    `;
  }
}


/* =========================
   عرض المنتجات
========================= */

function render() {

  const q = ($("#search")?.value || "")
    .trim()
    .toLowerCase();


  const list = products.filter((p) => {

    const text =
      `${p.name} ${p.barcode || ""}`.toLowerCase();

    return text.includes(q);
  });


  const soonProducts = products.filter((p) => {

    const d = diff(p.expiry_date);

    return d >= 0 && d <= 5;
  });


  const expiredProducts = products.filter((p) => {

    return diff(p.expiry_date) < 0;
  });


  $("#total").textContent =
    products.length;


  $("#soon").textContent =
    soonProducts.length;


  $("#expired").textContent =
    expiredProducts.length;


  $("#qty").textContent =
    products.reduce(
      (sum, p) =>
        sum + Number(p.quantity || 0),
      0
    );


  /* التنبيهات */

  $("#alerts").innerHTML =
    soonProducts.length

      ? soonProducts
          .map((p) => {

            const d = diff(p.expiry_date);

            let message = "";

            if (d === 0) {
              message = "ينتهي اليوم";
            } else if (d === 1) {
              message = "ينتهي غداً";
            } else {
              message = `ينتهي خلال ${d} أيام`;
            }

            return `
              <div class="alert">
                ⚠️
                <b>${esc(p.name)}</b>
                —
                ${message}
                (${esc(p.expiry_date)})
              </div>
            `;
          })
          .join("")

      : "";


  /* المنتجات */

  $("#products").innerHTML =
    list.map(card).join("")
    ||
    "<p>لا توجد منتجات.</p>";
}


/* =========================
   بطاقة المنتج
========================= */

function card(p) {

  const d = diff(p.expiry_date);

  let cls = "ok";
  let txt = "صالح";

  if (d < 0) {

    cls = "expired";
    txt = "منتهي";

  } else if (d <= 5) {

    cls = "soon";
    txt = "قريب الانتهاء";
  }


  const image = p.image_key
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
              ? `<span>▣ ${esc(p.barcode)}</span>`
              : ""
          }

        </div>

      </div>


      <div>

        <span class="status ${cls}">
          ${txt}
        </span>


        <div
          class="actions"
          style="margin-top:8px">

          <button
            class="secondary"
            onclick="edit(${p.id})">
            تعديل
          </button>


          <button
            class="secondary"
            onclick="del(${p.id})">
            حذف
          </button>

        </div>

      </div>

    </article>
  `;
}


/* =========================
   حفظ المنتج
========================= */

$("#productForm").addEventListener(
  "submit",
  async (e) => {

    e.preventDefault();

    if (loading) return;

    loading = true;

    try {

      const id = $("#id").value;


      let image_key =
        products.find(
          (p) => String(p.id) === String(id)
        )?.image_key || null;


      const file =
        $("#image").files[0];


      /* رفع الصورة */

      if (file) {

        const fd =
          new FormData();

        fd.append("image", file);


        const imageResponse =
          await fetch(
            "/api/images",
            {
              method: "POST",
              body: fd
            }
          );


        if (!imageResponse.ok) {
          throw new Error(
            "فشل رفع الصورة"
          );
        }


        const imageData =
          await imageResponse.json();


        image_key =
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

        notes:
          $("#notes").value.trim(),

        image_key
      };


      if (!body.name ||
          !body.expiry_date) {

        alert(
          "يرجى إدخال اسم المنتج وتاريخ الانتهاء."
        );

        return;
      }


      const url =
        id
          ? `/api/products/${id}`
          : "/api/products";


      const method =
        id
          ? "PUT"
          : "POST";


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


      if (!response.ok) {
        throw new Error(
          "فشل حفظ المنتج"
        );
      }


      reset();

      await load();


      alert(
        id
          ? "تم تعديل المنتج بنجاح."
          : "تم حفظ المنتج بنجاح."
      );

    } catch (error) {

      console.error(error);

      alert(
        "حدث خطأ أثناء حفظ المنتج."
      );

    } finally {

      loading = false;
    }
  }
);


/* =========================
   إعادة الحقول
========================= */

function reset() {

  $("#productForm").reset();

  $("#id").value = "";

  $("#quantity").value = 1;

  $("#preview").innerHTML = "";
}


/* =========================
   تعديل المنتج
========================= */

window.edit = function (id) {

  const p =
    products.find(
      (x) => x.id === id
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


  $("#image").value = "";


  $("#preview").innerHTML =
    p.image_key
      ? `
        <img
          src="/images/${encodeURIComponent(p.image_key)}"
          style="max-width:180px;border-radius:12px;margin-top:10px;">
      `
      : "";


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
};


/* =========================
   حذف المنتج
========================= */

window.del = async function (id) {

  if (!confirm("هل تريد حذف المنتج؟")) {
    return;
  }


  try {

    const response =
      await fetch(
        `/api/products/${id}`,
        {
          method: "DELETE"
        }
      );


    if (!response.ok) {
      throw new Error(
        "فشل حذف المنتج"
      );
    }


    await load();

  } catch (error) {

    console.error(error);

    alert(
      "حدث خطأ أثناء حذف المنتج."
    );
  }
};


/* =========================
   الأزرار
========================= */

$("#resetBtn").onclick =
  reset;


$("#search").oninput =
  render;


/* =========================
   معاينة الصورة
========================= */

$("#image").addEventListener(
  "change",
  () => {

    const file =
      $("#image").files[0];


    if (!file) {

      $("#preview").innerHTML =
        "";

      return;
    }


    const url =
      URL.createObjectURL(file);


    $("#preview").innerHTML = `
      <img
        src="${url}"
        style="
          max-width:180px;
          max-height:180px;
          object-fit:cover;
          border-radius:12px;
          margin-top:10px;
        ">
    `;
  }
);


/* =========================
   الطباعة
========================= */

$("#printBtn").onclick =
  () => {

    const w =
      window.open(
        "",
        "_blank"
      );


    if (!w) {

      alert(
        "اسمح للنوافذ المنبثقة من الموقع."
      );

      return;
    }


    w.document.write(`
      <!doctype html>

      <html
        lang="ar"
        dir="rtl">

      <head>

        <meta charset="utf-8">

        <title>
          تقرير المنتجات
        </title>

        <style>

          body {
            font-family:
              Arial,
              sans-serif;

            padding: 25px;
          }

          h1 {
            text-align: center;
          }

          table {
            width: 100%;
            border-collapse:
              collapse;
          }

          th,
          td {
            border:
              1px solid #999;

            padding: 8px;

            text-align:
              right;
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

          </tr>


          ${products
            .map(
              (p) => `
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
              `
            )
            .join("")}

        </table>


        <script>
          window.onload = function () {
            window.print();
          };
        <\/script>

      </body>

      </html>
    `);


    w.document.close();
  };


/* =========================
   التنبيهات
========================= */

$("#notifyBtn").onclick =
  async () => {

    if (!("Notification" in window)) {

      alert(
        "المتصفح لا يدعم التنبيهات."
      );

      return;
    }


    const permission =
      await Notification.requestPermission();


    if (permission === "granted") {

      new Notification(
        "فحص الصلاحية",
        {
          body:
            "سيتم عرض تنبيهات المنتجات عند فتح الموقع."
        }
      );

    } else {

      alert(
        "لم يتم السماح بالتنبيهات."
      );
    }
  };


/* =========================
   قارئ Barcode / QR
========================= */

$("#scanBtn").onclick =
  async () => {

    if (
      typeof Html5Qrcode ===
      "undefined"
    ) {

      alert(
        "لم يتم تحميل قارئ الباركود."
      );

      return;
    }


    $("#scanner")
      .classList
      .remove("hidden");


    $("#scanStatus").textContent =
      "جاري تشغيل الكاميرا...";


    try {

      scanner =
        new Html5Qrcode(
          "video"
        );


      const formats = [

        Html5QrcodeSupportedFormats.QR_CODE,

        Html5QrcodeSupportedFormats.EAN_13,

        Html5QrcodeSupportedFormats.EAN_8,

        Html5QrcodeSupportedFormats.UPC_A,

        Html5QrcodeSupportedFormats.UPC_E,

        Html5QrcodeSupportedFormats.CODE_128,

        Html5QrcodeSupportedFormats.CODE_39

      ];


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
          },

          aspectRatio:
            1.7777778,

          formatsToSupport:
            formats
        },


        (decodedText) => {

          handleBarcode(
            decodedText
          );

        },


        () => {

          /*
            لا نفعل شيئًا
            أثناء محاولات القراءة
          */

        }

      );


      $("#scanStatus").textContent =
        "وجّه الكاميرا نحو الباركود...";

    } catch (error) {

      console.error(
        "Scanner error:",
        error
      );


      $("#scanStatus").textContent =
        "تعذر تشغيل الكاميرا.";


      alert(
        "تعذر تشغيل الكاميرا.\n\n" +
        "تأكد من السماح للموقع باستخدام الكاميرا."
      );


      await closeScanner();
    }
  };


/* =========================
   نتيجة المسح
========================= */

async function handleBarcode(
  value
) {

  if (!value) {
    return;
  }


  const cleanValue =
    String(value).trim();


  $("#barcode").value =
    cleanValue;


  $("#scanStatus").textContent =
    "تمت قراءة الباركود: " +
    cleanValue;


  const found =
    products.find(
      (p) =>
        String(
          p.barcode || ""
        ).trim() === cleanValue
    );


  if (found) {

    await closeScanner();


    edit(found.id);


    setTimeout(
      () => {

        alert(
          "تم العثور على المنتج:\n" +
          found.name
        );

      },
      200
    );

    return;
  }


  await closeScanner();


  setTimeout(
    () => {

      alert(
        "تمت قراءة الباركود:\n" +
        cleanValue +
        "\n\n" +
        "يمكنك الآن إدخال بيانات المنتج ثم الضغط على حفظ."
      );

    },
    200
  );
}


/* =========================
   إغلاق القارئ
========================= */

async function closeScanner() {

  try {

    if (scanner) {

      try {

        await scanner.stop();

      } catch (e) {}

      try {

        await scanner.clear();

      } catch (e) {}

    }

  } catch (error) {

    console.error(
      error
    );

  }


  scanner = null;


  $("#video").innerHTML =
    "";


  $("#scanner")
    .classList
    .add("hidden");


  $("#scanStatus").textContent =
    "وجّه الكاميرا نحو الباركود...";
}


$("#closeScan").onclick =
  closeScanner;


/* =========================
   تحميل أولي
========================= */

load();
