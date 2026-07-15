const leadForm = document.querySelector(".lead-form");
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

if (leadForm) {
  const submitButton = leadForm.querySelector("button[type='submit']");
  const status = leadForm.querySelector("[data-form-status]");

  leadForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(leadForm);
    const payload = {
      firstName: String(formData.get("first-name") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      company: String(formData.get("company") || "").trim(),
    };

    status.textContent = "Sending...";
    status.dataset.state = "loading";
    submitButton.disabled = true;
    submitButton.textContent = "Sending...";

    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Something went wrong. Please try again.");
      }

      leadForm.reset();
      status.textContent = result.message || "Thank you. Please check your inbox.";
      status.dataset.state = "success";
      submitButton.textContent = "Sent";
    } catch (error) {
      status.textContent = error.message;
      status.dataset.state = "error";
      submitButton.disabled = false;
      submitButton.textContent = "Submit";
    }
  });
}
