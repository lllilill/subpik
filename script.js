const LANGUAGES = [
  {
    key: "chinese",
    label: "CN",
    name: "China",
    langAttr: "zh-CN",
    fontFamily: "Source Han Serif SC SemiBold",
    fontSize: 90,
    color: "#e53935",
    active: false,
  },
  {
    key: "english",
    label: "EN",
    name: "English",
    langAttr: "en-US",
    fontFamily: "Calibri",
    fontSize: 40,
    color: "#43a047",
    active: false,
  },
  {
    key: "korean",
    label: "KR",
    name: "Korean",
    langAttr: "ko-KR",
    fontFamily: "나눔고딕",
    fontSize: 60,
    color: "#1e88e5",
    active: true,
  },
  {
    key: "japanese",
    label: "JP",
    name: "Japanese",
    langAttr: "ja-JP",
    fontFamily: "MS PGothic",
    fontSize: 40,
    color: "#ffb300",
    active: false,
  },
  {
    key: "spanish",
    label: "ES",
    name: "Spanish",
    langAttr: "es-ES",
    fontFamily: "Arial",
    fontSize: 40,
    color: "#fb8c00",
    active: false,
  },
  {
    key: "french",
    label: "FR",
    name: "French",
    langAttr: "fr-FR",
    fontFamily: "Arial",
    fontSize: 40,
    color: "#8e24aa",
    active: false,
  },
  {
    key: "german",
    label: "DE",
    name: "German",
    langAttr: "de-DE",
    fontFamily: "Arial",
    fontSize: 40,
    color: "#6d4c41",
    active: false,
  },
  {
    key: "italian",
    label: "IT",
    name: "Italian",
    langAttr: "it-IT",
    fontFamily: "Arial",
    fontSize: 40,
    color: "#00897b",
    active: false,
  },
  {
    key: "russian",
    label: "RU",
    name: "Russian",
    langAttr: "ru-RU",
    fontFamily: "Arial",
    fontSize: 40,
    color: "#d81b60",
    active: false,
  },
  {
    key: "polish",
    label: "PL",
    name: "Polish",
    langAttr: "pl-PL",
    fontFamily: "Arial",
    fontSize: 40,
    color: "#5e35b1",
    active: false,
  },
  {
    key: "vietnamese",
    label: "VN",
    name: "Vietnamese",
    langAttr: "vi-VN",
    fontFamily: "Arial",
    fontSize: 40,
    color: "#039be5",
    active: false,
  },
  {
    key: "mongolian",
    label: "MN",
    name: "Mongolian",
    langAttr: "mn-MN",
    fontFamily: "Arial",
    fontSize: 40,
    color: "#c0ca33",
    active: false,
  },
  {
    key: "thai",
    label: "TH",
    name: "Thai",
    langAttr: "th-TH",
    fontFamily: "Tahoma",
    fontSize: 40,
    color: "#e64a19",
    active: false,
  },
  {
    key: "turkish",
    label: "TR",
    name: "Turkish",
    langAttr: "tr-TR",
    fontFamily: "Arial",
    fontSize: 40,
    color: "#00acc1",
    active: false,
  },
  {
    key: "hindi",
    label: "IN",
    name: "Hindi",
    langAttr: "hi-IN",
    fontFamily: "Noto Sans Devanagari",
    fontSize: 40,
    color: "#3949ab",
    active: false,
  },
  {
    key: "arabic",
    label: "AR",
    name: "Arabic",
    langAttr: "ar-SA",
    fontFamily: "Arial",
    fontSize: 40,
    color: "#546e7a",
    active: false,
  },
];

const fontFamilies = LANGUAGES.reduce((acc, { label, fontFamily }) => {
  const code = `${label}CC`;
  acc[code] = fontFamily;
  return acc;
}, {});

const fullPt = LANGUAGES.reduce((acc, { label, fontSize }) => {
  const code = `${label}CC`;
  acc[code] = fontSize;
  return acc;
}, {});

LANGUAGES.forEach(({ label, color }) => {
  const varName = `--lang-${label}CC`;

  document.documentElement.style.setProperty(varName, color);
});

const LANGUAGE_CODES = LANGUAGES.map((lang) => `${lang.label}CC`);

const LANG = LANGUAGES.reduce((acc, { key, label }) => {
  const code = `${label}CC`;
  acc[code] = {
    key: key,
    container: `${key}Container`,
  };
  return acc;
}, {});

const codeMap = LANGUAGES.reduce((acc, { key, label }) => {
  acc[key] = `${label}CC`;
  return acc;
}, {});

