const KEY = "pour-log-v1";
const TABS = [["log","Log a pour"],["calendar","Calendar"],["pantry","Pantry"],["recipes","Recipe book"],["gear","Equipment"]];
let db = { beans: [], recipes: [], gear: [], pours: [] };
try { db = Object.assign(db, JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (e) {}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {} };
const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const GEAR = { grinder: "Grinder", dripper: "Dripper", filter: "Filter paper", kettle: "Kettle" };

// Tabs
const tabs = $("#tabs");
TABS.forEach(([id, label], i) => {
  const b = document.createElement("button");
  b.textContent = label; b.setAttribute("role", "tab"); b.dataset.id = id;
  b.onclick = () => show(id);
  tabs.append(b);
});
function show(id) {
  TABS.forEach(([t]) => $("#" + t).hidden = t !== id);
  tabs.querySelectorAll("button").forEach(b => b.setAttribute("aria-selected", b.dataset.id === id));
  try { history.replaceState(null, "", "#" + id); } catch (e) { /* sandboxed preview: skip URL update */ }
}

// Dropdowns
function opts(items, label, fn) {
  return `<option value="">${label}</option>` + items.map(x => `<option value="${x.id}">${esc(fn(x))}</option>`).join("");
}
function fillSelects() {
  const f = $("#pourForm");
  const keep = n => f[n].value;
  const prev = ["bean", "recipe", ...Object.keys(GEAR)].map(keep);
  f.bean.innerHTML = opts(db.beans, db.beans.length ? "Choose beans" : "Add beans in Pantry first", b => b.name + (b.roaster ? " – " + b.roaster : ""));
  f.recipe.innerHTML = opts(db.recipes, db.recipes.length ? "Choose a recipe" : "No recipes yet", r => r.name);
  Object.entries(GEAR).forEach(([k, type]) => {
    const items = db.gear.filter(g => g.type === type);
    f[k].innerHTML = opts(items, items.length ? "Choose" : "None added", g => g.name);
  });
  ["bean", "recipe", ...Object.keys(GEAR)].forEach((n, i) => { f[n].value = prev[i]; });
  recipeHint();
}
function recipeHint() {
  const r = db.recipes.find(x => x.id === $("#pourForm").recipe.value), h = $("#recipeHint");
  h.hidden = !r;
  if (r) h.textContent = recipeLine(r) + (r.method ? " — " + r.method : "");
}
$("#pourForm").recipe.onchange = recipeHint;
const recipeLine = r => `${r.dose} g coffee, ${r.water} g water (1:${(r.water / r.dose).toFixed(1)})` + (r.temp ? `, ${r.temp}°C` : "") + (r.time ? `, ${r.time}` : "");

// Rendering
const row = (title, meta, kind, id, extra = "") =>
  `<li><div><div class="t">${title}</div><div class="m">${meta}</div></div><div>${extra}<button class="x" data-del="${kind}:${id}" aria-label="Delete">Delete</button></div></li>`;
function pourRow(p) {
  const gear = Object.keys(GEAR).map(k => p[k]).filter(Boolean).join(", ");
  const meta = [p.date, p.recipe, gear, p.grind && "grind " + p.grind].filter(Boolean).map(esc).join(" · ") + (p.notes ? `<br>${esc(p.notes)}` : "");
  return row(esc(p.bean || "Unknown beans"), meta, "pours", p.id, p.rating ? `<span class="rate">${p.rating}/5</span>` : "");
}
function render() {
  $("#beansList").innerHTML = db.beans.map(b => row(esc(b.name), esc([b.roaster, b.origin, b.roasted && "roasted " + b.roasted].filter(Boolean).join(", ")), "beans", b.id)).join("") || `<li class="empty">Nothing here yet. Add the beans you have on hand.</li>`;
  $("#recipesList").innerHTML = db.recipes.map(r => row(esc(r.name), esc(recipeLine(r)) + (r.method ? "<br>" + esc(r.method) : ""), "recipes", r.id)).join("") || `<li class="empty">No recipes yet. Add your first one above.</li>`;
  $("#gearList").innerHTML = db.gear.map(g => row(esc(g.name), esc(g.type), "gear", g.id)).join("") || `<li class="empty">No equipment yet. Add your grinder, dripper and filters.</li>`;
  $("#pours").innerHTML = [...db.pours].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)).map(pourRow).join("") || `<li class="empty">No pours logged yet. Save your first one above.</li>`;
  fillSelects();
  renderCal();
}

