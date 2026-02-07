/* =========================================================
   PdfSwift — Tools Engine (Client-Side Only)
   All tools run locally on the user's device.
========================================================= */

/* فتح الأدوات داخل مودال */
function openTool(toolName) {
    const modal = document.createElement("div");
    modal.className = "modal open";

    modal.innerHTML = `
        <div class="modal-content">
            <h3>أداة: ${getToolTitle(toolName)}</h3>
            <p>اختر ملفًا من جهازك لبدء استخدام الأداة.</p>

            <input type="file" id="toolFile" accept="image/*,.pdf" />

            <div style="margin-top: 18px;">
                <button class="btn btn-primary" onclick="runTool('${toolName}')">تشغيل الأداة</button>
                <button class="modal-close" onclick="this.closest('.modal').remove()">إغلاق</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

/* أسماء الأدوات */
function getToolTitle(tool) {
    const titles = {
        absher: "تجهيز صورة أبشر",
        img2pdf: "تحويل صورة إلى PDF",
        pdf2img: "تحويل PDF إلى صور",
        compress: "ضغط الصور",
        crop: "قص الصور",
        rotate: "تدوير الصور"
    };
    return titles[tool] || "أداة غير معروفة";
}

/* تشغيل الأداة */
function runTool(toolName) {
    const fileInput = document.getElementById("toolFile");
    if (!fileInput.files.length) {
        alert("الرجاء اختيار ملف أولاً.");
        return;
    }

    const file = fileInput.files[0];

    switch (toolName) {
        case "absher":
            prepareAbsherPhoto(file);
            break;

        case "img2pdf":
            convertImageToPDF(file);
            break;

        case "pdf2img":
            convertPDFToImages(file);
            break;

        case "compress":
            compressImage(file);
            break;

        case "crop":
            cropImage(file);
            break;

        case "rotate":
            rotateImage(file);
            break;

        default:
            alert("الأداة غير معروفة.");
    }
}

/* =========================================================
   1) تجهيز صورة أبشر
========================================================= */

function prepareAbsherPhoto(file) {
    const img = new Image();
    img.src = URL.createObjectURL(file);

    img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 600;
        canvas.height = 800;

        const ctx = canvas.getContext("2d");

        // خلفية بيضاء
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // رسم الصورة في المنتصف
        const ratio = Math.min(600 / img.width, 800 / img.height);
        const newW = img.width * ratio;
        const newH = img.height * ratio;

        ctx.drawImage(
            img,
            (600 - newW) / 2,
            (800 - newH) / 2,
            newW,
            newH
        );

        downloadCanvas(canvas, "absher-photo.jpg");
    };
}

/* =========================================================
   2) تحويل صورة → PDF
========================================================= */

function convertImageToPDF(file) {
    const reader = new FileReader();
    reader.onload = function () {
        const img = new Image();
        img.src = reader.result;

        img.onload = () => {
            const pdf = new jspdf.jsPDF({
                orientation: img.width > img.height ? "l" : "p",
                unit: "px",
                format: [img.width, img.height]
            });

            pdf.addImage(img, "JPEG", 0, 0, img.width, img.height);
            pdf.save("converted.pdf");
        };
    };
    reader.readAsDataURL(file);
}

/* =========================================================
   3) تحويل PDF → صور
========================================================= */

function convertPDFToImages(file) {
    const reader = new FileReader();
    reader.onload = async function () {
        const pdf = await pdfjsLib.getDocument({ data: reader.result }).promise;

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 2 });

            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            canvas.width = viewport.width;
            canvas.height = viewport.height;

            await page.render({ canvasContext: ctx, viewport }).promise;

            downloadCanvas(canvas, `page-${i}.jpg`);
        }
    };
    reader.readAsArrayBuffer(file);
}

/* =========================================================
   4) ضغط الصور
========================================================= */

function compressImage(file) {
    const img = new Image();
    img.src = URL.createObjectURL(file);

    img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        const compressed = canvas.toDataURL("image/jpeg", 0.5);
        downloadBase64(compressed, "compressed.jpg");
    };
}

/* =========================================================
   5) قص الصور
========================================================= */

function cropImage(file) {
    const img = new Image();
    img.src = URL.createObjectURL(file);

    img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width * 0.8;
        canvas.height = img.height * 0.8;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, img.width * 0.1, img.height * 0.1, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);

        downloadCanvas(canvas, "cropped.jpg");
    };
}

/* =========================================================
   6) تدوير الصور
========================================================= */

function rotateImage(file) {
    const img = new Image();
    img.src = URL.createObjectURL(file);

    img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.height;
        canvas.height = img.width;

        const ctx = canvas.getContext("2d");

        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(Math.PI / 2);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);

        downloadCanvas(canvas, "rotated.jpg");
    };
}

/* =========================================================
   أدوات التحميل
========================================================= */

function downloadCanvas(canvas, filename) {
    const link = document.createElement("a");
    link.download = filename;
    link.href = canvas.toDataURL("image/jpeg");
    link.click();
}

function downloadBase64(data, filename) {
    const link = document.createElement("a");
    link.download = filename;
    link.href = data;
    link.click();
}
