const ADMIN_CODE = "1001";
const SESSION_KEY = "majlis-admin-session";
const REPORTS_KEY = "majlis-admin-reports";
const BANS_KEY = "majlis-admin-bans";

const seedReports = [
  { id: "report-1", reporterName: "سارة", targetUid: "user-24", targetName: "مستخدم 24", reason: "إرسال رسائل مزعجة ومتكررة داخل الغرفة العامة.", status: "open", time: new Date(Date.now() - 12 * 60 * 1000).toISOString() },
  { id: "report-2", reporterName: "علي", targetUid: "user-noor", targetName: "نور", reason: "استخدام كلمات غير مناسبة في الدردشة.", status: "open", time: new Date(Date.now() - 48 * 60 * 1000).toISOString() },
  { id: "report-3", reporterName: "حسين", targetUid: "guest-17", targetName: "ضيف 17", reason: "انتحال اسم مستخدم آخر.", status: "resolved", time: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() }
];

const seedBans = [
  { uid: "banned-1", displayName: "حساب مزعج", reason: "تكرار الإساءة بعد التنبيه.", time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() }
];

let reports = readData(REPORTS_KEY, seedReports);
let bans = readData(BANS_KEY, seedBans);
let activeView = "reports";
let searchValue = "";

const loginScreen = document.querySelector("#loginScreen");
const adminScreen = document.querySelector("#adminScreen");
const loginForm = document.querySelector("#loginForm");
const adminCode = document.querySelector("#adminCode");
const loginError = document.querySelector("#loginError");
const contentList = document.querySelector("#contentList");
const searchInput = document.querySelector("#searchInput");
const toast = document.querySelector("#toast");

function readData(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : structuredClone(fallback);
  } catch {
    return structuredClone(fallback);
  }
}

function saveData() {
  localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
  localStorage.setItem(BANS_KEY, JSON.stringify(bans));
}

function showAdmin() {
  loginScreen.hidden = true;
  adminScreen.hidden = false;
  render();
}

function showLogin() {
  adminScreen.hidden = true;
  loginScreen.hidden = false;
  adminCode.value = "";
  adminCode.focus();
}

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (adminCode.value !== ADMIN_CODE) {
    loginError.hidden = false;
    adminCode.select();
    return;
  }
  sessionStorage.setItem(SESSION_KEY, "1");
  loginError.hidden = true;
  showAdmin();
});

adminCode.addEventListener("input", () => {
  adminCode.value = adminCode.value.replace(/\D/g, "");
  loginError.hidden = true;
});

document.querySelector("#logoutButton").addEventListener("click", () => {
  sessionStorage.removeItem(SESSION_KEY);
  showLogin();
});

document.querySelectorAll(".nav-button").forEach((button) => {
  button.addEventListener("click", () => {
    activeView = button.dataset.view;
    document.querySelectorAll(".nav-button").forEach((item) => item.classList.toggle("active", item === button));
    render();
  });
});

searchInput.addEventListener("input", () => {
  searchValue = searchInput.value.trim().toLowerCase();
  renderList();
});

document.querySelector("#resetButton").addEventListener("click", () => {
  reports = structuredClone(seedReports);
  bans = structuredClone(seedBans);
  saveData();
  render();
  showToast("تمت إعادة البيانات التجريبية.");
});

contentList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const { action, id } = button.dataset;

  if (action === "resolve") {
    const report = reports.find((item) => item.id === id);
    if (report) report.status = "resolved";
    showToast("تم إغلاق البلاغ.");
  }

  if (action === "ban") {
    const report = reports.find((item) => item.id === id);
    if (report) {
      report.status = "resolved";
      if (!bans.some((item) => item.uid === report.targetUid)) {
        bans.unshift({ uid: report.targetUid, displayName: report.targetName, reason: report.reason, time: new Date().toISOString() });
      }
      showToast("تم حظر الحساب وإغلاق البلاغ.");
    }
  }

  if (action === "unban") {
    bans = bans.filter((item) => item.uid !== id);
    showToast("تم إلغاء الحظر.");
  }

  saveData();
  render();
});

function render() {
  const openReports = reports.filter((item) => item.status === "open");
  document.querySelector("#reportsBadge").textContent = openReports.length;
  document.querySelector("#bansBadge").textContent = bans.length;
  document.querySelector("#openReportsCount").textContent = openReports.length;
  document.querySelector("#bansCount").textContent = bans.length;
  document.querySelector("#resolvedCount").textContent = reports.filter((item) => item.status !== "open").length;
  document.querySelector("#pageTitle").textContent = activeView === "reports" ? "بلاغات المستخدمين" : "الحسابات المحظورة";
  document.querySelector("#pageDescription").textContent = activeView === "reports" ? "راجع البلاغ واتخذ القرار المناسب" : "إدارة الحظر وإعادة الحسابات";
  renderList();
}

function renderList() {
  if (activeView === "reports") {
    const visible = reports.filter((item) => `${item.targetName} ${item.reporterName} ${item.reason}`.toLowerCase().includes(searchValue));
    contentList.innerHTML = visible.length ? visible.map(reportCard).join("") : emptyState("لا توجد بلاغات", "كل شيء هادئ حاليًا.");
    return;
  }

  const visible = bans.filter((item) => `${item.displayName} ${item.reason}`.toLowerCase().includes(searchValue));
  contentList.innerHTML = visible.length ? visible.map(banCard).join("") : emptyState("لا توجد حسابات محظورة", "قائمة الحظر فارغة.");
}

function reportCard(report) {
  const resolved = report.status !== "open";
  return `
    <article class="moderation-card ${resolved ? "resolved" : ""}">
      <div class="avatar">${escapeHtml(report.targetName.charAt(0) || "م")}</div>
      <div class="card-copy">
        <div><h2>${escapeHtml(report.targetName)}</h2><span class="status-label ${resolved ? "done" : ""}">${resolved ? "تمت المعالجة" : "بانتظار القرار"}</span></div>
        <p>${escapeHtml(report.reason)}</p>
        <small>المُبلّغ: ${escapeHtml(report.reporterName)} • ${formatTime(report.time)}</small>
      </div>
      ${resolved ? '<span class="done-badge">✓ منجز</span>' : `<div class="card-actions"><button class="ban-button" data-action="ban" data-id="${report.id}">حظر الحساب</button><button class="resolve-button" data-action="resolve" data-id="${report.id}">إغلاق البلاغ</button></div>`}
    </article>`;
}

function banCard(ban) {
  return `
    <article class="moderation-card">
      <div class="avatar banned">${escapeHtml(ban.displayName.charAt(0) || "م")}</div>
      <div class="card-copy">
        <div><h2>${escapeHtml(ban.displayName)}</h2><span class="status-label banned">محظور</span></div>
        <p>${escapeHtml(ban.reason)}</p>
        <small>${formatTime(ban.time)}</small>
      </div>
      <button class="single-action" data-action="unban" data-id="${ban.uid}">إلغاء الحظر</button>
    </article>`;
}

function emptyState(title, text) {
  return `<div class="empty-state"><span>✓</span><h2>${title}</h2><p>${text}</p></div>`;
}

function formatTime(value) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("ar-IQ", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
}

let toastTimer;
function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}

if (sessionStorage.getItem(SESSION_KEY) === "1") showAdmin();
else showLogin();
