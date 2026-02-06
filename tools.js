/* ============================
   التنقل بين الأدوات
============================ */
document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
  btn.addEventListener('click', () => {
    const tool = btn.dataset.tool;
    if (!tool) return;

    document.querySelectorAll('.tool-selector, .section-title, main > p')
      .forEach(el => el.style.display = 'none');

    document.getElementById(`tool-${tool}`).style.display = 'block';
    document.getElementById('back-to-tools').style.display = 'block';
  });
});

document.getElementById('back-to-tools').addEventListener('click', () => {
  document.querySelectorAll('.tool-section').forEach(el => el.style.display = 'none');
  document.getElementById('back-to-tools').style.display = 'none';
  document.querySelector('.tool-selector').style.display = 'grid';
  document.querySelector('.section-title').style.display = 'block';
  document.querySelector('main > p').style.display = 'block';
});

/* ============================
   نافذة الأدوات الجديدة
============================ */
function openModal(title, desc) {
  document.getElementById("modal-title").innerText = title;
  document.getElementById("modal-desc").innerText = desc;
  document.getElementById("modal").style.display = "flex";
}

function closeModal() {
  document.getElementById("modal").style.display = "none";
}

/* ============================
   دمج ملفات PDF
============================ */
document.getElementById("btn-merge").addEventListener("click", async () => {
  const files = document.getElementById("merge-files").files;
  const status = document.getElementById("merge-status");

  if (!files.length) {
    status.textContent = "الرجاء اختيار ملفات PDF";
    status.className = "status error";
    return;
  }

  status.textContent = "جاري الدمج...";
  status.className = "status";

  try {
    const mergedPdf = await PDFLib.PDFDocument.create();

    for (let file of files) {
      const bytes = await file.arrayBuffer();
      const pdf = await PDFLib.PDFDocument.load(bytes);
      const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      pages.forEach(p => mergedPdf.addPage(p));
    }

    const mergedBytes = await mergedPdf.save();
    const blob = new Blob([mergedBytes], { type: "application/pdf" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "merged.pdf";
    link.click();

    status.textContent = "تم الدمج بنجاح ✔️";
    status.className = "status success";

  } catch (err) {
    status.textContent = "حدث خطأ أثناء الدمج";
    status.className = "status error";
  }
});

/* ============================
   تدوير PDF
============================ */
document.getElementById("btn-rotate").addEventListener("click", async () => {
  const file = document.getElementById("rotate-file").files[0];
  const degree = parseInt(document.getElementById("rotate-degree").value);
  const status = document.getElementById("rotate-status");

  if (!file) {
    status.textContent = "الرجاء اختيار ملف PDF";
    status.className = "status error";
    return;
  }

  status.textContent = "جاري التدوير...";
  status.className = "status";

  try {
    const bytes = await file.arrayBuffer();
    const pdfDoc = await PDFLib.PDFDocument.load(bytes);

    pdfDoc.getPages().forEach(page => {
      page.setRotation(PDFLib.degrees(degree));
    });

    const newBytes = await pdfDoc.save();
    const blob = new Blob([newBytes], { type: "application/pdf" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "rotated.pdf";
    link.click();

    status.textContent = "تم التدوير بنجاح ✔️";
    status.className = "status success";

  } catch (err) {
    status.textContent = "حدث خطأ أثناء التدوير";
    status.className = "status error";
  }
});

/* ============================
   تقسيم PDF
============================ */
document.getElementById("btn-split").addEventListener("click", async () => {
  const file = document.getElementById("split-file").files[0];
  const ranges = document.getElementById("split-ranges").value;
  const status = document.getElementById("split-status");

  if (!file || !ranges.trim()) {
    status.textContent = "الرجاء اختيار ملف وكتابة الصفحات";
    status.className = "status error";
    return;
  }

  status.textContent = "جاري استخراج الصفحات...";
  status.className = "status";

  try {
    const bytes = await file.arrayBuffer();
    const pdfDoc = await PDFLib.PDFDocument.load(bytes);

    const parts = ranges.split(",");
    let counter = 1;

    for (let part of parts) {
      let [start, end] = part.split("-").map(n => parseInt(n) - 1);
      if (isNaN(end)) end = start;

      const newPdf = await PDFLib.PDFDocument.create();
      const pages = await newPdf.copyPages(pdfDoc, [...Array(end - start + 1).keys()].map(i => start + i));
      pages.forEach(p => newPdf.addPage(p));

      const newBytes = await newPdf.save();
      const blob = new Blob([newBytes], { type: "application/pdf" });

      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `pages-${counter}.pdf`;
      link.click();

      counter++;
    }

    status.textContent = "تم استخراج الصفحات ✔️";
    status.className = "status success";

  } catch (err) {
    status.textContent = "حدث خطأ أثناء استخراج الصفحات";
    status.className = "status error";
  }
});

/* ============================
   علامة مائية
============================ */
document.getElementById("btn-watermark").addEventListener("click", async () => {
  const file = document.getElementById("watermark-file").files[0];
  const text = document.getElementById("watermark-text").value;
  const status = document.getElementById("watermark-status");

  if (!file || !text.trim()) {
    status.textContent = "الرجاء اختيار ملف وكتابة النص";
    status.className = "status error";
    return;
  }

  status.textContent = "جاري إضافة العلامة...";
  status.className = "status";

  try {
    const bytes = await file.arrayBuffer();
    const pdfDoc = await PDFLib.PDFDocument.load(bytes);

    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);

    pages.forEach(page => {
      page.drawText(text, {
        x: 50,
        y: page.getHeight() / 2,
        size: 40,
        font,
        color: PDFLib.rgb(0.8, 0.1, 0.1),
        opacity: 0.25,
        rotate: PDFLib.degrees(30)
      });
    });

    const newBytes = await pdfDoc.save();
    const blob = new Blob([newBytes], { type: "application/pdf" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "watermarked.pdf";
    link.click();

    status.textContent = "تمت إضافة العلامة ✔️";
    status.className = "status success";

  } catch (err) {
    status.textContent = "حدث خطأ أثناء إضافة العلامة";
    status.className = "status error";
  }
});
