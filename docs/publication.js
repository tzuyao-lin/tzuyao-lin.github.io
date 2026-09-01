document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".publication-abstract").forEach((details) => {
    const label = details.querySelector(".publication-abstract-label");
    if (!label) return;

    const updateLabel = () => {
      label.textContent = details.open ? "Hide abstract" : "Show abstract";
    };

    details.addEventListener("toggle", updateLabel);
    updateLabel();
  });

  document.querySelectorAll(".publication-citation-button").forEach((button) => {
    button.addEventListener("click", async () => {
      const encodedCitation = button.dataset.citation;
      const label = button.querySelector("span");
      if (!encodedCitation || !label) return;

      const originalLabel = button.dataset.citationFormat === "bibtex" ? "BibTeX" : "APA";

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
