export const PAGES = [
  { id: "ambria_in", name: "Ambria.in", handle: "@ambria.in", url: "https://www.instagram.com/ambria.in/", color: "#C9A84C", desc: "Master page · Bridal inspiration · Collabs", noAds: true },
  { id: "restro", name: "Ambria Restro", handle: "@ambriarestro", url: "https://www.instagram.com/ambriarestro/", color: "#E57373", desc: "Restaurant · Funny content · Dishes · Glasshouse Banquet · Farm" },
  { id: "cuisine", name: "Ambria Cuisine", handle: "@ambriacuisines", url: "https://www.instagram.com/ambriacuisines/", color: "#FFB74D", desc: "Catering · Food collabs with Restro" },
  { id: "decor", name: "Ambria Design & Decor", handle: "@ambria.designanddecor", url: "https://www.instagram.com/ambria.designanddecor/", color: "#F48FB1", desc: "Decor BTS · Premium themes" },
  { id: "manaktala", name: "Ambria Manaktala", handle: "@ambriamanaktala", url: "https://www.instagram.com/ambriamanaktala/", color: "#81C784", desc: "Venue · Decor · Catering · Entertainment" },
  { id: "pushpanjali", name: "Ambria Pushpanjali", handle: "@ambriapushpanjali", url: "https://www.instagram.com/ambriapushpanjali/", color: "#64B5F6", desc: "Venue · Decor · Catering · Entertainment" },
  { id: "exotica", name: "Ambria Exotica", handle: "@ambriaexotica", url: "https://www.instagram.com/ambriaexotica/", color: "#BA68C8", desc: "Venue · Decor · Catering · Entertainment" },
  { id: "events", name: "Ambria Events", handle: "@ambriaevents", url: "https://www.instagram.com/ambriaevents/", color: "#4DD0E1", desc: "Entertainment · Band Baaja · DJ · Singers · Jaimala" },
];

export const MONTHS_FULL = ["January","February","March","April","May","June","July","August","September","October","November","December"];
export const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export const ACTION_TYPES = {
  story: { label: "Story Post", icon: "◎", color: "#43A047", bg: "#E8F5E9" },
  ad: { label: "Run Ads", icon: "▲", color: "#E65100", bg: "#FFF3E0" },
  host: { label: "Host Event", icon: "★", color: "#AD1457", bg: "#FCE4EC" },
  restaurant: { label: "Restaurant Special", icon: "◆", color: "#4527A0", bg: "#EDE7F6" },
  reel: { label: "Reel / Video", icon: "▶", color: "#00695C", bg: "#E0F7FA" },
};

export const WORKFLOW_STATUS = {
  pending: { label: "Pending", color: "#78909C", bg: "rgba(120,144,156,0.12)" },
  creative_wip: { label: "Creative WIP", color: "#FFB300", bg: "rgba(255,179,0,0.12)" },
  ready: { label: "Ready", color: "#66BB6A", bg: "rgba(102,187,106,0.12)" },
  posted: { label: "Posted", color: "#43A047", bg: "rgba(67,160,71,0.15)" },
  ad_live: { label: "Ad Live", color: "#E65100", bg: "rgba(230,81,0,0.12)" },
  completed: { label: "Completed", color: "#7E57C2", bg: "rgba(126,87,194,0.12)" },
  skipped: { label: "Skipped", color: "#EF5350", bg: "rgba(239,83,80,0.12)" },
};

export const AD_REQUEST_STATUS = {
  requested: { label: "Requested", color: "#FFB300", bg: "rgba(255,179,0,0.12)" },
  creative_wip: { label: "Creative WIP", color: "#42A5F5", bg: "rgba(66,165,245,0.12)" },
  approved: { label: "Approved", color: "#66BB6A", bg: "rgba(102,187,106,0.12)" },
  live: { label: "Ad Live", color: "#E65100", bg: "rgba(230,81,0,0.12)" },
  completed: { label: "Completed", color: "#7E57C2", bg: "rgba(126,87,194,0.12)" },
  rejected: { label: "Rejected", color: "#EF5350", bg: "rgba(239,83,80,0.12)" },
};

export const KANBAN_COLUMNS = [
  { id: "pending", label: "Pending", icon: "○", color: "#78909C", accent: "rgba(120,144,156,0.25)" },
  { id: "creative_wip", label: "Creative WIP", icon: "✎", color: "#FFB300", accent: "rgba(255,179,0,0.25)" },
  { id: "ready", label: "Ready to Post", icon: "✓", color: "#66BB6A", accent: "rgba(102,187,106,0.25)" },
  { id: "posted", label: "Posted", icon: "◎", color: "#43A047", accent: "rgba(67,160,71,0.25)" },
  { id: "ad_live", label: "Ad Live", icon: "▲", color: "#E65100", accent: "rgba(230,81,0,0.25)" },
  { id: "completed", label: "Done", icon: "★", color: "#7E57C2", accent: "rgba(126,87,194,0.25)" },
  { id: "skipped", label: "Skipped", icon: "✕", color: "#EF5350", accent: "rgba(239,83,80,0.25)" },
];

export const REMINDER_TYPES = {
  creative_deadline: { label: "Creative Deadline", icon: "✎", color: "#F48FB1", desc: "Creative team must have ad ready by this date" },
  ad_start: { label: "Start Running Ads", icon: "▲", color: "#FFB300", desc: "Ads should go live on this date" },
  story_reminder: { label: "Story Reminder", icon: "◎", color: "#43A047", desc: "Prepare and post story content" },
  event_day: { label: "Event Day", icon: "★", color: "#E65100", desc: "The event/festival itself" },
};

export const CAT_OPTIONS = ["Hindu Festival","Muslim Festival","Sikh Festival","Christian","National","International","Seasonal","Business","Food & Lifestyle","Custom"];

export const EMPTY_FORM = { name: "", date: "", cat: "Seasonal", actions: [], pages: [], priority: 2, adLeadDays: 15, note: "" };

export const STORAGE_KEYS = {
  workflow: "ambria-cal-workflow-v2",
  adRequests: "ambria-cal-ads-v2",
  customEvents: "ambria-cal-events-v2",
  builtinEdits: "ambria-cal-builtin-edits-v1",
  hiddenBuiltins: "ambria-cal-hidden-builtins-v1",
};
