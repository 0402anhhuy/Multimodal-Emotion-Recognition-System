"use strict";

// ── DEFAULT API URL ────────────────────────────────────────────────────────────
// Thay YOUR-USERNAME và YOUR-SPACE-NAME bằng thông tin HuggingFace Space của bạn
const DEFAULT_API_URL = "https://anhhuy0402-multimodal-emotion-recognition-be.hf.space/predict";

// ── ELEMENT REFS ──────────────────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);
const apiUrl    = $("apiUrl");
const pingBtn   = $("pingBtn");
const statusDot = $("statusDot");
const textInput = $("textInput");
const fileInput = $("fileInput");
const dropZone  = $("dropZone");
const dropPreview = $("dropPreview");
const previewImg  = $("previewImg");
const previewName = $("previewName");
const clearImg  = $("clearImg");
const runBtn    = $("runBtn");
const statusMsg = $("statusMsg");
const results   = $("results");

// ── SET DEFAULT URL ───────────────────────────────────────────────────────────
apiUrl.value = DEFAULT_API_URL;

// ── CHAR COUNT (optional — chỉ chạy nếu element tồn tại) ─────────────────────
const charCount = $("charCount");
if (charCount) {
    textInput.addEventListener("input", () => {
        charCount.textContent = `${textInput.value.length} ký tự`;
    });
}

// ── FILE UPLOAD + PREVIEW ─────────────────────────────────────────────────────
fileInput.addEventListener("change", () => handleFile(fileInput.files[0]));

dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("has-file");
});
dropZone.addEventListener("dragleave", () => {
    if (!fileInput.files[0]) dropZone.classList.remove("has-file");
});
dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith("image/")) {
        const dt = new DataTransfer();
        dt.items.add(f);
        fileInput.files = dt.files;
        handleFile(f);
    }
});

function handleFile(f) {
    if (!f) return;
    const url = URL.createObjectURL(f);
    previewImg.src = url;
    previewName.textContent = f.name;
    dropPreview.classList.remove("hidden");
    dropZone.classList.add("has-file");
}

clearImg.addEventListener("click", (e) => {
    e.stopPropagation();
    fileInput.value = "";
    previewImg.src = "";
    dropPreview.classList.add("hidden");
    dropZone.classList.remove("has-file");
});

// ── PING API ──────────────────────────────────────────────────────────────────
pingBtn.addEventListener("click", async () => {
    const url = apiUrl.value.trim();
    if (!url) {
        showStatus("Nhập URL trước khi ping.", "error");
        return;
    }

    // Strip /predict nếu user paste URL đầy đủ, dùng /health
    const base      = url.replace(/\/predict\/?$/, "");
    const healthUrl = base + "/health";

    pingBtn.textContent = "…";
    pingBtn.disabled    = true;

    try {
        const res  = await fetch(healthUrl, { signal: AbortSignal.timeout(8000) });
        const data = await res.json();
        const ok   = data.models_loaded === true;

        statusDot.className = `tag tag--green ${ok ? "online" : ""}`;
        statusDot.innerHTML = `<span class="dot"></span> ${ok ? "API online · Models loaded" : "API online · Models NOT loaded"}`;
        showStatus(
            ok ? "✓ Kết nối thành công! Models đã sẵn sàng." : "⚠ API phản hồi nhưng models chưa load.",
            ok ? "loading" : "error",
        );
    } catch {
        statusDot.className = "tag tag--green";
        statusDot.innerHTML = '<span class="dot"></span> API offline';
        showStatus("Không kết nối được. Kiểm tra URL hoặc server.", "error");
    } finally {
        pingBtn.textContent = "Ping";
        pingBtn.disabled    = false;
    }
});

// ── STATUS HELPERS ─────────────────────────────────────────────────────────────
function showStatus(msg, type) {
    statusMsg.textContent = msg;
    statusMsg.className   = `status-msg ${type}`;
    statusMsg.classList.remove("hidden");
}
function hideStatus() {
    statusMsg.className = "status-msg hidden";
}

// ── BAR + PCT SETTERS ─────────────────────────────────────────────────────────
function setBar(id, val) {
    const el = $(`b-${id}`);
    if (el) el.style.width = (val * 100).toFixed(1) + "%";
}
function setPct(id, val) {
    const el = $(`p-${id}`);
    if (el) el.textContent = (val * 100).toFixed(1) + "%";
}

