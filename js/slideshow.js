// ---- Configuration ----
// Change this to whatever passcode you want gatekeeping edits.
// Remember: this is visible to anyone who views the page source,
// so treat it as a "keep honest people honest" lock, not real security.
const EDIT_CODE = "DameTrixieBouffant";

const STORAGE_KEY = "gallery-images";

// ---- State ----
let images = loadImages();
let currentIndex = 0;
let isEditing = false;

// ---- Elements ----
const slideImage   = document.getElementById("slideImage");
const emptyState   = document.getElementById("emptyState");
const currentIndexEl = document.getElementById("currentIndex");
const totalCountEl = document.getElementById("totalCount");
const dotsEl       = document.getElementById("dots");
const prevBtn      = document.getElementById("prevBtn");
const nextBtn      = document.getElementById("nextBtn");
const deleteBtn    = document.getElementById("deleteBtn");
const editBtn      = document.getElementById("editBtn");
const uploadPanel  = document.getElementById("uploadPanel");
const fileInput    = document.getElementById("fileInput");
const lockBtn      = document.getElementById("lockBtn");

const modalOverlay   = document.getElementById("modalOverlay");
const codeInput      = document.getElementById("codeInput");
const codeError      = document.getElementById("codeError");
const submitCodeBtn  = document.getElementById("submitCodeBtn");
const cancelBtn      = document.getElementById("cancelBtn");

// ---- Persistence helpers ----
function loadImages() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Could not read saved images:", e);
    return [];
  }
}

function saveImages() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(images));
  } catch (e) {
    // Most likely quota exceeded from too many/large images
    alert("Couldn't save — you may have too many images stored for this browser.");
    console.error(e);
  }
}

// ---- Rendering ----
function render() {
  const hasImages = images.length > 0;

  slideImage.hidden = !hasImages;
  emptyState.hidden = hasImages;
  deleteBtn.hidden = !hasImages || !isEditing;

  if (hasImages) {
    if (currentIndex >= images.length) currentIndex = images.length - 1;
    if (currentIndex < 0) currentIndex = 0;
    slideImage.src = images[currentIndex];
  } else {
    slideImage.src = "";
  }

  currentIndexEl.textContent = hasImages ? currentIndex + 1 : 0;
  totalCountEl.textContent = images.length;

  prevBtn.disabled = images.length <= 1;
  nextBtn.disabled = images.length <= 1;

  renderDots();
}

function renderDots() {
  dotsEl.innerHTML = "";
  images.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.className = "dot" + (i === currentIndex ? " active" : "");
    dot.setAttribute("aria-label", `Go to image ${i + 1}`);
    dot.addEventListener("click", () => {
      currentIndex = i;
      render();
    });
    dotsEl.appendChild(dot);
  });
}

// ---- Navigation ----
prevBtn.addEventListener("click", () => {
  currentIndex = (currentIndex - 1 + images.length) % images.length;
  render();
});

nextBtn.addEventListener("click", () => {
  currentIndex = (currentIndex + 1) % images.length;
  render();
});

document.addEventListener("keydown", (e) => {
  if (modalOverlay.hidden === false) return; // don't navigate while modal open
  if (e.key === "ArrowLeft") prevBtn.click();
  if (e.key === "ArrowRight") nextBtn.click();
});

// ---- Edit mode: unlocking ----
editBtn.addEventListener("click", openModal);

function openModal() {
  codeInput.value = "";
  codeError.hidden = true;
  modalOverlay.hidden = false;
  codeInput.focus();
}

function closeModal() {
  modalOverlay.hidden = true;
}

cancelBtn.addEventListener("click", closeModal);

modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) closeModal();
});

submitCodeBtn.addEventListener("click", checkCode);
codeInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") checkCode();
});

function checkCode() {
  if (codeInput.value === EDIT_CODE) {
    isEditing = true;
    closeModal();
    editBtn.hidden = true;
    uploadPanel.hidden = false;
    render();
  } else {
    codeError.hidden = false;
    codeInput.value = "";
    codeInput.focus();
  }
}

lockBtn.addEventListener("click", () => {
  isEditing = false;
  editBtn.hidden = false;
  uploadPanel.hidden = true;
  render();
});

// ---- Uploading images ----
fileInput.addEventListener("change", (e) => {
  const files = Array.from(e.target.files || []);
  if (!files.length) return;

  let remaining = files.length;

  files.forEach((file) => {
    const reader = new FileReader();
    reader.onload = () => {
      images.push(reader.result); // base64 data URL
      remaining--;
      if (remaining === 0) {
        currentIndex = images.length - 1; // jump to the newest upload
        saveImages();
        render();
      }
    };
    reader.onerror = () => {
      console.error("Failed to read file:", file.name);
      remaining--;
    };
    reader.readAsDataURL(file);
  });

  fileInput.value = ""; // allow re-selecting the same file later
});

// ---- Removing images ----
deleteBtn.addEventListener("click", () => {
  if (!images.length) return;
  const ok = confirm("Remove this image from the gallery?");
  if (!ok) return;

  images.splice(currentIndex, 1);
  saveImages();
  render();
});

// ---- Init ----
render();
