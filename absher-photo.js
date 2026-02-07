window.addEventListener("DOMContentLoaded", () => {
  /* تحميل نماذج face-api */
  Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri("https://cdn.jsdelivr.net/npm/face-api.js/models"),
  ]).then(() => console.log("Face API Loaded"));

  let cropper = null;

  // فتح / إغلاق المودال (اعتمد على نفس الأسماء الموجودة في HTML)
  window.openModal = function (id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.style.display = "flex";

    if (id === "absher-modal") {
      const img = document.getElementById("image-preview");
      if (img.src && img.style.display !== "none") {
        setTimeout(() => {
          if (cropper) cropper.destroy();
          cropper = new Cropper(img, {
            viewMode: 1,
            aspectRatio: 1,
            autoCropArea: 1,
            movable: true,
            zoomable: true,
            scalable: true,
            rotatable: true,
            background: false,
          });
          detectFace();
        }, 200);
      }
    }
  };

  window.closeModal = function (id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.style.display = "none";
  };

  /* رفع صورة أبشر */
  const uploadInput = document.getElementById("upload-image");
  const imagePreview = document.getElementById("image-preview");
  const resultPreview = document.getElementById("result-preview");
  const statusEl = document.getElementById("status");

  if (uploadInput) {
    uploadInput.addEventListener("change", function () {
      const file = this.files[0];
      if (!file) return;

      imagePreview.src = URL.createObjectURL(file);
      imagePreview.style.display = "block";

      if (cropper) cropper.destroy();

      setTimeout(() => {
        cropper = new Cropper(imagePreview, {
          viewMode: 1,
          aspectRatio: 1,
          autoCropArea: 1,
          movable: true,
          zoomable: true,
          scalable: true,
          rotatable: true,
          background: false,
        });
        detectFace();
      }, 200);
    });
  }

  /* كشف الوجه */
  async function detectFace() {
    if (!imagePreview.src) return;
    try {
      const detection = await faceapi.detectSingleFace(
        imagePreview,
        new faceapi.TinyFaceDetectorOptions()
      );
      if (!detection || !cropper) return;

      const box = detection.box;
      cropper.setCropBoxData({
        left: box.x,
        top: box.y,
        width: box.width,
        height: box.height,
      });
    } catch (e) {
      console.warn("Face detection error:", e);
    }
  }

  /* المقاس المخصص */
  const presetSize = document.getElementById("preset-size");
  const customW = document.getElementById("custom-width");
  const customH = document.getElementById("custom-height");

  if (presetSize) {
    presetSize.addEventListener("change", function () {
      const custom = this.value === "custom";
      if (customW) customW.style.display = custom ? "block" : "none";
      if (customH) customH.style.display = custom ? "block" : "none";
    });
  }

  /* لون الخلفية */
  const bgSelect = document.getElementById("background");
  const customBg = document.getElementById("custom-bg");

  if (bgSelect) {
    bgSelect.addEventListener("change", function () {
      if (customBg)
        customBg.style.display = this.value === "custom" ? "block" : "none";
    });
  }

  /* زر تنفيذ أداة أبشر */
  const processBtn = document.getElementById("process-btn");
  if (processBtn) {
    processBtn.addEventListener("click", async () => {
      if (!statusEl) return;
      statusEl.textContent = "جاري معالجة الصورة...";
      statusEl.className = "status";

      if (!cropper) {
        statusEl.textContent = "الرجاء رفع صورة أولاً";
        statusEl.className = "status error";
        return;
      }

      let width, height;
      const preset = presetSize ? presetSize.value : "200x200";

      if (preset === "custom") {
        width = parseInt(customW.value);
        height = parseInt(customH.value);
      } else {
        const [w, h] = preset.split("x");
        width = parseInt(w);
        height = parseInt(h);
      }

      let bg = "white";
      const bgType = bgSelect ? bgSelect.value : "white";
      if (bgType === "transparent") bg = null;
      if (bgType === "custom" && customBg) bg = customBg.value;

      const maxKB = parseInt(document.getElementById("max-size").value);
      const format = document.getElementById("format").value;

      const canvas = cropper.getCroppedCanvas({
        width,
        height,
        fillColor: bg || "white",
      });

      let quality = 0.92;
      let output;

      try {
        do {
          output = canvas.toDataURL(`image/${format}`, quality);
          const sizeKB = Math.round((output.length * 3) / 4 / 1024);
          if (sizeKB <= maxKB) break;
          quality -= 0.05;
        } while (quality > 0.1);

        if (resultPreview) {
          resultPreview.innerHTML = `
            <h3>الصورة النهائية:</h3>
            <img src="${output}">
            <br><br>
            <a href="${output}" download="absher-photo.${format}" class="action-btn">تحميل الصورة</a>
          `;
        }

        statusEl.textContent = "تم تجهيز الصورة ✔️";
        statusEl.className = "status success";
      } catch (e) {
        console.error(e);
        statusEl.textContent = "حدث خطأ أثناء المعالجة";
        statusEl.className = "status error";
      }
    });
  }

  /* إزالة الخلفية */
  const removeBtn = document.getElementById("remove-bg-btn");
  if (removeBtn) {
    removeBtn.addEventListener("click", async () => {
      const file = document.getElementById("remove-bg-input").files[0];
      const status = document.getElementById("remove-bg-status");
      const preview = document.getElementById("remove-bg-preview");

      if (!file) {
        status.textContent = "الرجاء اختيار صورة";
        status.className = "status error";
        return;
      }

      status.textContent = "جاري إزالة الخلفية...";
      status.className = "status";

      try {
        const img = await createImageBitmap(file);
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          if (data[i] > 240 && data[i + 1] > 240 && data[i + 2] > 240) {
            data[i + 3] = 0;
          }
        }

        ctx.putImageData(imageData, 0, 0);

        const output = canvas.toDataURL("image/png");

        preview.innerHTML = `
          <img src="${output}">
          <br><br>
          <a href="${output}" download="no-bg.png" class="action-btn">تحميل الصورة</a>
        `;

        status.textContent = "تمت إزالة الخلفية ✔️";
        status.className = "status success";
      } catch (e) {
        console.error(e);
        status.textContent = "حدث خطأ أثناء إزالة الخلفية";
        status.className = "status error";
      }
    });
  }

  /* تحسين الجودة */
  const enhanceBtn = document.getElementById("enhance-btn");
  if (enhanceBtn) {
    enhanceBtn.addEventListener("click", async () => {
      const file = document.getElementById("enhance-input").files[0];
      const status = document.getElementById("enhance-status");
      const preview = document.getElementById("enhance-preview");

      if (!file) {
        status.textContent = "الرجاء اختيار صورة";
        status.className = "status error";
        return;
      }

      status.textContent = "جاري تحسين الجودة...";
      status.className = "status";

      try {
        const img = await createImageBitmap(file);
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");

        ctx.filter = "contrast(115%) brightness(110%) saturate(120%)";
        ctx.drawImage(img, 0, 0);

        const output = canvas.toDataURL("image/jpeg", 0.92);

        preview.innerHTML = `
          <img src="${output}">
          <br><br>
          <a href="${output}" download="enhanced.jpg" class="action-btn">تحميل الصورة</a>
        `;

        status.textContent = "تم تحسين الجودة ✔️";
        status.className = "status success";
      } catch (e) {
        console.error(e);
        status.textContent = "حدث خطأ أثناء تحسين الجودة";
        status.className = "status error";
      }
    });
  }

  /* ضغط الصور */
  const compressBtn = document.getElementById("compress-btn");
  if (compressBtn) {
    compressBtn.addEventListener("click", async () => {
      const file = document.getElementById("compress-input").files[0];
      const maxKB = parseInt(document.getElementById("compress-size").value);
      const status = document.getElementById("compress-status");
      const preview = document.getElementById("compress-preview");

      if (!file) {
        status.textContent = "الرجاء اختيار صورة";
        status.className = "status error";
        return;
      }

      status.textContent = "جاري الضغط...";
      status.className = "status";

      try {
        const img = await createImageBitmap(file);
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        let quality = 0.92;
        let output;

        do {
          output = canvas.toDataURL("image/jpeg", quality);
          const sizeKB = Math.round((output.length * 3) / 4 / 1024);
          if (sizeKB <= maxKB) break;
          quality -= 0.05;
        } while (quality > 0.1);

        preview.innerHTML = `
          <img src="${output}">
          <br><br>
          <a href="${output}" download="compressed.jpg" class="action-btn">تحميل الصورة</a>
        `;

        status.textContent = "تم ضغط الصورة ✔️";
        status.className = "status success";
      } catch (e) {
        console.error(e);
        status.textContent = "حدث خطأ أثناء الضغط";
        status.className = "status error";
      }
    });
  }

  /* تحويل الصور */
  const convertBtn = document.getElementById("convert-btn");
  if (convertBtn) {
    convertBtn.addEventListener("click", async () => {
      const file = document.getElementById("convert-input").files[0];
      const format = document.getElementById("convert-format").value;
      const status = document.getElementById("convert-status");
      const preview = document.getElementById("convert-preview");

      if (!file) {
        status.textContent = "الرجاء اختيار صورة";
        status.className = "status error";
        return;
      }

      status.textContent = "جاري التحويل...";
      status.className = "status";

      try {
        const img = await createImageBitmap(file);
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        const output = canvas.toDataURL(`image/${format}`, 0.92);

        preview.innerHTML = `
          <img src="${output}">
          <br><br>
          <a href="${output}" download="converted.${format}" class="action-btn">تحميل الصورة</a>
        `;

        status.textContent = "تم تحويل الصورة ✔️";
        status.className = "status success";
      } catch (e) {
        console.error(e);
        status.textContent = "حدث خطأ أثناء التحويل";
        status.className = "status error";
      }
    });
  }
});
