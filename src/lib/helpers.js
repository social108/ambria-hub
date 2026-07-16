import { MONTHS_SHORT } from './constants.js';

export function getMonthIndex(dateStr) { return new Date(dateStr).getMonth(); }

export function formatDate(dateStr) {
  const d = new Date(dateStr);
  return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}`;
}

export function daysUntil(dateStr) {
  const now = new Date(); now.setHours(0,0,0,0);
  const target = new Date(dateStr); target.setHours(0,0,0,0);
  return Math.ceil((target - now) / 86400000);
}

export function getAdStartDate(dateStr, leadDays) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - leadDays);
  return d.toISOString().split("T")[0];
}

export function getCreativeDeadline(dateStr, leadDays) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - leadDays - 10);
  return d.toISOString().split("T")[0];
}

export function getStoryReminder(dateStr) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - 7);
  return d.toISOString().split("T")[0];
}

export function uid() { return Date.now().toString(36) + Math.random().toString(36).substr(2, 6); }

const HIDE_STATUSES = {
  story_reminder: ["posted", "completed", "done", "skipped"],
  creative_deadline: ["creative_wip", "ready", "posted", "ad_live", "completed", "done", "skipped"],
  ad_start: ["ad_live", "completed", "done", "skipped"],
  event_day: ["completed", "done", "skipped"],
};

export function shouldHideReminder(reminderType, event, workflowData) {
  const pages = event.pages || [];
  if (pages.length === 0) return false;
  const hideList = HIDE_STATUSES[reminderType];
  if (!hideList) return false;
  const eventKey = `${event.date}-${event.name}`;
  const evtWf = workflowData?.[eventKey] || {};
  return pages.every(pid => hideList.includes(evtWf[pid]?.status));
}

export function isEventFullyDone(event, workflowData) {
  return shouldHideReminder("event_day", event, workflowData);
}

// Per-page workflow progress for an approved ad request. Looks up rows under
// event_key = `ad-${reqId}` and bins them by status.
export function getAdWorkflowSummary(adRequestId, workflowData) {
  const eventKey = `ad-${adRequestId}`;
  const pageStatuses = workflowData?.[eventKey] || {};
  const counts = { pending: 0, creative_wip: 0, ready: 0, posted: 0, ad_live: 0, completed: 0, skipped: 0 };
  let total = 0;
  Object.values(pageStatuses).forEach(({ status }) => {
    if (status && counts[status] !== undefined) counts[status]++;
    else counts.pending++;
    total++;
  });
  const done = counts.posted + counts.ad_live + counts.completed + counts.skipped;
  const inProgress = counts.creative_wip + counts.ready;
  return { counts, total, done, inProgress };
}

// Returns a list of missing required field labels for the event add/edit form.
// Category/Priority/Ad Lead Days must be explicitly chosen — an empty string
// means the user never touched the field.
export function validateEventForm(form) {
  const missing = [];
  if (!form.name?.trim()) missing.push("Event Name");
  if (!form.date) missing.push("Date");
  if (!form.cat) missing.push("Category");
  if (form.priority === "" || form.priority === null || form.priority === undefined) missing.push("Priority");
  if (form.adLeadDays === "" || form.adLeadDays === null || form.adLeadDays === undefined) missing.push("Ad Lead Days");
  if (!form.actions?.length) missing.push("Actions");
  if (!form.pages?.length) missing.push("Post on Pages");
  return missing;
}

export function loadData(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}

export function saveData(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch(e) { console.error(e); }
}
