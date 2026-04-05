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

export function loadData(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}

export function saveData(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch(e) { console.error(e); }
}