document.addEventListener("DOMContentLoaded", () => {
  let autoScrollInterval = null;
  const SCROLL_SPEED_PX = 15;
  const SCROLL_INTERVAL_MS = 40;

  const audioContext = new (window.AudioContext ||
    window.webkitAudioContext)();
  let audioBuffer = null;
  let isPlaying = false;
  let playheadReqId = null;
  let zoomLevel = 1;
  let panOffset = 0;

  let panOffsetTarget = 0;
  const panSmooth = 0.1;

  const minZoom = 1;
  let maxZoom;
  let isSeeking = false;

  const waveformContainer = document.getElementById("waveformContainer");
  const waveformCanvas = document.getElementById("waveformCanvas");
  const canvasCtx = waveformCanvas.getContext("2d");
  const playheadDiv = document.getElementById("playhead");

  function formatTime(t) {
    const totalMs = Math.floor(t * 1000);
    const ms = totalMs % 1000;
    const s = Math.floor(t % 60);
    const m = Math.floor((t / 60) % 60);
    return `${m.toString().padStart(2, "0")}:${s
      .toString()
      .padStart(2, "0")}.${ms.toString().padStart(3, "0")}`;
  }

  let samiCues = [];

  function updateSamiCues() {
    const sami = document.getElementById("output").value;
    if (!sami) return;
    samiCues = [];
    const syncRe =
      /<SYNC Start=(\d+)><P Class=(\w+)>([\s\S]*?)(?=(<SYNC|$))/gi;
    let m;
    while ((m = syncRe.exec(sami)) !== null) {
      samiCues.push({
        start: parseInt(m[1], 10) / 1000,
        html: m[3]
          .replace(/&nbsp;/g, "")
          .replace(/\r?\n/g, "")
          .trim(),
        cls: m[2],
      });
    }
    samiCues.sort((a, b) => a.start - b.start);
  }

  const fullPt = LANGUAGES.reduce((acc, { label, fontSize }) => {
    acc[`${label}CC`] = fontSize;
    return acc;
  }, {});

  function updateSubtitleScale() {
    const overlay = document.getElementById("samiOverlay");
    const currentWidth = videoContainer.clientWidth;
    const intrinsicW = video.videoWidth || baselineWidth;
    const scale = currentWidth / intrinsicW;

    overlay.style.fontSize = "0px";

    overlay.querySelectorAll("span").forEach((el) => {
      const cls = el.className;
      const basePt = fullPt[cls] || 0;
      const scaledPt = basePt * scale;

      el.style.fontSize = `${scaledPt}pt`;
      el.style.lineHeight = `${scaledPt}pt`;
    });

    if (baselineOverlayBottom) {
      overlay.style.bottom = `${baselineOverlayBottom * scale}px`;
    }
  }

  function updateTimeDisplay() {
    if (!isNaN(video.duration)) {
      timeDisplay.value = formatTime(video.currentTime);
    }
  }

  function showInvalidInputModal(items) {
    const overlay = document.getElementById("invalidInputOverlay");
    const popup = document.getElementById("invalidInputPopup");
    const list = document.getElementById("invalidInputList");

    list.innerHTML = "";
    items.forEach((msg) => {
      const li = document.createElement("li");
      li.textContent = msg;
      list.appendChild(li);
    });

    overlay.classList.remove("hidden");
    popup.classList.remove("hidden");

    document.body.classList.add("modal-open");

    document.getElementById("download-btn").disabled = true;
  }

  function clearInputError(el) {
    if (el && el.classList && el.classList.contains("error")) {
      el.classList.remove("error");
    }
  }

  const onDragOver = (e) => {
    e.preventDefault();
    videoContainer.style.borderColor = "#6b7280";
  };
  const onDragLeave = () => {
    videoContainer.style.borderColor = "#d1d5db";
  };
  const onDrop = (e) => {
    e.preventDefault();
    videoContainer.style.borderColor = "#d1d5db";

    const file = e.dataTransfer.files[0];
    if (
      file &&
      (file.type.startsWith("video/") || file.type.startsWith("audio/"))
    ) {
      loadVideo(file);
    }
  };

  function showControls() {
    player.classList.add("show-controls");
    clearTimeout(controlTimeout);
    controlTimeout = setTimeout(() => {
      player.classList.remove("show-controls");
    }, 500);
  }

  function resetDragState() {
    if (dragSourceBtn) dragSourceBtn.style.opacity = "";
    setDropHighlight(null);
    draggingLang = null;
    dragSourceBtn = null;
  }

  function renderLanguageButtons() {
    const toggleContainer = document.querySelector(".language-toggle");
    const addBtn = document.getElementById("addLanguageButton");

    toggleContainer
      .querySelectorAll(".lang-btn")
      .forEach((el) => el.remove());

    LANGUAGES.forEach((lang) => {
      const btn = document.createElement("button");
      btn.classList.add("lang-btn");
      btn.setAttribute("data-target", lang.key);
      btn.setAttribute("draggable", "true");
      btn.textContent = lang.label;
      if (lang.active) btn.classList.add("active");

      const varName = `--lang-${lang.label}CC`;
      btn.style.setProperty("--btn-color", `var(${varName})`);

      toggleContainer.insertBefore(btn, addBtn);
    });
  }

  renderLanguageButtons();

  const addLangBtn = document.getElementById("addLanguageButton");

  const clickBtn = document.querySelector(".click-anim-container");

  let clickToggle = false;

  if (clickBtn) {
    clickBtn.addEventListener("click", () => {
      subtitleGenerator.generateSubtitles(false);

      if (document.body.classList.contains("modal-open")) {
        return;
      }

      const curState = parseInt(
        clickBtn.getAttribute("data-state") || "0",
        10
      );
      let nextState = curState === 0 ? 1 : curState === 1 ? 2 : 1;

      clickToggle = nextState !== 2;
      clickBtn.setAttribute("data-state", String(nextState));

      const dl = document.getElementById("download-btn");
      dl.disabled = false;

      const output = document.getElementById("output");
      output.style.display = clickToggle ? "none" : "block";

      if (!clickToggle) updateOutputBounds();

      const mainContent = document.querySelector(".main-content");
      mainContent.classList.toggle(
        "minimal",
        output.style.display === "block"
      );

      if (clickToggle) {
        document
          .querySelectorAll(".add-btn, .remove-btn")
          .forEach((btn) => {
            btn.style.animation = "none";

            if (btn.classList.contains("add-btn")) {
              btn.style.transform = "rotate(0deg) scale(1)";
            } else {
              btn.style.transform = "rotateX(0deg) scale(1)";
            }
          });
      }

      const nowVisible = output.style.display === "block";

      if (nowVisible) {
        updateOutputBounds();
      } else {
        output.removeAttribute("style");
      }

      if (!nowVisible) {
        document
          .querySelectorAll(".language-toggle .lang-btn.ready")
          .forEach((btn) => {
            btn.style.animation = "none";
            btn.style.backgroundSize = "100% 100%";
          });
      }

      const container = document.querySelector(
        ".main-content .container"
      );

      if (!nowVisible) {
        container.style.position = "";

        const dRect = divider.getBoundingClientRect();

        const leftPx = dRect.right + window.scrollX + 80;

        Object.assign(output.style, {
          position: "fixed",
          top: "0",
          bottom: "0",
          left: `${leftPx}px`,
          right: "0",
          maxWidth: "none",
          boxSizing: "border-box",
        });
      }
    });

    function updateOutputBounds() {
      const output = document.getElementById("output");
      if (output.style.display === "none") return;

      const divider = document.getElementById("divider");
      const container = document.querySelector(
        ".main-content .container"
      );

      container.style.position = "relative";

      const cRect = container.getBoundingClientRect();
      const dRect = divider.getBoundingClientRect();

      const leftPos = dRect.right - cRect.left + 80;

      Object.assign(output.style, {
        position: "absolute",
        top: "0",
        bottom: "0",
        left: `${leftPos}px`,
        right: "0",
        maxWidth: "none",
        boxSizing: "border-box",
      });
    }

    const divider = document.getElementById("divider");
    clickBtn.style.left = `${
      divider.offsetLeft + divider.offsetWidth + 45
    }px`;
  }

  document
    .getElementById("invalidInputClose")
    .addEventListener("click", () => {
      document
        .getElementById("invalidInputOverlay")
        .classList.add("hidden");
      document
        .getElementById("invalidInputPopup")
        .classList.add("hidden");

      document.body.classList.remove("modal-open");
    });
  document
    .getElementById("invalidInputOverlay")
    .addEventListener("click", () => {
      document
        .getElementById("invalidInputOverlay")
        .classList.add("hidden");
      document
        .getElementById("invalidInputPopup")
        .classList.add("hidden");

      document.body.classList.remove("modal-open");
    });

  let pickrTargetBtn = null;

  const video = document.getElementById("video");

  video.volume = 0.5;

  video.setAttribute("draggable", true);

  video.addEventListener(
    "click",
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      togglePlayPause();
    },
    true
  );

  video.addEventListener("dragstart", (e) => {
    const isFullScreen =
      document.fullscreenElement === player ||
      document.webkitFullscreenElement === player;
    if (isFullScreen) {
      e.preventDefault();
    }
  });

  let volumeIndicatorTimeout;

  function showVolumeIndicator(vol) {
    const videoContainer = document.getElementById("video-container");

    let indicator = document.getElementById("volume-indicator");
    if (!indicator) {
      indicator = document.createElement("div");
      indicator.id = "volume-indicator";
      Object.assign(indicator.style, {
        position: "absolute",
        bottom: "10px",
        left: "50%",
        transform: "translateX(-50%)",
        padding: "8px 12px",
        background: "rgba(0, 0, 0, 0.6)",
        color: "#fff",
        borderRadius: "4px",
        fontSize: "14px",
        pointerEvents: "none",
        zIndex: "1001",
        opacity: "0",
      });

      videoContainer.appendChild(indicator);
    }

    const percent = Math.round(vol * 100);

    const iconName = vol === 0 ? "volume_off" : "volume_up";

    indicator.innerHTML = `<span class="material-icons" style="vertical-align:middle;">${iconName}</span> ${percent}%`;

    indicator.style.transition = "";
    indicator.style.opacity = "1";

    clearTimeout(volumeIndicatorTimeout);
    volumeIndicatorTimeout = setTimeout(() => {
      indicator.style.transition = "opacity 0.3s";
      indicator.style.opacity = "0";
    }, 1000);
  }

  const timeDisplay = document.getElementById("time-display");
  const copyBtn = document.getElementById("copy-btn");

  const captionBtn = document.getElementById("caption-btn");
  const samiOverlay = document.getElementById("samiOverlay");
  let captionsEnabled = true;

  const fullscreenBtn = document.getElementById("fullscreen-btn");
  const timelineContainer = document.getElementById("timelineContainer");
  const timelineCanvas = document.getElementById("timelineCanvas");
  const timelineCtx = timelineCanvas.getContext("2d");
  let timelineEnabled = false;

  document.addEventListener("keydown", (e) => {
    if (e.code === "Enter") {
      e.preventDefault();

      fullscreenBtn.click();
    }
  });

  const sectionContainers = document.getElementById("sectionContainers");

  function setAddButtonsReady(lang, ready) {
    const code = codeMap[lang];
    const sel = `.add-section-btn[data-lang="${code}"]`;
    document.querySelectorAll(sel).forEach((b) => {
      b.classList.toggle("ready", ready);
      const isActive = document
        .querySelector(`.lang-btn[data-target="${lang}"]`)
        .classList.contains("active");
      b.style.display = isActive ? "flex" : "none";
    });
  }

  LANGUAGES.forEach(({ key, label }) => {
    const code = codeMap[key];
    const container = document.createElement("div");
    container.id = `${key}Container`;
    container.className = "section-container";

    const plusBtn = document.createElement("button");
    const capitalized = key.charAt(0).toUpperCase() + key.slice(1);
    plusBtn.id = `add${capitalized}SectionButton`;

    plusBtn.classList.add("add-section-btn");
    plusBtn.dataset.lang = code;
    plusBtn.style.setProperty(
      "--section-btn-color",
      `var(--lang-${code})`
    );

    plusBtn.addEventListener("click", () => {
      subtitleGenerator.addInputSection(code);
    });

    container.appendChild(plusBtn);
    sectionContainers.appendChild(container);
  });

  document.addEventListener("keydown", (e) => {
    const ae = document.activeElement;

    if (
      ae.tagName === "TEXTAREA" ||
      (ae.tagName === "INPUT" && ae.type === "text")
    ) {
      return;
    }
    if (e.code === "Space") {
      e.preventDefault();
      if (video.paused) video.play();
      else video.pause();
    }
  });

  timelineCanvas.style.display = "none";

  const fileInput = document.getElementById("fileInput");
  const videoContainer = document.getElementById("video-container");

  videoContainer.addEventListener("wheel", (e) => {
    const isFullscreen =
      document.fullscreenElement === player ||
      document.webkitFullscreenElement === player;
    if (isFullscreen) return;

    e.preventDefault();

    const delta = e.deltaY < 0 ? 0.05 : -0.05;

    let newVol = Math.min(1, Math.max(0, video.volume + delta));
    video.volume = newVol;

    showVolumeIndicator(newVol);
  });

  document.addEventListener("wheel", (e) => {
    const isFullscreen =
      document.fullscreenElement === player ||
      document.webkitFullscreenElement === player;
    if (!isFullscreen) return;

    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.05 : -0.05;
    let newVol = Math.min(1, Math.max(0, video.volume + delta));
    video.volume = newVol;
    showVolumeIndicator(newVol);
  });

  let baselineWidth = videoContainer.clientWidth;

  let baselineHeight = videoContainer.clientHeight;

  let baselineOverlayBottom = baselineHeight * 0.05;

  const placeholder = document.getElementById("video-placeholder");

  function togglePlayPause() {
    if (!video.src || wasScrubbing) return;

    if (video.paused) video.play();
    else video.pause();

    updateTimeDisplay();
  }

  videoContainer.addEventListener("click", (e) => {
    if (!video.src) {
      fileInput.click();
      return;
    }

    togglePlayPause();
  });

  videoContainer.addEventListener("mousedown", (e) => {
    const isFullScreen =
      document.fullscreenElement === player ||
      document.webkitFullscreenElement === player;

    if (isFullScreen && video.src) {
      isScrubbing = true;
      didDrag = false;
      dragStartX = e.clientX;

      e.preventDefault();
    }
  });

  window.addEventListener("mousemove", (e) => {
    if (!isScrubbing) return;

    const diff = Math.abs(e.clientX - dragStartX);
    if (diff > 3) {
      didDrag = true;
      scrubToPosition(e);
    }
  });

  window.addEventListener("mouseup", () => {
    if (isScrubbing) {
      isScrubbing = false;
      wasScrubbing = didDrag;
      didDrag = false;
      setTimeout(() => (wasScrubbing = false), 0);
    }
  });

  function scrubToPosition(e) {
    if (!video.paused) {
      video.pause();
    }

    const rect = videoContainer.getBoundingClientRect();
    let clickX = e.clientX - rect.left;
    if (clickX < 0) clickX = 0;
    if (clickX > rect.width) clickX = rect.width;
    const newTime = (clickX / rect.width) * video.duration;

    if (!isNaN(newTime)) {
      video.currentTime = newTime;
      drawTimeline();
      updateTimeDisplay();

      video.play();
      clearTimeout(scrubTimeout);
      scrubTimeout = setTimeout(() => {
        video.pause();
      }, 100);
    }
  }

  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];

    if (
      file &&
      (file.type.startsWith("video/") || file.type.startsWith("audio/"))
    ) {
      loadVideo(file);
    }
  });

  function loadVideo(file) {
    video.addEventListener(
      "loadedmetadata",
      () => {
        playheadDiv.style.display = "block";
        playheadDiv.style.left = "0px";
        if (audioBuffer) {
          drawWaveform();
        }
      },
      { once: true }
    );

    video.src = URL.createObjectURL(file);
    video.style.display = "block";
    placeholder.style.display = "none";
    video.play();
    baselineWidth = videoContainer.clientWidth;

    baselineHeight = videoContainer.clientHeight;
    baselineOverlayBottom = baselineHeight * 0.05;

    timelineCanvas.style.display = "block";
    timelineEnabled = true;
    resizeTimelineCanvas();
    drawTimeline();
    videoContainer.style.borderColor = "transparent";
    copyBtn.disabled = false;

    copyBtn.classList.add("active");
    timeDisplay.classList.remove("hidden");

    captionBtn.disabled = false;

    captionBtn.classList.add("active");
    samiOverlay.style.display = "block";

    fullscreenBtn.disabled = false;

    zoomLevel = 1;
    panOffset = 0;

    file
      .arrayBuffer()
      .then((arrayBuffer) => {
        return audioContext.decodeAudioData(arrayBuffer);
      })
      .then((decodedBuffer) => {
        audioBuffer = decodedBuffer;
        maxZoom = audioBuffer.length / waveformCanvas.width;

        if (video.readyState >= 1) {
          waveformContainer.style.visibility = "visible";
          playheadDiv.style.visibility = "visible";

          drawWaveform();

          updateZoomHighlight();
        }
      })
      .catch((err) => {
        audioBuffer = null;
        drawWaveform();

        updateZoomHighlight();
      });
  }

  video.addEventListener("timeupdate", () => {
    if (!isNaN(video.duration)) {
      drawTimeline();
      updateTimeDisplay();
    }

    if (!isSeeking && audioBuffer) {
      updatePlayhead();
    }
  });

  video.addEventListener("play", () => {
    if (audioBuffer) {
      updatePlayhead();
    }
  });

  function updateSamiOverlay(now, metadata) {
    const t = metadata.mediaTime;
    const lines = [];
    const classes = [...new Set(samiCues.map((c) => c.cls))];
    classes.forEach((cls) => {
      let lastCue = null;
      samiCues
        .filter((cue) => cue.cls === cls)
        .forEach((cue) => {
          if (cue.start <= t && (!lastCue || cue.start > lastCue.start)) {
            lastCue = cue;
          }
        });
      if (lastCue && lastCue.html) {
        lines.push(`<span class="${cls}">${lastCue.html}</span>`);
      }
    });

    const newHTML = lines.join("<br>");

    if (overlay.innerHTML !== newHTML) {
      overlay.innerHTML = newHTML;
      updateSubtitleScale();
    }

    video.requestVideoFrameCallback(updateSamiOverlay);
  }

  video.addEventListener("play", () => {
    video.requestVideoFrameCallback(updateSamiOverlay);
  });

  video.addEventListener("pause", () => {
    cancelAnimationFrame(playheadReqId);
  });

  let isScrubbing = false;
  let isTimelineScrubbing = false;
  let scrubTimeout;

  let wasScrubbing = false;
  let didDrag = false;
  let dragStartX = 0;

  function seekTimelineCanvas(e) {
    const rect = timelineCanvas.getBoundingClientRect();
    let x = e.clientX - rect.left;
    x = Math.max(0, Math.min(x, rect.width));
    const newTime = (x / rect.width) * video.duration;
    if (!isNaN(newTime)) {
      video.currentTime = newTime;
      drawTimeline();
      updatePlayhead();
      video.play();
      clearTimeout(scrubTimeout);
      scrubTimeout = setTimeout(() => {
        video.pause();
      }, 100);
    }
  }

  timelineCanvas.addEventListener("pointerdown", (e) => {
    if (!video.src) return;
    isTimelineScrubbing = true;
    video.pause();
    seekTimelineCanvas(e);
  });

  timelineCanvas.addEventListener("pointermove", (e) => {
    if (!isTimelineScrubbing || isNaN(video.duration)) return;
    seekTimelineCanvas(e);
  });

  window.addEventListener("pointerup", () => {
    if (!isTimelineScrubbing) return;
    isTimelineScrubbing = false;
    clearTimeout(scrubTimeout);
    video.pause();
  });

  video.addEventListener("loadedmetadata", () => {
    timeDisplay.disabled = false;
    resizeTimelineCanvas();
    drawTimeline();
  });

  timeDisplay.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!timeDisplay.disabled && video.src) {
      video.pause();
    }
  });

  timeDisplay.addEventListener("blur", () => {
    if (timeDisplay.disabled || !video.src) return;

    const t =
      subtitleGenerator.convertTimeToMilliseconds(timeDisplay.value) /
      1000;

    if (t != null && !isNaN(video.duration)) {
      video.currentTime = Math.min(t, video.duration);

      drawTimeline();
      updatePlayhead();
      video.play();
      clearTimeout(scrubTimeout);
      scrubTimeout = setTimeout(() => {
        video.pause();
      }, 100);
      updateTimeDisplay();
    } else {
      timeDisplay.value = formatTime(video.currentTime);
    }
  });

  videoContainer.addEventListener("dragover", onDragOver);
  videoContainer.addEventListener("dragleave", onDragLeave);
  videoContainer.addEventListener("drop", onDrop);

  video.addEventListener("dragend", (e) => {
    const rect = videoContainer.getBoundingClientRect();
    if (
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom
    ) {
      video.pause();
      video.removeAttribute("src");
      video.load();
      video.style.display = "none";
      placeholder.style.display = "block";
      videoContainer.style.borderColor = "#d1d5db";
      timeDisplay.disabled = true;

      copyBtn.disabled = true;
      fullscreenBtn.disabled = true;

      timeDisplay.value = "00:00.000";
      timelineEnabled = false;
      timelineCanvas.style.display = "none";
      drawTimeline();

      fileInput.value = "";

      waveformContainer.style.visibility = "hidden";
      playheadDiv.style.display = "none";
    }
  });

  copyBtn.addEventListener("click", () => {
    const td = document.getElementById("time-display");

    const isHidden = td.classList.toggle("hidden");
    copyBtn.classList.toggle("active", !isHidden);
  });

  const overlay = document.getElementById("samiOverlay");

  updateSubtitleScale();

  window.addEventListener("resize", updateSubtitleScale);

  window.addEventListener("resize", updateOutputBounds);

  function updateZoomHighlight() {
    if (!audioBuffer || isNaN(video.duration)) {
      document.getElementById("zoomHighlight").style.width = "0";
      return;
    }

    const totalSamples = audioBuffer.length;
    const duration = video.duration;

    const segmentLength = Math.floor(totalSamples / zoomLevel);
    const startSample = Math.floor(panOffset);
    const endSample = startSample + segmentLength;

    const startTime = (startSample / totalSamples) * duration;
    const endTime = Math.min(
      (endSample / totalSamples) * duration,
      duration
    );

    const startPct = (startTime / duration) * 100;
    const widthPct = ((endTime - startTime) / duration) * 100;

    const highlight = document.getElementById("zoomHighlight");
    highlight.style.left = `${startPct}%`;
    highlight.style.width = `${widthPct}%`;
  }

  function resizeWaveformCanvas() {
    const rect = waveformContainer.getBoundingClientRect();
    waveformCanvas.width = rect.width;
    waveformCanvas.height = rect.height;
    drawWaveform();
  }

  function resizeTimelineCanvas() {
    const rect = timelineContainer.getBoundingClientRect();
    timelineCanvas.width = rect.width;
    timelineCanvas.height = rect.height;
    drawTimeline();
  }

  function drawTimeline() {
    const width = timelineCanvas.width;
    const height = timelineCanvas.height;
    timelineCtx.clearRect(0, 0, width, height);
    if (!timelineEnabled || isNaN(video.duration) || video.duration === 0)
      return;
    // The red playhead is now rendered via the CSS #playhead element.
  }

  window.addEventListener("resize", resizeWaveformCanvas);
  window.addEventListener("resize", resizeTimelineCanvas);
  resizeWaveformCanvas();
  resizeTimelineCanvas();

  updateZoomHighlight();

  let controlTimeout;
  const player = document.getElementById("player-container");

  function onFullScreenToggle() {
    const isFS =
      document.fullscreenElement === player ||
      document.webkitFullscreenElement === player;

    if (isFS) {
      showControls();
      player.addEventListener("mousemove", showControls);
    } else {
      player.classList.remove("show-controls");
      player.removeEventListener("mousemove", showControls);
      clearTimeout(controlTimeout);
    }
    updateSubtitleScale();
  }

  ["fullscreenchange", "webkitfullscreenchange"].forEach((evt) =>
    document.addEventListener(evt, onFullScreenToggle)
  );

  document.addEventListener(
    "webkitfullscreenchange",
    updateSubtitleScale
  );

  class SubtitleGenerator {
    constructor() {
      this.output = document.getElementById("output");
      this.titleText = document.getElementById("titleText");

      this.sections = LANGUAGE_CODES.reduce((acc, code) => {
        acc[code] = [];
        return acc;
      }, {});

      document
        .getElementById("download-btn")
        .addEventListener("click", () => this.downloadSAMIFile());

      titleText.addEventListener("input", function () {
        this.style.width = "auto";
        this.style.width = Math.min(this.scrollWidth, 400) + "px";
      });

      this.handleLanguageChange();
      this.setupTextInputListeners();
    }

    handleLanguageChange() {
      this.toggleLanguageSections();
    }

    addInputSection(langClass, referenceSectionWrapper = null) {
      document.getElementById("output").style.display = "none";

      const dl = document.getElementById("download-btn");
      dl.disabled = true;
      dl.style.display = "inline-block";

      const sectionWrapper = this.createInputSection(langClass);
      const container = this.getContainerByLangClass(langClass);

      if (referenceSectionWrapper) {
        container.insertBefore(
          sectionWrapper,
          referenceSectionWrapper.nextSibling
        );
      } else {
        const first = container.querySelector(".section-wrapper");
        first
          ? container.insertBefore(sectionWrapper, first)
          : container.appendChild(sectionWrapper);
      }

      this.addSectionToList(
        langClass,
        sectionWrapper.querySelector(".input-section"),
        referenceSectionWrapper
      );
      this.updateSectionNumbers(langClass);

      updateBookmarks();
    }

    getContainerByLangClass(c) {
      return document.getElementById(LANG[c].container);
    }

    addSectionToList(c, s, r) {
      let arr;

      arr = this.sections[c] || [];

      if (r) {
        const ref = r.querySelector(".input-section");
        const i = arr.indexOf(ref);
        if (i !== -1) {
          arr.splice(i + 1, 0, s);
        } else {
          arr.push(s);
        }
      } else {
        arr.unshift(s);
      }
    }

    createInputSection(c) {
      const wrapper = document.createElement("div");
      wrapper.className = "section-wrapper";

      const sec = document.createElement("div");
      sec.className = "input-section";
      sec.dataset.langClass = c;

      sec.style.setProperty("--lang-color", `var(--lang-${c})`);

      const langVal = this.getLangValue(c);
      const langBtn = document.querySelector(
        `.lang-btn[data-target="${langVal}"]`
      );
      if (!(langBtn && langBtn.classList.contains("ready"))) {
        sec.classList.add("section-view-only");
      }

      const num = document.createElement("div");
      num.className = "section-number";
      sec.appendChild(num);

      const content = document.createElement("div");
      content.className = "section-content";
      sec.appendChild(content);

      this.addInputGroup(content);
      content.appendChild(this.createLastTimeInputGroup());

      wrapper.appendChild(sec);
      wrapper.appendChild(this.createSectionControls(c, wrapper));
      return wrapper;
    }

    addInputGroup(sec, ref = null) {
      const grp = this.createInputGroup();
      if (ref) sec.insertBefore(grp, ref.nextSibling);
      else sec.insertBefore(grp, sec.querySelector(".last-time-input"));
      this.adjustInputWidth(grp.querySelector(".text"));
    }

    createInputGroup() {
      const g = document.createElement("div");
      g.className = "input-group";
      g.innerHTML = `
<span class="remove-btn"></span>






<input type="text" class="time" placeholder="Start time" draggable="true">





<input type="text" class="text" placeholder="Text">
<span class="add-btn"></span>`;
      g.querySelector(".remove-btn").addEventListener("click", () =>
        this.removeInputGroup(g)
      );
      g.querySelector(".add-btn").addEventListener("click", () =>
        this.addInputGroup(g.parentElement, g)
      );
      return g;
    }

    createLastTimeInputGroup() {
      const l = document.createElement("div");
      l.className = "last-time-input";
      l.innerHTML = `<input type="text" class="last-time" placeholder="End time" draggable="true">`;
      return l;
    }

    createSectionControls(c, w) {
      const d = document.createElement("div");
      d.className = "section-controls";
      d.innerHTML = `<button class="add-section-btn" data-lang="${c}"></button>`;

      d.querySelector(".add-section-btn").style.setProperty(
        "--section-btn-color",
        `var(--lang-${c})`
      );

      const plusBtn = d.querySelector(".add-section-btn");
      plusBtn.addEventListener("click", () => this.addInputSection(c, w));

      const langVal = this.getLangValue(c);
      const langBtn = document.querySelector(
        `.lang-btn[data-target="${langVal}"]`
      );
      if (langBtn && langBtn.classList.contains("ready"))
        plusBtn.classList.add("ready");

      return d;
    }

    removeInputGroup(g) {
      const content = g.closest(".section-content");
      content.removeChild(g);
      if (!content.querySelectorAll(".input-group").length) {
        this.removeInputSection(content.closest(".input-section"));
      }
    }

    removeInputSection(s) {
      const wrapper = s.closest(".section-wrapper");
      const container = wrapper.closest(".section-container");

      const code = Object.keys(LANG).find(
        (key) => LANG[key].container === container.id
      );
      if (!code) return;

      const arr = this.sections[code];

      const idx = arr.indexOf(s);
      if (idx !== -1) {
        arr.splice(idx, 1);
      }

      container.removeChild(wrapper);

      this.updateSectionNumbers(code);
    }

    updateSectionNumbers(c) {
      this.getContainerByLangClass(c)
        .querySelectorAll(".input-section")
        .forEach(
          (s, i) =>
            (s.querySelector(".section-number").textContent = i + 1)
        );
    }

    convertTimeToMilliseconds(t) {
      if (!t) return null;
      const m = t
        .trim()
        .match(/^([0-9]+)[.:,;]([0-5]?[0-9])[.:,;]([0-9]{1,4})$/);
      if (!m) return null;
      const minutes = parseInt(m[1], 10);
      const seconds = parseInt(m[2], 10);
      const milli = parseInt((m[3] + "000").slice(0, 3), 10);
      return minutes * 60000 + seconds * 1000 + milli;
    }

    validateTimeFormat(t) {
      return /^[0-9]+[.:,;][0-5]?[0-9][.:,;][0-9]{1,4}$/.test(t.trim());
    }

    generateSubtitles(skipValidation = false) {
      if (!skipValidation) {
        const invalid = [];
        document
          .querySelectorAll("input.error")
          .forEach((el) => el.classList.remove("error"));

        document
          .querySelectorAll(".section-container:not(.hidden)")
          .forEach((container) => {
            const code = Object.keys(LANG).find(
              (c) => LANG[c].container === container.id
            );
            if (!code) return;
            const shortCode = code.slice(0, 2);
            container
              .querySelectorAll(".input-section")
              .forEach((sec, sIdx) => {
                sec.querySelectorAll(".time").forEach((ti, tIdx) => {
                  if (!ti.value || !this.validateTimeFormat(ti.value)) {
                    invalid.push(
                      `${shortCode} - 💬${sIdx + 1} - Start time ${
                        tIdx + 1
                      }`
                    );
                    ti.classList.add("error");
                  }
                });

                const lt = sec.querySelector(".last-time");
                if (!lt.value || !this.validateTimeFormat(lt.value)) {
                  invalid.push(`${shortCode} - 💬${sIdx + 1} - End time`);
                  lt.classList.add("error");
                }

                sec.querySelectorAll(".text").forEach((tx, txtIdx) => {
                  if (!tx.value.trim()) {
                    invalid.push(
                      `${shortCode} - 💬${sIdx + 1} - Text ${txtIdx + 1}`
                    );
                    tx.classList.add("error");
                  }
                });
              });
          });

        if (invalid.length > 0) {
          showInvalidInputModal(
            invalid.map((item) => {
              return item;
            })
          );
          return;
        }

        const title = this.titleText.value || "Untitled";

        let styleLines =
          "P {font-family:Arial;font-weight:normal;color:white;background-color:black;text-align:center;font-size:38pt;}";

        const styleMap = LANGUAGES.reduce(
          (acc, { key, label, name, langAttr, fontFamily, fontSize }) => {
            const code = `${label}CC`;
            acc[
              key
            ] = `\n.${code} {name:${name};lang:${langAttr};SAMIType:CC;font-family:${fontFamily};font-size:${fontSize}pt;}`;
            return acc;
          },
          {}
        );

        Array.from(document.querySelectorAll(".lang-btn.active"))
          .map((btn) => btn.dataset.target)
          .forEach((langKey) => {
            const line = styleMap[langKey];
            if (line) styleLines += line;
          });

        let out = `<SAMI>
<HEAD>
<TITLE>${title}</TITLE>
<SAMIParam>Metrics {time:ms;} Spec {MSFT:1.0;}</SAMIParam>
<STYLE TYPE="text/css">
${styleLines}
</STYLE>
</HEAD>
<BODY>
`;

        Array.from(document.querySelectorAll(".lang-btn.active")).forEach(
          (btn) => {
            const langKey = btn.dataset.target;
            const code = Object.keys(LANG).find(
              (k) => LANG[k].key === langKey
            );

            this.getContainerByLangClass(code)
              .querySelectorAll(".input-section")
              .forEach((sec) => {
                out += this.generateSubtitleForSection(sec);
              });
          }
        );
        out += `<BODY>
</SAMI>`;

        this.output.value = out;
        this.output.style.display = "block";

        const dl = document.getElementById("download-btn");
        dl.style.display = "inline";
        dl.disabled = false;

        this.adjustOutputHeight();
        updateSamiCues();
      }
    }

    generateSubtitleForSection(s) {
      let out = "";
      const content = s.querySelector(".section-content");
      const times = content.querySelectorAll(".time");
      const texts = content.querySelectorAll(".text");
      const last = content.querySelector(".last-time").value;
      const cls = s.dataset.langClass;
      let acc = "";

      const langKey = this.getLangValue(cls);
      const langBtn = document.querySelector(
        `.lang-btn[data-target="${langKey}"]`
      );
      const isReady = langBtn && langBtn.classList.contains("ready");
      const fontColor =
        (langBtn && langBtn.dataset.pickrColor) || "#FFFF00";

      times.forEach((t, i) => {
        const ms = this.convertTimeToMilliseconds(t.value);
        if (ms === null || !texts[i].value) return;

        acc += texts[i].value;
        const rest = Array.from(texts)
          .slice(i + 1)
          .map((x) => x.value)
          .join("");
        const accBR = acc.replace(/\|/g, "<br>");
        const restBR = rest.replace(/\|/g, "<br>");
        const msStr = String(ms).padStart(5, "0");

        out +=
          `<SYNC Start=${msStr}><P Class=${cls}>` +
          (!isReady
            ? `${accBR}${restBR}\n`
            : `<font color="${fontColor}">${accBR}</font>${restBR}\n`);
      });

      let lastMs = this.convertTimeToMilliseconds(last);
      if (lastMs !== null) {
        lastMs = Math.max(0, lastMs - 1);
        out += `<SYNC Start=${String(lastMs).padStart(
          5,
          "0"
        )}><P Class=${cls}>&nbsp;\n`;
      }

      return out;
    }

    downloadSAMIFile() {
      const a = Object.assign(document.createElement("a"), {
        href: URL.createObjectURL(
          new Blob([this.output.value], { type: "text/smi" })
        ),
        download: `${this.titleText.value || "Untitled"}.smi`,
      });
      a.click();
      URL.revokeObjectURL(a.href);
    }

    duplicateSectionsToTarget(src, dest) {
      const srcContainer = this.getContainerByLangClass(src);
      const srcSecs = Array.from(
        srcContainer.querySelectorAll(".input-section")
      );

      const cont = this.getContainerByLangClass(dest);
      const langBtn = document.querySelector(
        `.lang-btn[data-target="${this.getLangValue(dest)}"]`
      );
      const isReady = langBtn && langBtn.classList.contains("ready");

      while (cont.querySelector(".section-wrapper")) {
        cont.removeChild(cont.querySelector(".section-wrapper"));
      }

      srcSecs.forEach((ss) => {
        const ns = this.createInputSection(dest);
        const srcCon = ss.querySelector(".section-content");
        const newCon = ns.querySelector(".section-content");

        newCon.removeChild(newCon.querySelector(".input-group"));

        srcCon.querySelectorAll(".input-group").forEach((sg, idx) => {
          if (!isReady && idx > 0) return;
          const ng = this.createInputGroup();

          ng.querySelector(".time").value =
            isReady || idx === 0 ? sg.querySelector(".time").value : "";

          ng.querySelector(".text").value = "";
          newCon.insertBefore(
            ng,
            newCon.querySelector(".last-time-input")
          );
        });

        newCon.querySelector(".last-time").value =
          srcCon.querySelector(".last-time").value;

        newCon
          .querySelectorAll(".text")
          .forEach((x) => (x.style.width = ""));
        const firstText = newCon.querySelector(".text");
        if (firstText) this.adjustInputWidth(firstText);

        cont.appendChild(ns);
        this.addSectionToList(dest, ns.querySelector(".input-section"));
      });

      this.updateSectionNumbers(dest);

      updateBookmarks();
    }

    toggleLanguageSections() {
      LANGUAGES.forEach(({ key }) => {
        const code = codeMap[key];
        const container = this.getContainerByLangClass(code);
        const btn = document.querySelector(
          `.lang-btn[data-target="${key}"]`
        );

        if (btn.classList.contains("active")) {
          container.classList.remove("hidden");
        } else {
          container.classList.add("hidden");
          this.resetSections(key);
        }
      });

      document
        .querySelectorAll(
          ".input-section:not(.section-view-only) .add-btn, .section-wrapper .remove-btn"
        )
        .forEach((btn) => {
          btn.style.animation = "none";
          btn.style.opacity = "1";

          btn.style.transform = btn.classList.contains("add-btn")
            ? "rotate(0deg) scale(1)"
            : "rotateX(0deg) scale(1)";
        });
    }

    resetSections(langKey) {
      const code = Object.keys(LANG).find((k) => LANG[k].key === langKey);
      if (!code) return;
      const cont = this.getContainerByLangClass(code);
      while (cont.querySelector(".section-wrapper")) {
        cont.removeChild(cont.querySelector(".section-wrapper"));
      }
    }

    getLangValue(c) {
      return LANG[c].key;
    }

    setupTextInputListeners() {
      document.body.addEventListener("input", (e) => {
        if (e.target.classList.contains("text"))
          this.adjustInputWidth(e.target);
      });

      document.body.addEventListener("keydown", (e) => {
        if (e.target.classList.contains("text") && e.key === "Enter") {
          e.preventDefault();
          const inp = e.target;
          const start = inp.selectionStart;
          const end = inp.selectionEnd;
          inp.value =
            inp.value.slice(0, start) + "|" + inp.value.slice(end);
          inp.setSelectionRange(start + 1, start + 1);
          this.adjustInputWidth(inp);
        }
      });

      document.body.addEventListener("input", (e) => {
        if (document.body.classList.contains("modal-open")) return;

        if (
          e.target.id === "titleText" ||
          e.target.closest(".input-section")
        ) {
          document.getElementById("output").style.display = "none";
          document.getElementById("download-btn").disabled = true;

          const clickBtn = document.querySelector(
            ".click-anim-container"
          );
          if (clickBtn) {
            clickBtn.setAttribute("data-state", "0");
            window.clickAnimState = 0;
          }
        }
      });

      const disableDownloadAndResetClick = () => {
        const dl = document.getElementById("download-btn");
        if (dl) dl.disabled = true;

        const clickCont = document.querySelector(".click-anim-container");
        if (clickCont) {
          clickCont.setAttribute("data-state", "0");
          window.clickAnimState = 0;
        }
      };

      document.body.addEventListener("click", (e) => {
        const btn = e.target.closest(
          ".lang-btn, .lang-select-btn, .add-section-btn, .add-btn, .remove-btn"
        );
        if (btn) {
          disableDownloadAndResetClick();
        }
      });

      document
        .querySelectorAll(
          '.lang-btn, .lang-select-btn, [id^="add"][id$="SectionButton"], .add-btn, .remove-btn'
        )
        .forEach((btn) => {
          btn.addEventListener("click", disableDownloadAndResetClick);
        });

      document
        .querySelectorAll(".section-content input")
        .forEach((inp) => {
          inp.addEventListener("input", () => {
            subtitleGenerator.generateSubtitles(true);
          });
        });
    }

    adjustInputWidth(changed) {
      const sec = changed.closest(".input-section");
      const texts = sec.querySelectorAll(".text");
      let max = 0;
      texts.forEach((t) => {
        const span = document.createElement("span");
        span.style.font = window.getComputedStyle(t).font;
        span.style.visibility = "hidden";
        span.style.position = "absolute";
        span.textContent = t.value || " ";
        document.body.appendChild(span);
        max = Math.max(max, span.getBoundingClientRect().width + 20);
        document.body.removeChild(span);
      });
      if (max < 100) max = 100;
      texts.forEach((t) => (t.style.width = `${max}px`));
    }

    adjustOutputHeight() {
      this.output.style.height = "auto";
      this.output.style.height = this.output.scrollHeight + "px";
    }
  }

  const subtitleGenerator = new SubtitleGenerator();

  document
    .getElementById("output")
    .addEventListener("input", function () {
      this.style.height = "auto";
      this.style.height = this.scrollHeight + "px";
    });

  const langButtons = document.querySelectorAll(".lang-btn");

  function setSectionEditability(lang, editable) {
    const code = codeMap[lang];
    document
      .querySelectorAll(`.input-section[data-lang-class="${code}"]`)
      .forEach((sec) =>
        sec.classList.toggle("section-view-only", !editable)
      );
  }

  function closestLangBtn(el) {
    return el ? el.closest(".lang-btn") : null;
  }

  langButtons.forEach((btn) => {
    btn.addEventListener(
      "pointerdown",
      function (e) {
        if (this.classList.contains("pickr-open")) {
          e.stopImmediatePropagation();
          e.preventDefault();
          pickr.hide();
        }
      },
      true
    );

    const lang = btn.dataset.target;
    const chk = document.querySelector(`input[value="${lang}"]`);

    btn.addEventListener("click", function (e) {
      if (this.classList.contains("pickr-open")) {
        e.stopImmediatePropagation();
        e.preventDefault();
        pickr.hide();
        return;
      }

      document.getElementById("output").style.display = "none";
      const dl = document.getElementById("download-btn");
      dl.disabled = true;
      dl.style.display = "inline-block";

      const isActive = btn.classList.contains("active");
      const isReady = btn.classList.contains("ready");
      const rect = btn.getBoundingClientRect();
      const clickRatio = (e.clientX - rect.left) / rect.width;

      if (isActive && isReady) {
        if (clickRatio <= 0.2) {
          pickrTargetBtn = btn;

          showCenterPopup();
        } else {
          btn.classList.remove("ready", "active");
          const lang = btn.dataset.target;
          setAddButtonsReady(lang, false);
          setSectionEditability(lang, false);
          subtitleGenerator.resetSections(lang);
          btn.style.display = "none";
          subtitleGenerator.handleLanguageChange();
          subtitleGenerator.toggleLanguageSections();
          updateAddLanguageButton();
        }
        return;
      }

      if (!isActive) {
        btn.classList.add("active");

        btn.style.backgroundImage = "";

        setAddButtonsReady(btn.dataset.target, false);
        setSectionEditability(btn.dataset.target, false);
      } else if (!isReady) {
        btn.classList.add("ready");

        delete btn.dataset.pickrColor;

        btn.style.backgroundImage = "";

        setAddButtonsReady(btn.dataset.target, true);
        setSectionEditability(btn.dataset.target, true);
      }
    });

    btn.addEventListener("dragstart", (e) => {
      if (!btn.classList.contains("active")) {
        e.preventDefault();
        return;
      }
      draggingLang = btn.dataset.target;
      dragSourceBtn = btn;
      btn.style.opacity = 0.6;
      e.dataTransfer.setData("text/plain", draggingLang);
    });
    btn.addEventListener("dragend", resetDragState);
    btn.addEventListener("dragenter", (e) =>
      setDropHighlight(e.currentTarget)
    );
    btn.addEventListener("dragleave", () => setDropHighlight(null));
    btn.addEventListener("dragover", (e) => e.preventDefault());
    btn.addEventListener("drop", (e) => {
      e.preventDefault();
      const targetLang = btn.dataset.target;
      const srcLang = e.dataTransfer.getData("text/plain");
      if (srcLang && srcLang !== targetLang) {
        const srcBtn = document.querySelector(
          `.lang-btn[data-target="${srcLang}"]`
        );
        if (
          srcBtn.classList.contains("active") &&
          btn.classList.contains("active")
        ) {
          subtitleGenerator.duplicateSectionsToTarget(
            codeMap[srcLang],
            codeMap[targetLang]
          );
        }
      }
      resetDragState();
    });
  });

  Object.keys(codeMap).forEach((lang) => {
    const toggleBtn = document.querySelector(
      `.lang-btn[data-target="${lang}"]`
    );
    const isActive = toggleBtn.classList.contains("active");
    toggleBtn.style.display = isActive ? "flex" : "none";
    const sel = `.add-section-btn[data-lang='${codeMap[lang]}']`;
    document
      .querySelectorAll(sel)
      .forEach((el) => (el.style.display = isActive ? "flex" : "none"));
  });

  const modal = document.getElementById("languageModal");
  const modalScroll = modal.querySelector(".lang-modal-scroll");

  modalScroll.innerHTML = "";

  document
    .querySelectorAll(".language-toggle .lang-btn")
    .forEach((srcBtn) => {
      const langCode = srcBtn.dataset.target;
      const labelText = srcBtn.textContent.trim();
      const newBtn = document.createElement("button");

      newBtn.className = "lang-select-btn";
      newBtn.dataset.target = langCode;
      newBtn.textContent = labelText;

      newBtn.style.setProperty(
        "--select-color",
        `var(--lang-${labelText}CC)`
      );

      modalScroll.appendChild(newBtn);
    });

  const selectBtns = modal.querySelectorAll(".lang-select-btn");
  selectBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      subtitleGenerator.toggleLanguageSections();
      updateAddLanguageButton();
    });
  });

  function updateAddLanguageButton() {
    const totalLangs = selectBtns.length;
    const activeLangs =
      document.querySelectorAll(".lang-btn.active").length;
    const addBtn = document.getElementById("addLanguageButton");

    addBtn.style.display = activeLangs < totalLangs ? "block" : "none";
  }

  updateAddLanguageButton();

  addLangBtn.addEventListener("click", function () {
    this.classList.toggle("active");

    if (!modal.classList.contains("hidden")) {
      closeLangModal();
      return;
    }

    selectBtns.forEach((btn) => {
      const langBtn = document.querySelector(
        `.lang-btn[data-target="${btn.dataset.target}"]`
      );
      if (langBtn.classList.contains("active")) {
        btn.disabled = true;
        btn.style.display = "none";
      } else {
        btn.disabled = false;
        btn.style.display = "block";
      }
    });

    const scrollEl = modal.querySelector(".lang-modal-scroll");
    Array.from(scrollEl.querySelectorAll(".lang-select-btn")).forEach(
      (btn) => {
        const lang = btn.dataset.target;
        const toggleBtn = document.querySelector(
          `.lang-btn[data-target="${lang}"]`
        );
        if (toggleBtn.classList.contains("active")) {
          btn.disabled = true;
          btn.style.display = "none";
        } else {
          btn.disabled = false;
          btn.style.display = "block";
        }
      }
    );

    modal.classList.remove("hidden");

    updateToggleBackdrop();

    document.getElementById("modalBackdrop").classList.remove("hidden");

    if (scrollEl && scrollEl.style.display === "block") {
      scrollEl.style.display = "none";
    }
    requestAnimationFrame(() => {
      scrollEl.scrollTop = scrollEl.scrollHeight / 3;
    });

    document.querySelector(".lang-modal-scroll").style.display = "block";
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.add("hidden");

      toggleBackdrop.style.display = "none";

      document.getElementById("modalBackdrop").classList.add("hidden");
    }
  });

  const backdrop = document.getElementById("modalBackdrop");
  backdrop.addEventListener("click", () => {
    modal.classList.add("hidden");
    backdrop.classList.add("hidden");
    toggleBackdrop.style.display = "none";

    document
      .getElementById("addLanguageButton")
      .classList.remove("active");

    document
      .querySelectorAll(".lang-btn.covered")
      .forEach((btn) => btn.classList.remove("covered"));
  });

  const toggleBackdrop = (() => {
    const el = document.createElement("div");
    el.id = "toggleBackdrop";
    document.body.appendChild(el);
    return el;
  })();

  toggleBackdrop.addEventListener("click", () => {
    const addBtn = document.getElementById("addLanguageButton");
    addBtn.click();
    closeLangModal();
  });

  function updateToggleBackdrop() {
    const toggle = document.querySelector(".language-toggle");
    const activeBtns = toggle.querySelectorAll(".lang-btn.active");
    if (!activeBtns.length) {
      toggleBackdrop.style.display = "none";
      return;
    }

    const first = activeBtns[0].getBoundingClientRect();
    const last =
      activeBtns[activeBtns.length - 1].getBoundingClientRect();

    const TIP = 140;
    toggleBackdrop.style.left = first.left - TIP + "px";
    toggleBackdrop.style.top = first.top + "px";
    toggleBackdrop.style.width = 80 + TIP + "px";
    toggleBackdrop.style.height = last.bottom - first.top + "px";

    activeBtns.forEach((btn) => btn.classList.add("covered"));

    toggleBackdrop.style.display = "block";
  }

  document.addEventListener("click", (e) => {
    const scrollEl = document.querySelector(".lang-modal-scroll");
    const addBtn = document.getElementById("addLanguageButton");
    if (!scrollEl) return;

    if (!scrollEl.contains(e.target) && e.target !== addBtn) {
      scrollEl.style.display = "none";
    }
  });

  selectBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const lang = btn.dataset.target;
      const toggleBtn = document.querySelector(
        `.lang-btn[data-target="${lang}"]`
      );

      if (toggleBtn && !toggleBtn.classList.contains("active")) {
        toggleBtn.click();
      }

      const addBtn = document.getElementById("addLanguageButton");
      addBtn.click();

      toggleBtn.style.display = "flex";
      addBtn.parentNode.insertBefore(toggleBtn, addBtn);
      reorderSectionContainers();

      document.getElementById("languageModal").classList.add("hidden");
      document.getElementById("modalBackdrop").classList.add("hidden");

      toggleBackdrop.style.display = "none";

      document
        .querySelectorAll(".lang-btn.covered")
        .forEach((b) => b.classList.remove("covered"));

      subtitleGenerator.toggleLanguageSections();
      updateAddLanguageButton();
    });
  });

  fullscreenBtn.addEventListener("click", () => {
    const player = document.getElementById("player-container");
    if (!document.fullscreenElement) {
      if (player.requestFullscreen) {
        player.requestFullscreen();
      } else if (player.webkitRequestFullscreen) {
        player.webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  });

  captionBtn.addEventListener("click", () => {
    captionsEnabled = !captionsEnabled;
    samiOverlay.style.display = captionsEnabled ? "block" : "none";
    captionBtn.classList.toggle("active", captionsEnabled);
  });

  const videoPanel = document.querySelector(".video-panel");
  const mainContent = document.querySelector(".main-content");
  let isDragging = false;

  let maxDividerX = window.innerWidth;

  divider.addEventListener("mousedown", () => {
    isDragging = true;

    maxDividerX = window.innerWidth;
  });

  document.addEventListener("mouseup", () => {
    isDragging = false;
  });

  document.addEventListener("mouseup", () => {
    isDragging = false;
  });

  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;

    const containerWidth = window.innerWidth;

    const leftBar = document.getElementById("leftBar");
    const leftBarWidth = leftBar
      ? leftBar.getBoundingClientRect().width
      : 0;

    let desiredX = e.clientX;
    desiredX = Math.min(desiredX, maxDividerX);

    const minX = leftBarWidth;
    const maxX = containerWidth;
    desiredX = Math.max(minX, Math.min(desiredX, maxX));

    const prevWidth = videoPanel.clientWidth;
    const prevClientHeight = videoPanel.clientHeight;
    const existedScrollX = videoPanel.scrollWidth > prevWidth;
    const existedScrollY = videoPanel.scrollHeight > prevClientHeight;

    let desiredVideoWidth = desiredX - leftBarWidth;
    videoPanel.style.width = desiredVideoWidth + "px";

    if (desiredVideoWidth > prevWidth) {
      const currentClientWidth = videoPanel.clientWidth;
      const currentClientHeight = videoPanel.clientHeight;

      const willScrollX = videoPanel.scrollWidth > currentClientWidth;
      const willScrollY = videoPanel.scrollHeight > currentClientHeight;

      if (
        (!existedScrollX && willScrollX) ||
        (!existedScrollY && willScrollY)
      ) {
        desiredVideoWidth = prevWidth;
        videoPanel.style.width = desiredVideoWidth + "px";

        desiredX = leftBarWidth + desiredVideoWidth;

        maxDividerX = desiredX;
      }
    }

    videoPanel.style.width = desiredVideoWidth + "px";
    mainContent.style.marginLeft = desiredX + "px";
    divider.style.left = desiredX + "px";

    const btn = document.querySelector(".click-anim-container");
    btn.style.left = `${desiredX + divider.offsetWidth + 45}px`;

    updateSubtitleScale();
    updateOutputBounds();
    resizeWaveformCanvas();

    if (audioBuffer) {
      const duration = video.duration;
      const totalSamples = audioBuffer.length;
      const currentSample =
        duration > 0 ? (video.currentTime / duration) * totalSamples : 0;

      const segmentLength = Math.floor(totalSamples / zoomLevel);
      let desiredPan;
      if (segmentLength >= totalSamples) {
        desiredPan = 0;
      } else {
        desiredPan = currentSample - segmentLength / 2;
      }
      if (desiredPan < 0) desiredPan = 0;
      if (desiredPan > totalSamples - segmentLength) {
        desiredPan = totalSamples - segmentLength;
      }

      panOffset = desiredPan;
      drawWaveform();
      updateZoomHighlight();

      const phW = playheadDiv.offsetWidth;
      const visW = waveformContainer.clientWidth;

      let relX;
      if (segmentLength >= totalSamples) {
        relX = currentSample / totalSamples;
      } else if (
        panOffsetTarget > 0 &&
        panOffsetTarget < totalSamples - segmentLength
      ) {
        relX = 0.5;
      } else {
        relX = (currentSample - panOffset) / segmentLength;
      }

      let cssX = relX * visW - phW / 2;

      cssX = Math.max(0, Math.min(visW - phW, cssX));
      playheadDiv.style.left = cssX + "px";
    }
  });

  langButtons.forEach((btn) => {
    btn.addEventListener("dragover", (e) => e.preventDefault());

    btn.addEventListener("dragenter", (e) => {
      const src = dragSourceBtn;
      if (
        src &&
        btn !== src &&
        src.classList.contains("active") &&
        btn.classList.contains("active")
      ) {
        btn.classList.add("drop-target");
      }
    });

    btn.addEventListener("dragleave", (e) =>
      btn.classList.remove("drop-target")
    );
    btn.addEventListener("drop", (e) =>
      btn.classList.remove("drop-target")
    );
  });

  let draggingLang = null;
  let dragSourceBtn = null;
  let currentTarget = null;

  document.addEventListener(
    "pointerdown",
    (e) => clearInputError(e.target),
    true
  );

  document.addEventListener("focusin", (e) => clearInputError(e.target));

  document.addEventListener("input", (e) => clearInputError(e.target));

  document.body.addEventListener("focus", clearInputError, true);

  document.addEventListener(
    "focusout",
    function (e) {
      if (e.target.classList && e.target.classList.contains("error")) {
        e.target.classList.remove("error");
      }
    },
    true
  );

  subtitleGenerator.toggleLanguageSections();

  function reorderSectionContainers() {
    const parent = document.querySelector(".main-content .container");
    const outputEl = document.getElementById("output");

    document
      .querySelectorAll(".language-toggle .lang-btn")
      .forEach((btn) => {
        if (btn.style.display !== "flex") return;
        const section = document.getElementById(
          `${btn.dataset.target}Container`
        );
        if (section) parent.insertBefore(section, outputEl);
      });
  }

  updateAddLanguageButton();

  const scrollEl = document.querySelector(".lang-modal-scroll");

  scrollEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".lang-select-btn");
    if (!btn || btn.disabled) return;

    const lang = btn.dataset.target;
    const toggleBtn = document.querySelector(
      `.lang-btn[data-target="${lang}"]`
    );
    if (toggleBtn && !toggleBtn.classList.contains("active")) {
      toggleBtn.click();
    }

    const addBtn = document.getElementById("addLanguageButton");
    toggleBtn.style.display = "flex";
    addBtn.parentNode.insertBefore(toggleBtn, addBtn);

    reorderSectionContainers();
    document.getElementById("languageModal").classList.add("hidden");
    subtitleGenerator.toggleLanguageSections();

    updateBookmarks();

    updateAddLanguageButton();

    document.getElementById("modalBackdrop").classList.add("hidden");
    toggleBackdrop.style.display = "none";

    document
      .querySelectorAll(".lang-btn.covered")
      .forEach((b) => b.classList.remove("covered"));
  });

  const items = Array.from(scrollEl.querySelectorAll(".lang-select-btn"));
  items.forEach((item) => scrollEl.appendChild(item.cloneNode(true)));
  items
    .slice()
    .reverse()
    .forEach((item) =>
      scrollEl.insertBefore(item.cloneNode(true), scrollEl.firstChild)
    );

  function resetScroll() {
    scrollEl.scrollTop = scrollEl.scrollHeight / 3;
  }
  resetScroll();

  scrollEl.addEventListener("scroll", () => {
    const third = scrollEl.scrollHeight / 3;
    if (scrollEl.scrollTop < 50) {
      scrollEl.scrollTop += third;
    } else if (scrollEl.scrollTop > third * 2 - 50) {
      scrollEl.scrollTop -= third;
    }
  });

  document.addEventListener(
    "wheel",
    function (e) {
      const scrollEl = document.querySelector(".lang-modal-scroll");

      const modalVisible = !document
        .getElementById("languageModal")
        .classList.contains("hidden");
      const scrollVisible =
        scrollEl && scrollEl.style.display === "block";
      if (modalVisible && scrollVisible) {
        e.preventDefault();
        scrollEl.scrollTop += e.deltaY * 0.48;
      }
    },
    { passive: false }
  );

  function closeLangModal() {
    modal.classList.add("hidden");
    modalBackdrop.classList.add("hidden");

    toggleBackdrop.style.display = "none";

    document
      .getElementById("addLanguageButton")
      .classList.remove("active");

    document
      .querySelectorAll(".lang-btn.covered")
      .forEach((b) => b.classList.remove("covered"));

    const scrollEl = document.querySelector(".lang-modal-scroll");
    if (scrollEl) scrollEl.style.display = "none";
  }

  (function () {
    const overlay = document.createElement("div");
    Object.assign(overlay.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      background: "rgba(0, 0, 0, 0.6)",
      display: "none",
      zIndex: 9999,
    });
    document.body.appendChild(overlay);

    overlay.addEventListener("mousedown", () => pickr && pickr.hide());

    const script = document.createElement("script");
    script.src =
      "https://cdn.jsdelivr.net/npm/@simonwep/pickr@1.8.2/dist/pickr.min.js";
    script.onload = initPickr;
    document.head.appendChild(script);

    let pickr;
    function initPickr() {
      pickr = Pickr.create({
        el: "#color-btn",
        theme: "classic",
        default: "#FFFF00",
        components: {
          preview: false,
          opacity: false,
          hue: true,
          interaction: {
            hex: false,
            rgba: false,
            hsla: false,
            hsva: false,
            cmyk: false,
            input: true,
            clear: false,
            save: false,
          },
        },
      });

      function updateReadyGradient(color) {
        document.querySelectorAll(".lang-btn.ready").forEach((btn) => {
          btn.style.backgroundImage = `linear-gradient(to right, ${color} 20%, transparent 20%)`;
        });
      }

      updateReadyGradient("#FFFF00");

      pickr.on("change", (color) => {
        if (!pickrTargetBtn) return;

        const hex = color.toHEXA().toString();
        pickrTargetBtn.style.backgroundImage = `linear-gradient(to right, ${hex} 20%, transparent 20%)`;

        pickrTargetBtn.dataset.pickrColor = hex;
      });

      pickr.on("show", () => {
        overlay.style.display = "block";

        const lt = pickrTargetBtn.closest(".language-toggle");
        if (lt) lt.classList.add("on-top");

        lt.querySelectorAll(".lang-btn, #addLanguageButton").forEach(
          (el) => {
            if (el !== pickrTargetBtn) el.classList.add("dim");
          }
        );

        const r = pickrTargetBtn.getBoundingClientRect();

        const scrollY = window.scrollY || window.pageYOffset;
        const scrollX = window.scrollX || window.pageXOffset;

        const top = r.bottom + scrollY + 4;

        const left = r.right + scrollX - 250;

        document.documentElement.style.setProperty(
          "--pickr-top",
          `${top}px`
        );
        document.documentElement.style.setProperty(
          "--pickr-left",
          `${left}px`
        );

        pickrTargetBtn.classList.add("pickr-open");

        pickrTargetBtn.style.setProperty("--pickr-top", r.top + "px");
        pickrTargetBtn.style.setProperty("--pickr-left", r.left + "px");
        pickrTargetBtn.classList.add("pickr-open");

        removeCloseListener = () => pickr.hide();
        pickrTargetBtn.addEventListener("click", removeCloseListener);

        pickr.setColor(pickrTargetBtn.dataset.pickrColor || "#FFFF00");
      });

      pickr.on("hide", () => {
        overlay.style.display = "none";

        const lt =
          pickrTargetBtn && pickrTargetBtn.closest(".language-toggle");
        if (lt) {
          lt.classList.remove("on-top");

          lt.querySelectorAll(".dim").forEach((el) =>
            el.classList.remove("dim")
          );
        }

        if (pickrTargetBtn) {
          pickrTargetBtn.classList.remove("pickr-open");
          pickrTargetBtn.style.removeProperty("--pickr-top");
          pickrTargetBtn.style.removeProperty("--pickr-left");

          if (removeCloseListener) {
            pickrTargetBtn.removeEventListener(
              "click",
              removeCloseListener
            );
            removeCloseListener = null;
          }
        }
      });
    }

    window.showCenterPopup = function () {
      if (pickr) pickr.show();
    };
  })();

  const bmContainer = document.getElementById("container");
  const scrollContainer = document.querySelector(".main-content");

  function updateBookmarks() {
    bmContainer.innerHTML = "";
    const totalH = scrollContainer.scrollHeight;
    const viewH = scrollContainer.clientHeight;

    if (totalH <= viewH) {
      bmContainer.innerHTML = "";
      return;
    }

    document
      .querySelectorAll(".section-container:not(.hidden)")
      .forEach((sec) => {
        const topBtn = sec.querySelector(":scope > button");
        if (!topBtn || !topBtn.id) return;

        const relOffset = sec.offsetTop;
        const y = (relOffset / totalH) * viewH;

        const a = document.createElement("a");
        a.href = `#${topBtn.id}`;
        a.className = "bookmark";
        a.style.top = `${y}px`;

        const lang = sec.id.replace("Container", "");
        const toggleBtn = document.querySelector(
          `.lang-btn[data-target="${lang}"]`
        );
        if (toggleBtn) {
          a.style.background =
            getComputedStyle(toggleBtn).backgroundColor;
        }

        bmContainer.appendChild(a);
      });
  }

  updateBookmarks();
  scrollContainer.addEventListener("scroll", updateBookmarks);
  window.addEventListener("resize", updateBookmarks);

  bmContainer.addEventListener("click", (e) => {
    const link = e.target.closest(".bookmark");
    if (!link) return;
    e.preventDefault();

    const id = link.getAttribute("href").slice(1);
    const target = document.getElementById(id);
    if (!target) return;

    scrollContainer.scrollTo({
      top: target.offsetTop - 10,
      behavior: "smooth",
    });
  });

  subtitleGenerator.toggleLanguageSections = (function (orig) {
    return function () {
      orig.apply(this, arguments);
      updateBookmarks();
    };
  })(subtitleGenerator.toggleLanguageSections);

  function drawWaveform() {
    if (!audioBuffer) {
      canvasCtx.clearRect(
        0,
        0,
        waveformCanvas.width,
        waveformCanvas.height
      );
      return;
    }

    const rawData = audioBuffer.getChannelData(0);
    const totalSamples = rawData.length;
    const width = waveformCanvas.width;
    const height = waveformCanvas.height;

    const segmentLength = Math.floor(totalSamples / zoomLevel);
    const startSample = Math.floor(panOffset);
    const endSample = Math.min(startSample + segmentLength, totalSamples);
    const visibleSamples = endSample - startSample;
    const blockSize = visibleSamples / width;
    const filteredData = new Float32Array(width);

    for (let x = 0; x < width; x++) {
      const blockStart = Math.floor(startSample + x * blockSize);
      let sum = 0;
      for (let j = 0; j < blockSize; j++) {
        const idx = blockStart + j;
        if (idx >= endSample) break;
        sum += Math.abs(rawData[idx]);
      }
      filteredData[x] = sum / blockSize;
    }

    canvasCtx.clearRect(0, 0, width, height);
    canvasCtx.fillStyle = "#4285F4";

    for (let x = 0; x < width; x++) {
      const amplitude = filteredData[x] * height;
      canvasCtx.fillRect(x, (height - amplitude) / 2, 1, amplitude);
    }
  }

  function updatePlayhead() {
    if (video.paused || isSeeking) {
      cancelAnimationFrame(playheadReqId);
      return;
    }

    const currentTime = video.currentTime;
    const duration = video.duration;
    const totalSamples = audioBuffer ? audioBuffer.length : 0;
    const currentSample =
      duration > 0 ? (currentTime / duration) * totalSamples : 0;

    const segmentLength = Math.floor(totalSamples / zoomLevel);

    let desiredPan;
    if (segmentLength >= totalSamples) {
      desiredPan = 0;
    } else {
      desiredPan = currentSample - segmentLength / 2;
    }

    if (desiredPan < 0) desiredPan = 0;
    if (desiredPan > totalSamples - segmentLength) {
      desiredPan = totalSamples - segmentLength;
    }

    panOffsetTarget = desiredPan;

    panOffset += (panOffsetTarget - panOffset) * panSmooth;

    if (Math.abs(panOffset - panOffsetTarget) < 0.5) {
      panOffset = panOffsetTarget;
    }

    drawWaveform();
    updateZoomHighlight();

    let xPos;
    if (segmentLength >= totalSamples) {
      xPos = (currentSample / totalSamples) * waveformCanvas.width;
    } else {
      if (
        panOffsetTarget > 0 &&
        panOffsetTarget < totalSamples - segmentLength
      ) {
        xPos = waveformCanvas.width / 2;
      } else {
        xPos =
          ((currentSample - panOffset) / segmentLength) *
          waveformCanvas.width;
      }
    }

    const visibleWidth = waveformCanvas.getBoundingClientRect().width;
    const playheadWidth = playheadDiv.clientWidth;

    const rect = waveformCanvas.getBoundingClientRect();
    const visibleW = rect.width;
    const internalW = waveformCanvas.width;
    const scaleFactor = visibleW / internalW;

    const cssX = xPos * scaleFactor;

    const phW = playheadDiv.offsetWidth;

    cssX = Math.max(0, Math.min(visibleW - phW, cssX));
    playheadDiv.style.left = cssX + "px";

    playheadReqId = requestAnimationFrame(updatePlayhead);
  }

  let singleFrameTimeout;

  waveformCanvas.addEventListener("mousedown", (e) => {
    if (!audioBuffer) return;
    isSeeking = true;

    seekOnCanvas(e);

    if (singleFrameTimeout) clearTimeout(singleFrameTimeout);

    video.play();

    singleFrameTimeout = setTimeout(() => {
      video.pause();
    }, 10);
  });

  window.addEventListener("mousemove", (e) => {
    if (!isSeeking) return;

    const rect = waveformCanvas.getBoundingClientRect();

    if (e.clientX >= rect.left && e.clientX <= rect.right) {
      if (autoScrollInterval) {
        clearInterval(autoScrollInterval);
        autoScrollInterval = null;
      }
      seekOnCanvas(e);

      if (singleFrameTimeout) clearTimeout(singleFrameTimeout);

      video.play();
      singleFrameTimeout = setTimeout(() => {
        video.pause();
      }, 10);
    } else {
      if (!autoScrollInterval) {
        const direction = e.clientX < rect.left ? -1 : 1;
        autoScrollInterval = setInterval(() => {
          const totalSamples = audioBuffer.length;
          const segmentLength = Math.floor(totalSamples / zoomLevel);

          const deltaSamples =
            (SCROLL_SPEED_PX / waveformCanvas.width) * segmentLength;
          panOffset = Math.max(
            0,
            Math.min(
              totalSamples - segmentLength,
              panOffset + direction * deltaSamples
            )
          );
          drawWaveform();
          updateZoomHighlight();
        }, SCROLL_INTERVAL_MS);
      }
    }
  });

  window.addEventListener("mouseup", () => {
    if (isSeeking) {
      isSeeking = false;

      if (singleFrameTimeout) {
        clearTimeout(singleFrameTimeout);
        singleFrameTimeout = null;
      }

      if (autoScrollInterval) {
        clearInterval(autoScrollInterval);
        autoScrollInterval = null;
      }

      if (singleFrameTimeout) {
        clearTimeout(singleFrameTimeout);
        singleFrameTimeout = null;
      }
    }
  });

  function seekOnCanvas(event) {
    const rect = waveformCanvas.getBoundingClientRect();
    const totalSamples = audioBuffer.length;
    const width = waveformCanvas.width;
    const segmentLength = Math.floor(totalSamples / zoomLevel);
    const startSample = Math.floor(panOffset);

    const rawX = event.clientX - rect.left;
    let targetSample = startSample + (rawX / width) * segmentLength;
    targetSample = Math.max(0, Math.min(targetSample, totalSamples));

    let newPan;
    if (targetSample < startSample) {
      newPan = targetSample;
    } else if (targetSample > startSample + segmentLength) {
      newPan = targetSample - segmentLength;
    } else {
      newPan = startSample;
    }
    newPan = Math.max(0, Math.min(newPan, totalSamples - segmentLength));
    panOffset = newPan;

    drawWaveform();
    updateZoomHighlight();

    const phW = playheadDiv.offsetWidth;
    const visW = waveformContainer.clientWidth;
    const relX = (targetSample - panOffset) / segmentLength;

    let cssX = relX * visW - phW / 2;

    cssX = Math.max(0, Math.min(visW - phW, cssX));
    playheadDiv.style.left = cssX + "px";

    const newTime = (targetSample / totalSamples) * video.duration;
    video.currentTime = newTime;
    drawTimeline();
    updateTimeDisplay();
  }

  waveformCanvas.addEventListener("wheel", (e) => {
    if (!audioBuffer) return;
    e.preventDefault();

    const totalSamples = audioBuffer.length;
    const width = waveformCanvas.width;

    const playheadStyleLeft = parseFloat(playheadDiv.style.left) || 0;
    const headRatio = playheadStyleLeft / width;

    const zoomFactor = 1.2;
    let newZoom =
      zoomLevel * (e.deltaY < 0 ? zoomFactor : 1 / zoomFactor);
    newZoom = Math.max(minZoom, Math.min(newZoom, maxZoom));

    const oldZoom = zoomLevel;
    zoomLevel = newZoom;

    const oldSegment = totalSamples / oldZoom;
    const newSegment = totalSamples / newZoom;

    let newPan =
      panOffset + headRatio * oldSegment - headRatio * newSegment;
    newPan = Math.max(0, Math.min(newPan, totalSamples - newSegment));
    panOffset = newPan;

    drawWaveform();

    updateZoomHighlight();

    if (!video.paused) {
      cancelAnimationFrame(playheadReqId);
      updatePlayhead();
    }
  });

  document.body.addEventListener("dragstart", (e) => {
    if (!e.target.matches(".time, .last-time, #time-display")) return;
    e.dataTransfer.setData("text/plain", e.target.value);
    e.dataTransfer.effectAllowed = "copy";
    e.target.classList.add("dragging");
  });
  document.body.addEventListener("dragend", (e) => {
    if (e.target.matches(".time, .last-time, #time-display")) {
      e.target.classList.remove("dragging");
    }
  });
  document.body.addEventListener("dragover", (e) => {
    if (e.target.matches(".time, .last-time, #time-display")) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    }
  });
  document.body.addEventListener("drop", (e) => {
    if (e.target.matches(".time, .last-time, #time-display")) {
      e.preventDefault();
      const text = e.dataTransfer.getData("text/plain");
      e.target.value = text;
      e.target.focus();
    }
  });
});