// BE trả về { Positive, Neutral, Negative }
function setBreakdown(prefix, data) {
    setPct(`${prefix}p`,  data.Positive);
    setBar(`${prefix}p`,  data.Positive);
    setPct(`${prefix}n`,  data.Neutral);
    setBar(`${prefix}n`,  data.Neutral);
    setPct(`${prefix}ng`, data.Negative);
    setBar(`${prefix}ng`, data.Negative);
}

// ── VERDICT PILL ──────────────────────────────────────────────────────────────
function setVerdict(prediction, confidence) {
    const pill = $("verdictPill");
    const cls  = { Positive: "pos", Neutral: "neu", Negative: "neg" };
    pill.textContent = prediction;
    pill.className   = `verdict-pill ${cls[prediction] || "neu"}`;
    $("verdictConf").textContent = `Confidence ${(confidence * 100).toFixed(1)}%`;
}

// ── BCARD PRED TAG ────────────────────────────────────────────────────────────
function setBcardPred(id, label) {
    const el = $(id);
    if (!el) return;
    const cls = { Positive: "pos", Neutral: "neu", Negative: "neg" };
    el.textContent = label;
    el.className   = `bcard-pred ${cls[label] || ""}`;
}

// ── MATPLOTLIB CHART LOADER ───────────────────────────────────────────────────
// FIX: phải remove class "hidden" trên <img> để ảnh hiện ra
function loadMplChart(zoneId, imgId, b64) {
    if (!b64) return;
    const zone = $(zoneId);
    const img  = $(imgId);
    if (!zone || !img) return;
    img.src = "data:image/png;base64," + b64;
    img.classList.remove("hidden");   // ← fix: bản gốc thiếu dòng này
    zone.classList.add("loaded");
}

// ── MAIN PREDICT ──────────────────────────────────────────────────────────────
runBtn.addEventListener("click", async () => {
    const text = textInput.value.trim();
    const file = fileInput.files[0];
    const url  = apiUrl.value.trim();

    if (!text) { showStatus("Vui lòng nhập văn bản cần phân tích.", "error"); return; }
    if (!file) { showStatus("Vui lòng chọn ảnh để phân tích.",      "error"); return; }
    if (!url)  { showStatus("Vui lòng nhập HuggingFace Spaces URL.", "error"); return; }

    runBtn.disabled = true;
    showStatus("Đang phân tích… vui lòng chờ.", "loading");
    results.classList.add("hidden");

    try {
        const fd = new FormData();
        fd.append("text", text);
        fd.append("file", file);

        const res = await fetch(url, {
            method: "POST",
            body:   fd,
            signal: AbortSignal.timeout(60000),
        });

        if (!res.ok) {
            const errBody = await res.text().catch(() => "");
            throw new Error(`HTTP ${res.status}${errBody ? " — " + errBody.slice(0, 120) : ""}`);
        }

        const data = await res.json();
        if (data.status !== "success")
            throw new Error(data.message || "Unknown error from server");

        // — VERDICT —
        setVerdict(data.prediction, data.confidence);

        // — BREAKDOWN CARDS —
        // BE: data.details.text_breakdown  = { Positive, Neutral, Negative }
        // BE: data.details.image_breakdown = { Positive, Neutral, Negative }
        // BE: data.fusion_breakdown        = { Positive, Neutral, Negative }
        setBreakdown("t", data.details.text_breakdown);
        setBcardPred("bcard-text-pred",   data.details.text_pred);

        setBreakdown("i", data.details.image_breakdown);
        setBcardPred("bcard-image-pred",  data.details.image_pred);

        setBreakdown("f", data.fusion_breakdown);
        setBcardPred("bcard-fusion-pred", data.prediction);

        // — MATPLOTLIB CHARTS (optional) —
        loadMplChart("mpl-text",   "mpl-text-img",   data.chart_text_b64);
        loadMplChart("mpl-image",  "mpl-image-img",  data.chart_image_b64);
        loadMplChart("mpl-fusion", "mpl-fusion-img", data.chart_fusion_b64);

        // — SHOW —
        results.classList.remove("hidden");
        hideStatus();
        results.scrollIntoView({ behavior: "smooth", block: "start" });

    } catch (err) {
        showStatus("Lỗi: " + err.message, "error");
    } finally {
        runBtn.disabled = false;
    }
});