// Calendar (several pours can share one day)
let calMonth = new Date(); calMonth.setDate(1);
let calSel = new Date().toLocaleDateString("en-CA");
function renderCal() {
  const y = calMonth.getFullYear(), m = calMonth.getMonth();
  const iso = d => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const counts = {};
  db.pours.forEach(p => counts[p.date] = (counts[p.date] || 0) + 1);
  const total = Object.entries(counts).filter(([d]) => d.startsWith(iso(1).slice(0, 7))).reduce((a, [, n]) => a + n, 0);
  $("#calTitle").textContent = calMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  $("#calSummary").textContent = total ? `${total} ${total === 1 ? "pour" : "pours"} this month.` : "No pours this month yet.";
  let h = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => `<div class="dow">${d}</div>`).join("");
  for (let i = 0; i < new Date(y, m, 1).getDay(); i++) h += "<div></div>";
  const now = new Date().toLocaleDateString("en-CA");
  for (let d = 1; d <= new Date(y, m + 1, 0).getDate(); d++) {
    const k = iso(d), n = counts[k] || 0;
    h += `<button type="button" class="day${k === now ? " today" : ""}" data-day="${k}" aria-pressed="${k === calSel}" aria-label="${k}, ${n} ${n === 1 ? "pour" : "pours"}"><span>${d}</span>${n ? `<b>${n}</b>` : ""}</button>`;
  }
  $("#calGrid").innerHTML = h;
  $("#calDayTitle").textContent = new Date(calSel + "T00:00").toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  $("#calDayList").innerHTML = db.pours.filter(p => p.date === calSel).sort((a, b) => a.id.localeCompare(b.id)).map(pourRow).join("") || `<li class="empty">No pours on this day.</li>`;
}
document.addEventListener("click", e => {
  const t = e.target.closest("[data-day],[data-cal],[data-logday]"); if (!t) return;
  if (t.dataset.day) { calSel = t.dataset.day; }
  else if (t.dataset.cal === "prev") calMonth.setMonth(calMonth.getMonth() - 1);
  else if (t.dataset.cal === "next") calMonth.setMonth(calMonth.getMonth() + 1);
  else if (t.dataset.cal === "today") { calMonth = new Date(); calMonth.setDate(1); calSel = new Date().toLocaleDateString("en-CA"); }
  else if (t.hasAttribute("data-logday")) { pf.date.value = calSel; show("log"); return; }
  renderCal();
});

// Add forms (pantry, recipes, gear)
document.querySelectorAll("form[data-kind]").forEach(f => f.onsubmit = e => {
  e.preventDefault();
  db[f.dataset.kind].push({ id: uid(), ...Object.fromEntries(new FormData(f)) });
  save(); f.reset(); render();
});

// Log a pour (stores names too, so history survives deleting a pantry item)
const pf = $("#pourForm");
const today = () => new Date().toLocaleDateString("en-CA");
pf.date.value = today();
pf.onsubmit = e => {
  e.preventDefault();
  const name = (list, id) => (db[list].find(x => x.id === id) || {}).name || "";
  const p = { id: uid(), date: pf.date.value, bean: name("beans", pf.bean.value), recipe: name("recipes", pf.recipe.value), grind: pf.grind.value, rating: pf.rating.value, notes: pf.notes.value };
  Object.keys(GEAR).forEach(k => p[k] = name("gear", pf[k].value));
  db.pours.push(p); save();
  pf.grind.value = ""; pf.notes.value = ""; pf.rating.value = "";
  render();
};

// Delete
document.addEventListener("click", e => {
  const d = e.target.dataset.del; if (!d) return;
  const [kind, id] = d.split(":");
  db[kind] = db[kind].filter(x => x.id !== id); save(); render();
});

// Backup
$("#export").onclick = () => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([JSON.stringify(db, null, 2)], { type: "application/json" }));
  a.download = "pour-log-" + today() + ".json"; a.click();
};
$("#importBtn").onclick = () => $("#importFile").click();
$("#importFile").onchange = async e => {
  try { db = Object.assign({ beans: [], recipes: [], gear: [], pours: [] }, JSON.parse(await e.target.files[0].text())); save(); render(); }
  catch (err) { alert("That file isn't a valid pour log backup."); }
};

render();
show(TABS.some(([t]) => "#" + t === location.hash) ? location.hash.slice(1) : "log");
