document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".publication-abstract-toggle").forEach((button) => {
    const label = button.querySelector(".publication-abstract-label");
    const panelId = button.getAttribute("aria-controls");
    const panel = panelId ? document.getElementById(panelId) : null;
    if (!label || !panel) return;

    const setExpanded = (expanded) => {
      button.setAttribute("aria-expanded", String(expanded));
      panel.hidden = !expanded;
      label.textContent = expanded ? "Hide abstract" : "Show abstract";
    };

    button.addEventListener("click", () => {
      setExpanded(button.getAttribute("aria-expanded") !== "true");
    });
  });

  document.querySelectorAll(".publication-citation-button").forEach((button) => {
    button.addEventListener("click", async () => {
      const encodedCitation = button.dataset.citation;
      const label = button.querySelector("span");
      if (!encodedCitation || !label) return;

      const originalLabel = label.textContent;

      try {
        await navigator.clipboard.writeText(decodeURIComponent(encodedCitation).trim());
        label.textContent = "Copied";
        button.classList.add("is-copied");
        window.setTimeout(() => {
          label.textContent = originalLabel;
          button.classList.remove("is-copied");
        }, 1600);
      } catch (_) {
        label.textContent = "Copy failed";
        window.setTimeout(() => {
          label.textContent = originalLabel;
        }, 1800);
      }
    });
  });
});
