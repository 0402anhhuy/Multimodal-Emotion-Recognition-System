"use strict";

// ── URL CỐ ĐỊNH ───────────────────────────────────────────────────────────────
const HF_API_URL = "https://anhhuy0402-multimodal-emotion-recognition-be.hf.space/predict";
const HF_BASE    = "https://anhhuy0402-multimodal-emotion-recognition-be.hf.space";

// ── ELEMENT REFS ──────────────────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);
const pingBtn    = $("pingBtn");
const statusDot  = $("statusDot");
const textInput  = $("textInput");
const fileInput  = $("fileInput");
const dropZone   = $("dropZone");
const dropPreview = $("dropPreview");
const previewImg  = $("previewImg");
const previewName = $("previewName");
const clearImg   = $("clearImg");
const runBtn     = $("runBtn");
const statusMsg  = $("statusMsg");
const results    = $("results");

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
    previewImg.src = URL.createObjectURL(f);
    previewName.textContent = f.name;
    dropPreview.classList.remove("hidden");
    dropZone.classList.add("has-file");
}

clearImg.addEventListener("click", (e) => {
    e.stopPropagation();
    fileInput.value = "";
    previewImg.src  = "";
    dropPreview.classList.add("hidden");
    dropZone.classList.remove("has-file");
});

// ── PING API ──────────────────────────────────────────────────────────────────
pingBtn.addEventListener("click", async () => {
    pingBtn.textContent = "…";
    pingBtn.disabled    = true;
    setStatusDot("checking");

    try {
        const res  = await fetch(HF_BASE + "/health", {
            signal: AbortSignal.timeout(10000),
        });
        const data = await res.json();
        const ok   = data.models_loaded === true;

        setStatusDot(ok ? "online" : "warn");
        showStatus(
            ok
                ? "✓ Kết nối thành công! Models đã sẵn sàng."
                : "⚠ API phản hồi nhưng models chưa load. Kiểm tra thư mục weights/.",
            ok ? "loading" : "error",
        );
    } catch (err) {
        setStatusDot("offline");
        const msg = err.name === "TimeoutError"
            ? "Timeout — Space đang sleep hoặc build. Thử lại sau 30 giây."
            : "Không kết nối được: " + err.message;
        showStatus(msg, "error");
    } finally {
        pingBtn.textContent = "Ping";
        pingBtn.disabled    = false;
    }
});

function setStatusDot(state) {
    const map = {
        online:   ["tag tag--green", '<span class="dot"></span> API online · Models loaded'],
        warn:     ["tag tag--green", '<span class="dot"></span> API online · Models NOT loaded'],
        offline:  ["tag tag--green", '<span class="dot"></span> API offline'],
        checking: ["tag tag--green", '<span class="dot"></span> Đang kiểm tra…'],
    };
    const [cls, html] = map[state] || map.offline;
    statusDot.className   = cls;
    statusDot.innerHTML   = html;
}

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
function setBreakdown(prefix, data) {
    setPct(`${prefix}p`,  data.Positive);  setBar(`${prefix}p`,  data.Positive);
    setPct(`${prefix}n`,  data.Neutral);   setBar(`${prefix}n`,  data.Neutral);
    setPct(`${prefix}ng`, data.Negative);  setBar(`${prefix}ng`, data.Negative);
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
function loadMplChart(zoneId, imgId, b64) {
    if (!b64) return;
    const zone = $(zoneId);
    const img  = $(imgId);
    if (!zone || !img) return;
    img.src = "data:image/png;base64," + b64;
    img.classList.remove("hidden");
    zone.classList.add("loaded");
}

// ── MAIN PREDICT ──────────────────────────────────────────────────────────────
runBtn.addEventListener("click", async () => {
    const text = textInput.value.trim();
    const file = fileInput.files[0];

    if (!text) { showStatus("Vui lòng nhập văn bản cần phân tích.", "error"); return; }
    if (!file) { showStatus("Vui lòng chọn ảnh để phân tích.",      "error"); return; }

    runBtn.disabled = true;
    showStatus("Đang phân tích… vui lòng chờ.", "loading");
    results.classList.add("hidden");

    try {
        const fd = new FormData();
        fd.append("text", text);
        fd.append("file", file);

        const res = await fetch(HF_API_URL, {
            method: "POST",
            body:   fd,
            signal: AbortSignal.timeout(60000),
        });

        if (!res.ok) {
            const errBody = await res.text().catch(() => "");
            throw new Error(`HTTP ${res.status}${errBody ? " — " + errBody.slice(0, 200) : ""}`);
        }

        const data = await res.json();
        if (data.status !== "success")
            throw new Error(data.message || "Unknown error from server");

        setVerdict(data.prediction, data.confidence);

        setBreakdown("t", data.details.text_breakdown);
        setBcardPred("bcard-text-pred",   data.details.text_pred);

        setBreakdown("i", data.details.image_breakdown);
        setBcardPred("bcard-image-pred",  data.details.image_pred);

        setBreakdown("f", data.fusion_breakdown);
        setBcardPred("bcard-fusion-pred", data.prediction);

        loadMplChart("mpl-text",   "mpl-text-img",   data.chart_text_b64);
        loadMplChart("mpl-image",  "mpl-image-img",  data.chart_image_b64);
        loadMplChart("mpl-fusion", "mpl-fusion-img", data.chart_fusion_b64);

        results.classList.remove("hidden");
        hideStatus();
        results.scrollIntoView({ behavior: "smooth", block: "start" });

    } catch (err) {
        showStatus("Lỗi: " + err.message, "error");
    } finally {
        runBtn.disabled = false;
    }
});