// 언어 설정의 중심 목록입니다. 각 항목은 UI 라벨, SAMI 클래스,
// 기본 자막 글꼴, 언어 색상, 초기 표시 여부를 정의합니다.
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

// "KRCC" 같은 SAMI 클래스 이름으로 설정된 글꼴을 빠르게 찾기 위한 표입니다.
const fontFamilies = LANGUAGES.reduce((acc, { label, fontFamily }) => {
  const code = `${label}CC`;
  acc[code] = fontFamily;
  return acc;
}, {});

// SAMI 클래스 이름으로 기본 글자 크기를 빠르게 찾기 위한 표입니다.
const fullPt = LANGUAGES.reduce((acc, { label, fontSize }) => {
  const code = `${label}CC`;
  acc[code] = fontSize;
  return acc;
}, {});

// 각 언어 색상을 CSS 사용자 정의 속성으로 등록합니다.
LANGUAGES.forEach(({ label, color }) => {
  const varName = `--lang-${label}CC`;

  document.documentElement.style.setProperty(varName, color);
});

// 생성되는 자막 섹션 전반에서 사용할 SAMI 클래스 이름 목록입니다.
const LANGUAGE_CODES = LANGUAGES.map((lang) => `${lang.label}CC`);

// 각 언어의 편집 컨테이너를 찾기 위한 메타데이터입니다.
const LANG = LANGUAGES.reduce((acc, { key, label }) => {
  const code = `${label}CC`;
  acc[code] = {
    key: key,
    container: `${key}Container`,
  };
  return acc;
}, {});

// 사용자에게 보이는 언어 키를 SAMI 클래스 코드로 변환합니다.
const codeMap = LANGUAGES.reduce((acc, { key, label }) => {
  acc[key] = `${label}CC`;
  return acc;
}, {});

