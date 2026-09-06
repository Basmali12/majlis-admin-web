export const CONVEX_URL =
  import.meta.env.VITE_CONVEX_URL || "https://neighborly-badger-796.convex.cloud";

const status = document.querySelector("#backend-status");
if (status) {
  status.dataset.configured = String(Boolean(CONVEX_URL));
}
