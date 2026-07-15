const forms = document.querySelectorAll(".lead-form");
const revealItems = document.querySelectorAll(".reveal");

if (revealItems.length > 0) {
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14 });

    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }
}

forms.forEach((form) => {
  const submitButton = form.querySelector("button[type='submit']");
  const status = form.querySelector("[data-form-status]");
  const defaultButtonText = submitButton?.textContent || "Submit";

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const payload = {
      firstName: String(formData.get("first-name") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      company: String(formData.get("company") || "").trim(),
    };
    const interest = String(formData.get("interest") || "").trim();
    const endpoint = form.getAttribute("action") || "/api/lead";

    if (interest) {
      payload.interest = interest;
    }

    status.textContent = "Sending...";
    status.dataset.state = "loading";
    submitButton.disabled = true;
    submitButton.textContent = "Sending...";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Something went wrong. Please try again.");
      }

      form.reset();
      status.textContent = result.message || "Thank you. Please check your inbox.";
      status.dataset.state = "success";
      submitButton.textContent = "Sent";
    } catch (error) {
      status.textContent = error.message;
      status.dataset.state = "error";
      submitButton.disabled = false;
      submitButton.textContent = defaultButtonText;
    }
  });
});