// 이 앱은 의존성을 가볍게 유지합니다. DOM 준비가 끝나면 모든
// 컨트롤, 생성 섹션, 미디어 동작, 내보내기 로직을 여기에서 연결합니다.
document.addEventListener("DOMContentLoaded", () => {
  // 파형 탐색 중 포인터가 영역 밖으로 나갈 때 자동 스크롤에 사용합니다.
  let autoScrollInterval = null;
  const SCROLL_SPEED_PX = 15;
  const SCROLL_INTERVAL_MS = 40;

  // 파형을 그리고 탐색하기 위한 오디오 디코딩 상태입니다.
  const audioContext = new (window.AudioContext ||
    window.webkitAudioContext)();
  let audioBuffer = null;
  let isPlaying = false;
  let playheadReqId = null;
  let zoomLevel = 1;
  let panOffset = 0;

  // 파형을 확대했을 때 재생 위치를 부드럽게 따라가도록 합니다.
  let panOffsetTarget = 0;
  const panSmooth = 0.1;

  const minZoom = 1;
  let maxZoom;
  let isSeeking = false;

  // 탐색, 그리기, 크기 변경에서 재사용하는 주요 파형과 재생 위치 요소입니다.
  const waveformContainer = document.getElementById("waveformContainer");
  const waveformCanvas = document.getElementById("waveformCanvas");
  const canvasCtx = waveformCanvas.getContext("2d");
  const playheadDiv = document.getElementById("playhead");
  const waveformPlayheadDiv = document.getElementById("waveformPlayhead");

  // 초 단위 시간을 화면의 시간 입력칸에서 쓰는 mm:ss.mmm 형식으로 바꿉니다.
  function formatTime(t) {
    const totalMs = Math.floor(t * 1000);
    const ms = totalMs % 1000;
    const s = Math.floor(t % 60);
    const m = Math.floor((t / 60) % 60);
    return `${m.toString().padStart(2, "0")}:${s
      .toString()
      .padStart(2, "0")}.${ms.toString().padStart(3, "0")}`;
  }

  // 생성된 SAMI 출력에서 파싱한 실시간 자막 미리보기용 큐입니다.
  let samiCues = [];
  let previewLanguageOrder = [];

  // 생성된 SAMI 텍스트가 바뀔 때마다 미리보기 큐를 다시 만듭니다.
  function updateSamiCues() {
    const sami = document.getElementById("output").value;
    previewLanguageOrder = Array.from(
      document.querySelectorAll(".language-toggle .lang-btn.active")
    )
      .map((btn) => codeMap[btn.dataset.target])
      .filter(Boolean);
    samiCues = [];
    if (!sami) {
      renderSamiOverlay(video.currentTime);
      return;
    }
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
    renderSamiOverlay(video.currentTime);
  }

  // 미리보기 오버레이 갱신 중 자막 크기 조절 로직에서 쓰는 로컬 복사본입니다.
  const fullPt = LANGUAGES.reduce((acc, { label, fontSize }) => {
    acc[`${label}CC`] = fontSize;
    return acc;
  }, {});

  // 현재 표시되는 비디오 크기에 맞춰 자막 오버레이 글자 크기를 비례 조정합니다.
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

    overlay.style.bottom = "5%";
  }

  // 미디어의 현재 시간을 드래그 가능한 시간 입력칸에 반영합니다.
  function updateTimeDisplay() {
    if (!isNaN(video.duration)) {
      timeDisplay.value = formatTime(video.currentTime);
    }
  }

  // 사용자가 한 번에 고칠 수 있도록 모든 검증 실패 항목을 함께 보여줍니다.
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

  // 사용자가 입력칸으로 돌아오면 오류 강조 표시를 제거합니다.
  function clearInputError(el) {
    if (el && el.classList && el.classList.contains("error")) {
      el.classList.remove("error");
    }
  }

  // 사용자가 비디오나 오디오 파일을 플레이어에 끌어다 놓을 수 있게 하는 파일 드래그 처리입니다.
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

  // 전체화면 컨트롤은 잠시만 보이고 마우스가 멈추면 사라지도록 합니다.
  function showControls() {
    player.classList.add("show-controls");
    clearTimeout(controlTimeout);
    controlTimeout = setTimeout(() => {
      player.classList.remove("show-controls");
    }, 500);
  }

  // 복사나 정렬 목적의 언어 드래그 상호작용이 끝난 뒤 상태를 초기화합니다.
  function resetDragState() {
    if (dragSourceBtn) {
      dragSourceBtn.style.opacity = "";
      dragSourceBtn.classList.remove(
        "language-drag-source",
        "language-remove-target"
      );
    }
    clearLanguageDropFeedback();
    languageDropIntent = null;
    draggingLang = null;
    dragSourceBtn = null;
  }

  // 중앙 언어 목록을 바탕으로 언어 토글 버튼을 만듭니다.
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

  // 이 애니메이션 버튼은 SAMI 출력을 생성하고 출력 화면 표시도 전환합니다.
  const clickBtn = document.querySelector(".click-anim-container");
  const rootStyles = window.getComputedStyle(document.documentElement);
  const parsedTransferButtonOffsetX = parseFloat(
    rootStyles.getPropertyValue("--transfer-control-offset-x")
  );
  const TRANSFER_BUTTON_OFFSET_X = Number.isFinite(
    parsedTransferButtonOffsetX
  )
    ? parsedTransferButtonOffsetX
    : 0;
  const parsedTransferControlSize = parseFloat(
    rootStyles.getPropertyValue("--transfer-control-size")
  );
  const TRANSFER_CONTROL_SIZE = Number.isFinite(
    parsedTransferControlSize
  )
    ? parsedTransferControlSize
    : 44;
  const TRANSFER_CONTROL_EDGE_GAP = 8;
  const MIN_TRANSFER_CONTROL_SAFETY_SPACE = 54;
  const TRANSFER_CONTROL_SAFETY_SPACE = Math.max(
    MIN_TRANSFER_CONTROL_SAFETY_SPACE,
    TRANSFER_BUTTON_OFFSET_X +
      TRANSFER_CONTROL_SIZE / 2 +
      TRANSFER_CONTROL_EDGE_GAP
  );

  // 작업영역 변경은 생성 결과를 건드리지 않고 생성 버튼만 미완료 상태로 되돌립니다.
  function markWorkspaceDirty() {
    const output = document.getElementById("output");
    if (output) output.style.display = "none";

    const downloadBtn = document.getElementById("download-btn");
    if (downloadBtn) downloadBtn.disabled = true;

    if (clickBtn) {
      clickBtn.setAttribute("data-state", "0");
      window.clickAnimState = 0;
    }

    document.querySelector(".main-content")?.classList.remove("minimal");
  }

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

    // 생성된 SAMI textarea를 드래그 가능한 미디어 분할선 옆에 배치합니다.
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
    const dividerMarginLeft =
      parseFloat(window.getComputedStyle(divider).marginLeft) || 0;
    clickBtn.style.left = `${
      divider.offsetLeft - dividerMarginLeft + TRANSFER_BUTTON_OFFSET_X
    }px`;
  }

  // 사용자가 팝업이나 배경을 닫으면 검증 안내를 닫습니다.
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

  // Pickr가 강조 색상을 편집 중인 활성 언어 버튼입니다.
  let pickrTargetBtn = null;

  const video = document.getElementById("video");

  // 새로 불러온 미디어가 들리되 너무 크지 않도록 중간 정도 볼륨에서 시작합니다.
  video.volume = 0.5;

  // 비디오를 패널 밖으로 드래그하면 빠르게 미디어를 제거하는 동작으로 사용합니다.
  video.setAttribute("draggable", true);

  // 비디오를 직접 클릭하면 상위 요소로 전달하지 않고 재생/일시정지만 처리합니다.
  video.addEventListener(
    "click",
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      togglePlayPause();
    },
    true
  );

  // 전체화면에서는 드래그가 실수로 느껴질 수 있어 미디어 제거 드래그를 비활성화합니다.
  video.addEventListener("dragstart", (e) => {
    const isFullScreen =
      document.fullscreenElement === player ||
      document.webkitFullscreenElement === player;
    if (isFullScreen) {
      e.preventDefault();
    }
  });

  let volumeIndicatorTimeout;

  // 마우스 휠로 볼륨을 바꾼 뒤 잠시 표시되는 비디오 위 볼륨 안내입니다.
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

  // 툴바와 미디어 제어 요소입니다.
  const timeDisplay = document.getElementById("time-display");
  const copyBtn = document.getElementById("copy-btn");

  const timeFieldSelector = ".time, .last-time, #time-display";
  const sanitizeTimeCharacters = (value) =>
    value.replace(/[^0-9.:,;]/g, "");

  // Time fields accept only ASCII digits and supported time separators.
  // Capture-phase sanitizing also covers paste, autofill, and IME input before
  // the subtitle generation listeners read the field value.
  document.addEventListener(
    "beforeinput",
    (e) => {
      if (!e.target.matches(timeFieldSelector)) return;
      if (typeof e.data === "string" && /[^0-9.:,;]/.test(e.data)) {
        e.preventDefault();
      }
    },
    true
  );

  document.addEventListener(
    "input",
    (e) => {
      if (!e.target.matches(timeFieldSelector)) return;

      const originalValue = e.target.value;
      const sanitizedValue = sanitizeTimeCharacters(originalValue);
      if (originalValue === sanitizedValue) return;

      const cursor = e.target.selectionStart ?? originalValue.length;
      const nextCursor = sanitizeTimeCharacters(
        originalValue.slice(0, cursor)
      ).length;

      e.target.value = sanitizedValue;
      e.target.setSelectionRange(nextCursor, nextCursor);
    },
    true
  );

  const captionBtn = document.getElementById("caption-btn");
  const samiOverlay = document.getElementById("samiOverlay");
  let captionsEnabled = true;

  const fullscreenBtn = document.getElementById("fullscreen-btn");
  const timelineContainer = document.getElementById("timelineContainer");
  const timelineCanvas = document.getElementById("timelineCanvas");
  const timelineCtx = timelineCanvas.getContext("2d");
  let timelineEnabled = false;

  // Enter 키로 빠르게 전체화면을 전환합니다.
  document.addEventListener("keydown", (e) => {
    if (e.code === "Enter") {
      e.preventDefault();

      fullscreenBtn.click();
    }
  });

  const sectionContainers = document.getElementById("sectionContainers");

  // "ready" 상태의 언어는 섹션 안에서 줄별 세부 시간 제어를 허용합니다.
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

  // 각 언어마다 편집 컨테이너와 최상단 추가 버튼을 하나씩 만듭니다.
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

  // 사용자가 입력칸에 타이핑 중이 아닐 때 Space 키로 재생을 전환합니다.
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

  // 미디어 파일에서 재생 시간 정보가 준비될 때까지 타임라인을 숨깁니다.
  timelineCanvas.style.display = "none";

  const fileInput = document.getElementById("fileInput");
  const videoContainer = document.getElementById("video-container");

  // 일반 화면에서는 미디어 패널 위 마우스 휠로 볼륨을 조절합니다.
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

  // 전체화면에서는 휠 이벤트가 문서에 들어오므로 그곳에서 볼륨을 처리합니다.
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

  // 기준 크기는 비디오에 맞춰 SAMI 오버레이 텍스트를 확대/축소할 때 사용합니다.
  let baselineWidth = videoContainer.clientWidth;

  const placeholder = document.getElementById("video-placeholder");

  // 클릭과 키보드 단축키가 함께 사용하는 재생/일시정지 도우미입니다.
  function togglePlayPause() {
    if (!video.src || wasScrubbing) return;

    if (video.paused) video.play();
    else video.pause();

    updateTimeDisplay();
  }

  // 빈 플레이어를 클릭하면 파일 선택기를 열고, 미디어가 있으면 재생을 전환합니다.
  videoContainer.addEventListener("click", (e) => {
    if (!video.src) {
      fileInput.click();
      return;
    }

    togglePlayPause();
  });

  // 전체화면에서 가로로 드래그하면 미디어 재생 위치를 탐색합니다.
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

  // 가로 포인터 위치를 미디어 시간으로 변환합니다.
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

  // 드래그 대신 클릭하는 사용자를 위한 숨겨진 파일 입력 대체 경로입니다.
  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];

    if (
      file &&
      (file.type.startsWith("video/") || file.type.startsWith("audio/"))
    ) {
      loadVideo(file);
    }
  });

  // 미디어 파일을 플레이어에 불러오고, 파형을 그리기 위해 오디오를 디코딩하며,
  // 재생 시간 정보에 의존하는 컨트롤을 활성화합니다.
  function loadVideo(file) {
    video.addEventListener(
      "loadedmetadata",
      () => {
        playheadDiv.style.display = "block";
        waveformPlayheadDiv.style.display = "block";

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
          waveformPlayheadDiv.style.visibility = "visible";


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

  // 재생 중 타임라인, 시간 표시, 파형 재생 위치를 동기화합니다.
  video.addEventListener("timeupdate", () => {
    if (!isNaN(video.duration)) {
      drawTimeline();
      updateTimeDisplay();
      renderSamiOverlay(video.currentTime);
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

  // 렌더링되는 각 비디오 프레임마다 활성 클래스별 최신 큐를 선택합니다.
  function renderSamiOverlay(t = video.currentTime) {
    const lines = [];
    const cueClasses = [...new Set(samiCues.map((c) => c.cls))];
    const cueClassSet = new Set(cueClasses);
    const generatedClasses = previewLanguageOrder.filter((code) =>
      cueClassSet.has(code)
    );
    const generatedClassSet = new Set(generatedClasses);
    const classes = generatedClasses.concat(
      cueClasses.filter((code) => !generatedClassSet.has(code))
    );

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
  }

  function updateSamiOverlay(now, metadata) {
    renderSamiOverlay(metadata.mediaTime);

    video.requestVideoFrameCallback(updateSamiOverlay);
  }

  video.addEventListener("play", () => {
    video.requestVideoFrameCallback(updateSamiOverlay);
  });

  video.addEventListener("pause", () => {
    cancelAnimationFrame(playheadReqId);
    renderSamiOverlay(video.currentTime);
  });

  // 타임라인과 전체화면 탐색에 사용하는 포인터 상호작용 상태값입니다.
  let isScrubbing = false;
  let isTimelineScrubbing = false;
  let scrubTimeout;

  let wasScrubbing = false;
  let didDrag = false;
  let dragStartX = 0;

  // 비디오 바로 아래의 작은 타임라인으로 재생 위치를 이동합니다.
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

  // 재생 시간 정보가 준비되면 수동 시간 이동과 타임라인 그리기를 활성화합니다.
  video.addEventListener("loadedmetadata", () => {
    timeDisplay.disabled = false;
    resizeTimelineCanvas();
    drawTimeline();
  });

  // 시간 표시를 클릭하면 정확한 시간을 복사하거나 드래그할 수 있도록 일시정지합니다.
  timeDisplay.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!timeDisplay.disabled && video.src) {
      video.pause();
    }
  });

  // 시간 표시값을 수정하면 입력한 시간으로 미디어를 이동합니다.
  timeDisplay.addEventListener("blur", () => {
    if (timeDisplay.disabled || !video.src) return;

    const timeMs = subtitleGenerator.convertTimeToMilliseconds(
      timeDisplay.value
    );

    if (timeMs !== null && Number.isFinite(video.duration)) {
      const targetTime = Math.max(
        0,
        Math.min(timeMs / 1000, video.duration)
      );
      const currentDisplayMs = Math.floor(video.currentTime * 1000);
      const targetDisplayMs = Math.floor(targetTime * 1000);

      clearTimeout(scrubTimeout);
      video.pause();

      if (targetDisplayMs !== currentDisplayMs) {
        video.currentTime = targetTime;
      }

      drawTimeline();
      if (audioBuffer) {
        syncPlayheadsToCurrentWaveformView(targetTime);
      } else {
        setPlayheadPositions(0, targetTime);
      }
      renderSamiOverlay(targetTime);
      updateTimeDisplay();
    } else {
      timeDisplay.value = formatTime(video.currentTime);
    }
  });

  videoContainer.addEventListener("dragover", onDragOver);
  videoContainer.addEventListener("dragleave", onDragLeave);
  videoContainer.addEventListener("drop", onDrop);

  // 비디오를 컨테이너 밖에 놓으면 미디어를 제거하고 UI를 초기화합니다.
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
      waveformPlayheadDiv.style.display = "none";

    }
  });

  // 타이머 툴바 버튼은 드래그 가능한 현재 시간 입력칸을 보이거나 숨깁니다.
  copyBtn.addEventListener("click", () => {
    const td = document.getElementById("time-display");

    const isHidden = td.classList.toggle("hidden");
    copyBtn.classList.toggle("active", !isHidden);
  });

  const overlay = document.getElementById("samiOverlay");

  updateSubtitleScale();

  window.addEventListener("resize", updateSubtitleScale);

  window.addEventListener("resize", updateOutputBounds);

  // 전체 타임라인 중 파형에서 현재 보이는 구간을 표시합니다.
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

  // The overview playhead uses the full media duration, while the waveform
  // playhead uses the currently visible (zoomed/panned) waveform coordinates.
  function setPlayheadPositions(waveformX, mediaTime = video.currentTime) {
    const timelineWidth = timelineContainer.clientWidth;
    const timelinePlayheadWidth = playheadDiv.offsetWidth;
    const waveformWidth = waveformContainer.clientWidth;
    const waveformPlayheadWidth = waveformPlayheadDiv.offsetWidth;

    const clampedWaveformX = Math.max(
      0,
      Math.min(waveformWidth - waveformPlayheadWidth, waveformX)
    );
    waveformPlayheadDiv.style.left = clampedWaveformX + "px";

    if (!Number.isFinite(video.duration) || video.duration <= 0) return;

    const timeRatio = Math.max(0, Math.min(1, mediaTime / video.duration));
    const timelineX = timeRatio * (timelineWidth - timelinePlayheadWidth);
    playheadDiv.style.left = timelineX + "px";
  }

  function syncPlayheadsToCurrentWaveformView(mediaTime = video.currentTime) {
    if (
      !audioBuffer ||
      !Number.isFinite(video.duration) ||
      video.duration <= 0
    ) {
      return;
    }

    const totalSamples = audioBuffer.length;
    const currentSample = (mediaTime / video.duration) * totalSamples;
    const segmentLength = Math.floor(totalSamples / zoomLevel);
    const waveformWidth = waveformContainer.clientWidth;
    const waveformPlayheadWidth = waveformPlayheadDiv.offsetWidth;
    const relativePosition = (currentSample - panOffset) / segmentLength;
    const waveformX =
      relativePosition * (waveformWidth - waveformPlayheadWidth);

    setPlayheadPositions(waveformX, mediaTime);
  }

  // 그리기 전에 캔버스 실제 크기를 CSS 크기와 맞춥니다.
  function resizeWaveformCanvas() {
    const rect = waveformContainer.getBoundingClientRect();
    waveformCanvas.width = rect.width;
    waveformCanvas.height = rect.height;
    drawWaveform();
  }

  // 레이아웃 변경 후에도 타임라인 캔버스가 선명하게 보이도록 합니다.
  function resizeTimelineCanvas() {
    const rect = timelineContainer.getBoundingClientRect();
    timelineCanvas.width = rect.width;
    timelineCanvas.height = rect.height;
    drawTimeline();
  }

  // 현재 타임라인 그리기는 캔버스를 비우며, 재생 위치는 DOM 요소로 표시합니다.
  function drawTimeline() {
    const width = timelineCanvas.width;
    const height = timelineCanvas.height;
    timelineCtx.clearRect(0, 0, width, height);
    if (!timelineEnabled || isNaN(video.duration) || video.duration === 0)
      return;
    // 빨간 재생 위치 표시는 이제 CSS #playhead 요소로 렌더링합니다.
  }

  window.addEventListener("resize", resizeWaveformCanvas);
  window.addEventListener("resize", resizeTimelineCanvas);
  resizeWaveformCanvas();
  resizeTimelineCanvas();

  updateZoomHighlight();

  let controlTimeout;
  const player = document.getElementById("player-container");

  // 전체화면 진입/해제 시 보이는 컨트롤과 크기 조정 방식을 바꿉니다.
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

  // 자막 편집 폼을 관리하고 화면의 입력값을 SAMI 출력으로 변환합니다.
  class SubtitleGenerator {
    constructor() {
      // 출력 textarea와 제목 입력칸은 모든 언어가 함께 사용합니다.
      this.output = document.getElementById("output");
      this.titleText = document.getElementById("titleText");

      // 각 SAMI 클래스별 섹션 요소를 순서대로 보관합니다.
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

    // 어떤 언어 컨테이너를 표시할지 다시 계산합니다.
    handleLanguageChange() {
      this.toggleLanguageSections();
    }

    // 새 자막 블록을 추가합니다. 필요하면 기존 블록 바로 뒤에 넣습니다.
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

    // SAMI 클래스 코드에 해당하는 DOM 컨테이너를 찾습니다.
    getContainerByLangClass(c) {
      return document.getElementById(LANG[c].container);
    }

    // DOM에 삽입한 순서를 내부 섹션 목록에도 반영합니다.
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

    // 번호, 시간별 줄, 종료 시간, 컨트롤을 포함한 자막 섹션 하나를 만듭니다.
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

    // 종료 시간 행 앞에 시작 시간/텍스트 행 하나를 삽입합니다.
    addInputGroup(sec, ref = null) {
      const grp = this.createInputGroup();
      if (ref) sec.insertBefore(grp, ref.nextSibling);
      else sec.insertBefore(grp, sec.querySelector(".last-time-input"));
      this.adjustInputWidth(grp.querySelector(".text"));
    }

    // 추가/삭제 컨트롤이 있는 편집 가능한 자막 행 하나를 만듭니다.
    createInputGroup() {
      const g = document.createElement("div");
      g.className = "input-group";
      g.innerHTML = `
<span class="remove-btn"></span>






<input type="text" class="time" placeholder="Start time" pattern="[0-9.:,;]*" draggable="true">





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

    // 종료 시간은 빈 SAMI 큐를 출력해 해당 섹션을 닫습니다.
    createLastTimeInputGroup() {
      const l = document.createElement("div");
      l.className = "last-time-input";
      l.innerHTML = `<input type="text" class="last-time" placeholder="End time" pattern="[0-9.:,;]*" draggable="true">`;
      return l;
    }

    // 각 자막 블록 아래에 표시되는 섹션 추가 컨트롤입니다.
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

    // 행을 삭제합니다. 마지막 행이었다면 섹션 전체를 삭제합니다.
    removeInputGroup(g) {
      const content = g.closest(".section-content");
      content.removeChild(g);
      if (!content.querySelectorAll(".input-group").length) {
        this.removeInputSection(content.closest(".input-section"));
      }
    }

    // DOM과 내부 순서 목록에서 섹션을 함께 삭제합니다.
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

    // 섹션 추가나 삭제 후 보이는 섹션 번호를 다시 매깁니다.
    updateSectionNumbers(c) {
      this.getContainerByLangClass(c)
        .querySelectorAll(".input-section")
        .forEach(
          (s, i) =>
            (s.querySelector(".section-number").textContent = i + 1)
        );
    }

    // mm:ss.mmm 계열 구분자를 받아 밀리초 단위로 정규화합니다.
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

    // 전체 시간 변환을 시도하기 전 가볍게 형식을 검증합니다.
    validateTimeFormat(t) {
      return /^[0-9]+[.:,;][0-5]?[0-9][.:,;][0-9]{1,4}$/.test(t.trim());
    }

    // 보이는 입력값을 검증하고, SAMI 마크업을 생성하고, 미리보기 큐를 갱신하며,
    // 출력이 최신 상태가 되면 다운로드를 활성화합니다.
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

    // 편집 섹션 하나를 SAMI <SYNC> 큐들의 순서로 변환합니다.
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

    // 생성된 SAMI 텍스트를 제목 기반 이름의 .smi 파일로 다운로드합니다.
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

    // 한 언어의 섹션 시간 구조를 다른 언어로 복사합니다.
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

    // 활성 언어 컨테이너를 표시하고 비활성 언어 내용은 비웁니다.
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

    // 특정 언어에 생성된 모든 편집 섹션을 삭제합니다.
    resetSections(langKey) {
      const code = Object.keys(LANG).find((k) => LANG[k].key === langKey);
      if (!code) return;
      const cont = this.getContainerByLangClass(code);
      while (cont.querySelector(".section-wrapper")) {
        cont.removeChild(cont.querySelector(".section-wrapper"));
      }
    }

    // SAMI 클래스 코드에 연결된 언어 키를 반환합니다.
    getLangValue(c) {
      return LANG[c].key;
    }

    // 공통 입력 리스너가 크기, 생성 출력, 검증 상태를 동기화합니다.
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
          inp.dispatchEvent(new Event("input", { bubbles: true }));
        }
      });

      document.body.addEventListener("input", (e) => {
        if (document.body.classList.contains("modal-open")) return;

        if (
          e.target.id === "titleText" ||
          e.target.closest(".input-section")
        ) {
          markWorkspaceDirty();
        }
      });

      document.body.addEventListener("click", (e) => {
        const btn = e.target.closest(
          ".lang-btn, .lang-select-btn, .add-section-btn, .add-btn, .remove-btn"
        );

        if (
          btn?.classList.contains("lang-btn") &&
          btn.classList.contains("ready")
        ) {
          const rect = btn.getBoundingClientRect();
          const clickRatio = (e.clientX - rect.left) / rect.width;
          if (clickRatio <= 0.2) return;
        }

        if (btn) {
          markWorkspaceDirty();
        }
      });
    }

    // 섹션 안의 모든 텍스트 입력칸 너비를 가장 긴 줄에 맞춥니다.
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

    // 생성된 SAMI 내용에 맞춰 출력 textarea 높이를 늘립니다.
    adjustOutputHeight() {
      this.output.style.height = "auto";
      this.output.style.height = this.output.scrollHeight + "px";
    }
  }

  // 정적 DOM 참조가 모두 준비된 뒤 편집 컨트롤러를 생성합니다.
  const subtitleGenerator = new SubtitleGenerator();

  // 생성 출력물을 직접 수정해도 textarea 높이가 사용하기 좋게 유지되도록 합니다.
  document
    .getElementById("output")
    .addEventListener("input", function () {
      this.style.height = "auto";
      this.style.height = this.scrollHeight + "px";
    });

  // 언어 버튼은 숨김, 활성, ready/편집 가능 상태를 오갑니다.
  const langButtons = document.querySelectorAll(".lang-btn");
  let draggingLang = null;
  let dragSourceBtn = null;
  let languageDropIntent = null;

  // 해당 언어 섹션에서 줄별 세부 컨트롤을 보여줄지 전환합니다.
  function setSectionEditability(lang, editable) {
    const code = codeMap[lang];
    document
      .querySelectorAll(`.input-section[data-lang-class="${code}"]`)
      .forEach((sec) =>
        sec.classList.toggle("section-view-only", !editable)
      );
  }

  function collapseTrackingInputGroups(lang) {
    const code = codeMap[lang];

    document
      .querySelectorAll(`.input-section[data-lang-class="${code}"]`)
      .forEach((section) => {
        const groups = Array.from(section.querySelectorAll(".input-group"));
        groups.slice(1).forEach((group) => group.remove());

        const firstText = groups[0]?.querySelector(".text");
        if (firstText) subtitleGenerator.adjustInputWidth(firstText);
      });
  }

  // 언어 버튼 내부 이벤트 대상을 다루기 위한 도우미입니다.
  // Tracking 강조색을 바로 지우지 않고 등장 모션의 반대 방향으로 사라지게 합니다.
  function playTrackingExit(btn) {
    const currentBackground = getComputedStyle(btn).backgroundImage;
    let fallbackTimer;

    btn.style.removeProperty("animation");
    btn.style.backgroundImage = currentBackground;
    btn.style.backgroundSize = "100% 100%";
    btn.classList.remove("ready");
    btn.classList.add("tracking-exit");

    const finish = () => {
      if (!btn.classList.contains("tracking-exit")) return;

      btn.classList.remove("tracking-exit");
      btn.style.backgroundImage = "";
      btn.style.backgroundSize = "";
      clearTimeout(fallbackTimer);
    };

    btn.addEventListener(
      "animationend",
      (event) => {
        if (event.animationName === "slideUnfill") finish();
      },
      { once: true }
    );

    // 애니메이션 이벤트가 생략되는 환경에서도 임시 상태를 정리합니다.
    fallbackTimer = setTimeout(finish, 400);
  }

  function closestLangBtn(el) {
    return el ? el.closest(".lang-btn") : null;
  }

  function isPointInsideRect(x, y, rect) {
    return (
      x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
    );
  }

  function getLangBtnAtPoint(el, x, y) {
    const btn = closestLangBtn(el);
    if (!btn) return null;
    return isPointInsideRect(x, y, btn.getBoundingClientRect()) ? btn : null;
  }

  function isPointInsideLanguageToggle(x, y) {
    return isPointInsideRect(x, y, languageToggle.getBoundingClientRect());
  }

  function removeLanguageButton(btn) {
    if (!btn || !btn.classList.contains("active")) return;

    const lang = btn.dataset.target;
    btn.classList.remove("ready", "tracking-exit", "active");
    btn.style.display = "none";
    btn.style.backgroundImage = "";
    btn.style.removeProperty("animation");
    btn.style.removeProperty("background-size");

    setAddButtonsReady(lang, false);
    setSectionEditability(lang, false);
    subtitleGenerator.resetSections(lang);
    subtitleGenerator.toggleLanguageSections();
    reorderSectionContainers();

    updateBookmarks();
    updateAddLanguageButton();
    markWorkspaceDirty();
  }

  // 보이는 각 언어 버튼에 활성화, Tracking 전환, 색상 선택기 열기,
  // 시간 구조 복사와 목록 밖 드롭 제거 기능을 연결합니다.
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

      if (this.classList.contains("tracking-exit")) return;

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
          const lang = btn.dataset.target;
          playTrackingExit(btn);
          collapseTrackingInputGroups(lang);
          setAddButtonsReady(lang, false);
          setSectionEditability(lang, false);
          updateBookmarks();
        }
        return;
      }

      if (!isActive) {
        btn.classList.add("active");

        btn.style.backgroundImage = "";

        setAddButtonsReady(btn.dataset.target, false);
        setSectionEditability(btn.dataset.target, false);
      } else if (!isReady) {
        btn.style.removeProperty("animation");
        btn.style.removeProperty("background-size");
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
      btn.classList.add("language-drag-source");
      e.dataTransfer.setData("text/plain", draggingLang);
      e.dataTransfer.setData("application/x-subpik-language", draggingLang);
      e.dataTransfer.effectAllowed = "copyMove";
    });
    btn.addEventListener("dragend", resetDragState);
  });

  // 처음 로드할 때는 초기 활성 언어만 표시합니다.
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

  // 렌더링된 언어 버튼을 바탕으로 언어 선택 모달을 채웁니다.
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

  // 사용 가능한 모든 언어가 이미 활성화되면 추가 버튼을 숨깁니다.
  function updateAddLanguageButton() {
    const totalLangs = selectBtns.length;
    const activeLangs =
      document.querySelectorAll(".lang-btn.active").length;
    const addBtn = document.getElementById("addLanguageButton");

    addBtn.style.display = activeLangs < totalLangs ? "block" : "none";
  }

  updateAddLanguageButton();

  // 언어 선택기를 열고 닫으며 이미 활성화된 선택지는 숨깁니다.
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

  // 토글 배경은 모달 뒤에 가려진 언어 버튼이 클릭되는 것을 막습니다.
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

  // 선택기가 열려 있는 동안 활성 언어 버튼을 덮도록 배경 크기를 맞춥니다.
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

  // 언어를 선택하면 해당 토글을 활성화하고 편집 컨테이너를 삽입합니다.
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

  // 툴바의 전체화면 버튼은 브라우저별 전체화면 API를 감쌉니다.
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

  // 툴바의 자막 버튼은 실시간 SAMI 오버레이를 켜고 끕니다.
  captionBtn.addEventListener("click", () => {
    captionsEnabled = !captionsEnabled;
    samiOverlay.style.display = captionsEnabled ? "block" : "none";
    captionBtn.classList.toggle("active", captionsEnabled);
  });

  // 미디어 패널 크기를 바꾸는 드래그 분할선 상태입니다.
  const videoPanel = document.querySelector(".video-panel");
  const mainContent = document.querySelector(".main-content");
  let isDragging = false;
  const MAX_MEDIA_PANEL_WIDTH = 1432;
  const COLLAPSED_MEDIA_THRESHOLD = 48;

  // 최초 화면에서는 재생바 중심이 화살표 중심과 같은 높이에 오도록
  // 재생바를 움직이지 않고 미디어 패널과 구분선의 가로 위치를 보정합니다.
  function alignInitialDividerToTimeline() {
    const timeline = document.getElementById("timelineContainer");
    const leftBar = document.getElementById("leftBar");
    if (!timeline || !leftBar || !clickBtn) return;

    const timelineRect = timeline.getBoundingClientRect();
    const controlRect = clickBtn.getBoundingClientRect();
    const timelineCenterY = timelineRect.top + timelineRect.height / 2;
    const controlCenterY = controlRect.top + controlRect.height / 2;
    const verticalDelta = controlCenterY - timelineCenterY;

    if (Math.abs(verticalDelta) < 0.5) return;

    const leftBarWidth = leftBar.getBoundingClientRect().width;
    const currentMediaWidth = videoPanel.getBoundingClientRect().width;
    const widthDelta = verticalDelta * (16 / 9);
    const maxMediaWidth = Math.min(
      MAX_MEDIA_PANEL_WIDTH,
      window.innerWidth -
        leftBarWidth -
        TRANSFER_CONTROL_SAFETY_SPACE
    );
    const desiredMediaWidth = Math.max(
      0,
      Math.min(currentMediaWidth + widthDelta, maxMediaWidth)
    );
    const desiredDividerX = leftBarWidth + desiredMediaWidth;

    videoPanel.style.width = `${desiredMediaWidth}px`;
    mainContent.style.marginLeft = `${desiredDividerX}px`;
    divider.style.left = `${desiredDividerX}px`;
    clickBtn.style.left = `${
      desiredDividerX + TRANSFER_BUTTON_OFFSET_X
    }px`;

    requestAnimationFrame(() => {
      resizeTimelineCanvas();
      resizeWaveformCanvas();
      updateSubtitleScale();
    });
  }

  requestAnimationFrame(alignInitialDividerToTimeline);

  divider.addEventListener("mousedown", () => {
    isDragging = true;
    divider.classList.add("is-dragging");
  });

  document.addEventListener("mouseup", () => {
    isDragging = false;
    divider.classList.remove("is-dragging");
  });

  // 미디어 패널 크기를 바꾸고 관련 오버레이와 캔버스를 다시 계산합니다.
  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;

    const containerWidth = window.innerWidth;

    const leftBar = document.getElementById("leftBar");
    const leftBarWidth = leftBar
      ? leftBar.getBoundingClientRect().width
      : 0;

    const minX = leftBarWidth;
    const maxX = Math.max(
      minX,
      Math.min(
        containerWidth - TRANSFER_CONTROL_SAFETY_SPACE,
        leftBarWidth + MAX_MEDIA_PANEL_WIDTH
      )
    );
    const desiredX = Math.max(minX, Math.min(e.clientX, maxX));
    const desiredVideoWidth = desiredX - leftBarWidth;

    videoPanel.style.width = desiredVideoWidth + "px";
    videoPanel.classList.toggle(
      "is-collapsed",
      desiredVideoWidth <= COLLAPSED_MEDIA_THRESHOLD
    );
    mainContent.style.marginLeft = desiredX + "px";
    divider.style.left = desiredX + "px";

    clickBtn.style.left = `${desiredX + TRANSFER_BUTTON_OFFSET_X}px`;

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
      const visW = timelineContainer.clientWidth;

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

      let cssX = relX * (visW - phW);

      cssX = Math.max(0, Math.min(visW - phW, cssX));
      setPlayheadPositions(cssX);

    }
  });

  // 언어 사이에서 시간 구조를 드래그할 때 보여주는 시각 피드백입니다.
  const languageToggle = document.querySelector(".language-toggle");
  const languageDropIndicator = document.createElement("div");
  languageDropIndicator.className = "language-drop-indicator";
  languageDropIndicator.hidden = true;
  languageToggle.appendChild(languageDropIndicator);

  // 언어 드래그 앤 드롭의 현재 출발/대상 상태입니다.
  function getVisibleLanguageButtons() {
    return Array.from(languageToggle.querySelectorAll(":scope > .lang-btn")).filter(
      (btn) =>
        btn.classList.contains("active") &&
        window.getComputedStyle(btn).display !== "none"
    );
  }

  function clearLanguageDropFeedback() {
    languageToggle
      .querySelectorAll(".lang-btn.drop-target")
      .forEach((btn) => btn.classList.remove("drop-target"));
    languageDropIndicator.hidden = true;
    if (dragSourceBtn) {
      dragSourceBtn.classList.remove("language-remove-target");
    }
  }

  function showLanguageDropIndicator(beforeBtn) {
    const toggleRect = languageToggle.getBoundingClientRect();
    const visibleButtons = getVisibleLanguageButtons().filter(
      (btn) => btn !== dragSourceBtn
    );
    let indicatorY;

    if (beforeBtn) {
      indicatorY = beforeBtn.getBoundingClientRect().top - toggleRect.top - 4;
    } else {
      const lastBtn = visibleButtons[visibleButtons.length - 1];
      const anchor = lastBtn || document.getElementById("addLanguageButton");
      indicatorY = anchor.getBoundingClientRect().bottom - toggleRect.top + 4;
    }

    languageDropIndicator.style.top = `${indicatorY}px`;
    languageDropIndicator.hidden = false;
  }

  function updateLanguageDropIntent(e) {
    if (!dragSourceBtn || !dragSourceBtn.classList.contains("active")) {
      languageDropIntent = null;
      clearLanguageDropFeedback();
      return;
    }

    const targetBtn = getLangBtnAtPoint(e.target, e.clientX, e.clientY);
    if (
      targetBtn &&
      targetBtn !== dragSourceBtn &&
      targetBtn.classList.contains("active")
    ) {
      languageDropIntent = { type: "copy", targetBtn };
      clearLanguageDropFeedback();
      targetBtn.classList.add("drop-target");
      e.dataTransfer.dropEffect = "copy";
      return;
    }

    if (targetBtn === dragSourceBtn) {
      languageDropIntent = null;
      clearLanguageDropFeedback();
      return;
    }

    const otherButtons = getVisibleLanguageButtons().filter(
      (btn) => btn !== dragSourceBtn
    );
    const beforeBtn =
      otherButtons.find((btn) => {
        const rect = btn.getBoundingClientRect();
        return e.clientY < rect.top + rect.height / 2;
      }) || null;

    languageDropIntent = { type: "reorder", beforeBtn };
    clearLanguageDropFeedback();
    showLanguageDropIndicator(beforeBtn);
    e.dataTransfer.dropEffect = "move";
  }

  languageToggle.addEventListener("dragover", (e) => {
    if (!dragSourceBtn) return;
    e.preventDefault();
    updateLanguageDropIntent(e);
  });

  languageToggle.addEventListener("dragleave", (e) => {
    if (!languageToggle.contains(e.relatedTarget)) {
      languageDropIntent = null;
      clearLanguageDropFeedback();
    }
  });

  document.addEventListener(
    "dragover",
    (e) => {
      if (
        !dragSourceBtn ||
        isPointInsideLanguageToggle(e.clientX, e.clientY)
      ) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      languageDropIntent = { type: "remove" };
      clearLanguageDropFeedback();
      dragSourceBtn.classList.add("language-remove-target");
      e.dataTransfer.dropEffect = "move";
    },
    true
  );

  document.addEventListener(
    "drop",
    (e) => {
      if (
        !dragSourceBtn ||
        isPointInsideLanguageToggle(e.clientX, e.clientY)
      ) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      removeLanguageButton(dragSourceBtn);
      resetDragState();
    },
    true
  );

  languageToggle.addEventListener("drop", (e) => {
    if (!dragSourceBtn || !languageDropIntent) return;

    e.preventDefault();
    e.stopPropagation();

    if (languageDropIntent.type === "copy") {
      const targetBtn = languageDropIntent.targetBtn;
      const targetLang = targetBtn.dataset.target;
      const srcLang = e.dataTransfer.getData("text/plain") || draggingLang;

      if (srcLang && srcLang !== targetLang) {
        subtitleGenerator.duplicateSectionsToTarget(
          codeMap[srcLang],
          codeMap[targetLang]
        );
        markWorkspaceDirty();
      }
    } else {
      const addBtn = document.getElementById("addLanguageButton");
      languageToggle.insertBefore(
        dragSourceBtn,
        languageDropIntent.beforeBtn || addBtn
      );
      reorderSectionContainers();
      updateBookmarks();
      markWorkspaceDirty();
    }

    resetDragState();
  });

  // 사용자가 입력칸과 상호작용하는 즉시 검증 강조를 지웁니다.
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

  // 편집 섹션 순서를 화면에 보이는 언어 버튼 순서와 맞춥니다.
  function reorderSectionContainers() {
    const parent = document.getElementById("sectionContainers");

    document
      .querySelectorAll(".language-toggle .lang-btn")
      .forEach((btn) => {
        if (
          !btn.classList.contains("active") ||
          window.getComputedStyle(btn).display === "none"
        ) {
          return;
        }
        const section = document.getElementById(
          `${btn.dataset.target}Container`
        );
        if (section) parent.appendChild(section);
      });
  }

  updateAddLanguageButton();

  const scrollEl = document.querySelector(".lang-modal-scroll");

  // 위임 클릭 핸들러는 무한 스크롤용 복제 항목까지 함께 처리합니다.
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

  // 원형 스크롤처럼 보이도록 언어 선택지를 목록 앞뒤에 복제합니다.
  const items = Array.from(scrollEl.querySelectorAll(".lang-select-btn"));
  items.forEach((item) => scrollEl.appendChild(item.cloneNode(true)));
  items
    .slice()
    .reverse()
    .forEach((item) =>
      scrollEl.insertBefore(item.cloneNode(true), scrollEl.firstChild)
    );

  // 원형 스크롤러를 목록의 가운데 복제 구간에서 시작합니다.
  function resetScroll() {
    scrollEl.scrollTop = scrollEl.scrollHeight / 3;
  }
  resetScroll();

  // 복제된 세 구간 사이로 스크롤 위치를 이동해 반복이 끊기지 않게 합니다.
  scrollEl.addEventListener("scroll", () => {
    const third = scrollEl.scrollHeight / 3;
    if (scrollEl.scrollTop < 50) {
      scrollEl.scrollTop += third;
    } else if (scrollEl.scrollTop > third * 2 - 50) {
      scrollEl.scrollTop -= third;
    }
  });

  // 모달 위 휠 이벤트로 커스텀 스크롤 속도를 제어합니다.
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

  // 선택기를 닫은 뒤 언어 바를 정상 상태로 되돌립니다.
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

  // Pickr를 지연 로드하고 ready 언어 버튼에서 쓰는 작은 도우미를 노출합니다.
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
    // 단순한 헥스 색상 기반 텍스트 색상 흐름에 맞게 색상 선택기를 설정합니다.
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

      // ready 버튼은 선택된 강조 색상을 왼쪽 줄무늬로 보여줍니다.
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
        markWorkspaceDirty();
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

        pickr.setColor(
          pickrTargetBtn.dataset.pickrColor || "#FFFF00",
          true
        );
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

  // 스크롤 북마크는 각 표시 언어 섹션이 시작되는 위치를 보여줍니다.
  const bmContainer = document.getElementById("container");
  const scrollContainer = document.querySelector(".main-content");

  // 현재 스크롤 높이와 표시 섹션을 바탕으로 북마크 점을 다시 만듭니다.
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

  // 언어 표시 상태가 바뀔 때 북마크 영역도 함께 갱신되도록 합니다.
  subtitleGenerator.toggleLanguageSections = (function (orig) {
    return function () {
      orig.apply(this, arguments);
      updateBookmarks();
    };
  })(subtitleGenerator.toggleLanguageSections);

  // 현재 보이는 오디오 구간을 단순 진폭 파형으로 그립니다.
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

  // 미디어 재생 중 파형 이동과 DOM 재생 위치를 애니메이션으로 갱신합니다.
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

    const timelineW = timelineContainer.getBoundingClientRect().width;
    const internalW = waveformCanvas.width;

    const phW = playheadDiv.offsetWidth;
    const scaleFactor = (timelineW - phW) / internalW;

    let cssX = xPos * scaleFactor;

    cssX = Math.max(0, Math.min(timelineW - phW, cssX));
    setPlayheadPositions(cssX);


    playheadReqId = requestAnimationFrame(updatePlayhead);
  }

  // 정밀 탐색 중 아주 짧은 재생으로 브라우저가 비디오 프레임을 갱신하게 합니다.
  let singleFrameTimeout;

  // 파형을 클릭하면 즉시 이동하고 아주 짧은 프레임 구간을 미리 봅니다.
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

  // 파형 바깥으로 드래그하면 확대된 구간을 자동 스크롤합니다.
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

  // 파형의 x좌표를 샘플 위치와 미디어 currentTime으로 변환합니다.
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
    const visW = timelineContainer.clientWidth;
    const relX = (targetSample - panOffset) / segmentLength;

    let cssX = relX * (visW - phW);

    cssX = Math.max(0, Math.min(visW - phW, cssX));
    const newTime = (targetSample / totalSamples) * video.duration;
    setPlayheadPositions(cssX, newTime);

    video.currentTime = newTime;
    drawTimeline();
    updateTimeDisplay();
  }

  // 마우스 휠은 현재 재생 위치를 중심으로 파형을 확대/축소합니다.
  waveformCanvas.addEventListener("wheel", (e) => {
    if (!audioBuffer) return;
    e.preventDefault();

    const totalSamples = audioBuffer.length;
    const width = waveformContainer.clientWidth;

    const playheadStyleLeft =
      parseFloat(waveformPlayheadDiv.style.left) || 0;
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
    } else {
      syncPlayheadsToCurrentWaveformView();
    }
  });

  // 시간 입력칸끼리 드래그해서 정확한 타임스탬프를 빠르게 복사할 수 있습니다.
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
      const text = sanitizeTimeCharacters(
        e.dataTransfer.getData("text/plain")
      );
      e.target.value = text;

      if (e.target === timeDisplay) {
        // Dropped timecodes are completed immediately: triggering blur applies
        // the value to video.currentTime and leaves the field out of edit mode.
        timeDisplay.focus({ preventScroll: true });
        timeDisplay.blur();
      } else {
        e.target.focus();
        e.target.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }
  });
});
