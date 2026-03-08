// survey.js
// Handles multi-step survey navigation

document.addEventListener("DOMContentLoaded", function () {
  const steps = Array.from(document.querySelectorAll(".survey-step"));
  const form = document.getElementById("survey-form");
  const nextBtns = document.querySelectorAll(".next-btn");
  const backBtns = document.querySelectorAll(".back-btn");
  let currentStep = 0;
  const answers = {};

  function showStep(idx) {
    steps.forEach((step, i) => {
      step.style.display = i === idx ? "block" : "none";
    });
    currentStep = idx;
    // Restore answers for this step
    restoreStepInputs(idx);
  }

  function saveStepInputs(idx) {
    const inputs = steps[idx].querySelectorAll("input, select, textarea");
    inputs.forEach((input) => {
      if (input.type === "radio") {
        if (input.checked) answers[input.name] = input.value;
      } else if (input.type === "checkbox") {
        if (!answers[input.name]) answers[input.name] = [];
        if (input.checked) answers[input.name].push(input.value);
      } else if (input.type === "select-multiple") {
        answers[input.name] = Array.from(input.selectedOptions).map(
          (opt) => opt.value,
        );
      } else {
        answers[input.name] = input.value;
      }
    });
  }

  function restoreStepInputs(idx) {
    const inputs = steps[idx].querySelectorAll("input, select, textarea");
    inputs.forEach((input) => {
      if (input.type === "radio") {
        input.checked = answers[input.name] === input.value;
      } else if (input.type === "checkbox") {
        input.checked = (answers[input.name] || []).includes(input.value);
      } else if (input.type === "select-multiple") {
        Array.from(input.options).forEach((opt) => {
          opt.selected = (answers[input.name] || []).includes(opt.value);
        });
      } else {
        input.value = answers[input.name] || "";
      }
    });
  }

  // Helper function to check if all required fields in the current step are filled
  function validateStep(idx) {
    const step = steps[idx];
    let valid = true;
    // Remove previous warning
    let warn = step.querySelector(".step-warning");
    if (warn) warn.remove();

    // Check required inputs/selects
    const requireds = step.querySelectorAll("[required]");
    requireds.forEach((input) => {
      if (input.type === "radio") {
        // At least one radio in the group must be checked
        const group = step.querySelectorAll(
          `input[type=radio][name='${input.name}']`,
        );
        if (![...group].some((r) => r.checked)) valid = false;
      } else if (input.type === "checkbox") {
        // At least one checkbox in the group must be checked
        const group = step.querySelectorAll(
          `input[type=checkbox][name='${input.name}']`,
        );
        if (![...group].some((c) => c.checked)) valid = false;
      } else if (input.tagName === "SELECT") {
        if (!input.value) valid = false;
      } else {
        if (!input.value) valid = false;
      }
    });
    if (!valid) {
      const msg = document.createElement("div");
      msg.className = "step-warning";
      msg.textContent =
        "Please answer all required questions before continuing.";
      step.appendChild(msg);
    }
    return valid;
  }

  nextBtns.forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      saveStepInputs(currentStep);
      if (!validateStep(currentStep)) return;
      if (currentStep < steps.length - 1) {
        showStep(currentStep + 1);
      }
    });
  });

  backBtns.forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      saveStepInputs(currentStep);
      if (currentStep > 0) {
        showStep(currentStep - 1);
      }
    });
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    saveStepInputs(currentStep);

    // Validate the final step before submitting
    if (!validateStep(currentStep)) return;

    // Create URLSearchParams from answers object
    const params = new URLSearchParams();
    Object.entries(answers).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((val) => {
          params.append(key, val);
        });
      } else {
        params.append(key, value);
      }
    });

    console.log("Submitting survey responses...");

    // Submit the form using fetch with URLSearchParams
    fetch("/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    })
      .then((response) => {
        if (response.ok) {
          window.location.href = "/results";
        } else if ([301, 302, 303, 307, 308].includes(response.status)) {
          window.location.href = response.headers.get("Location") || "/results";
        } else {
          throw new Error(`Server responded with ${response.status}`);
        }
      })
      .catch((error) => {
        console.error("Submission error:", error);
        alert("Error submitting form. Please try again.");
      });
  });

  // Start at step 0
  showStep(0);
});
