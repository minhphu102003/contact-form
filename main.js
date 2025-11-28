import { PC_PHONE_COUNTRIES } from "./phoneCountries.js";

const INTERNATIONAL_FLAG_SRC =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCA0OCAzMic+PHJlY3Qgd2lkdGg9JzQ4JyBoZWlnaHQ9JzMyJyBmaWxsPScjZjJmMmYyJy8+PGNpcmNsZSBjeD0nMjQnIGN5PScxNicgcj0nMTAnIGZpbGw9JyMwMjliZTUnLz48cGF0aCBkPSdNMjQgNnYyME0xNCAxNmgyME0xNyA5YTEyIDEyIDAgMCAwIDAgMTRNMzEgOWExMiAxMiAwIDAgMSAwIDE0JyBzdHJva2U9JyNmZmZmZmYnIHN0cm9rZS13aWR0aD0nMicgZmlsbD0nbm9uZScvPjwvc3ZnPg==";
const CAPTCHA_SITE_KEY = "6LeqfRosAAAAABUuIsJrK0Fgl482k5GY4SICTqjL";

const COUNTRY_OPTIONS = [
  { value: "", label: "Select country" },
  { value: "SG", label: "Singapore" },
  { value: "VN", label: "Vietnam" },
  { value: "US", label: "United States" },
  { value: "GB", label: "United Kingdom" },
  { value: "AU", label: "Australia" },
];

// Simple, clean validation logic for the Contact form

(function () {
  const form = document.getElementById("contactForm");
  const submitBtn = document.getElementById("contactSubmit");
  let captchaWidgetId = null;
  if (!form) return;

  let hasSubmitted = false;
  const resetPhoneSelect = initPhoneCountrySelect(form);
  initCountrySelectUI(form);

  form.addEventListener(
    "input",
    (event) => {
      handleFieldInteraction(event.target);
    },
    true
  );

  form.addEventListener(
    "change",
    (event) => {
      handleFieldInteraction(event.target);
    },
    true
  );

  const FIELD_SELECTORS = {
    firstName: "#firstName",
    lastName: "#lastName",
    email: "#email",
    phoneCountry: "#phoneCountry",
    phoneNumber: "#phoneNumber",
    country: "#country",
    message: "#message",
    consent: "#consent",
    captcha: 'textarea[name="g-recaptcha-response"]',
  };

  function getFieldElement(name) {
    const selector = FIELD_SELECTORS[name];
    return selector ? document.querySelector(selector) : null;
  }

  function setFieldError(fieldName, message) {
    const fieldWrapper = form.querySelector(
      `.contact-form__field[data-field="${fieldName}"]`
    );
    if (!fieldWrapper) return;

    if (message) {
      const errorEl = getOrCreateErrorElement(fieldWrapper);
      fieldWrapper.classList.add("contact-form__field--invalid");
      errorEl.textContent = message;
      errorEl.classList.add("contact-form__error--visible");
    } else {
      const errorEl = fieldWrapper.querySelector(".contact-form__error");
      fieldWrapper.classList.remove("contact-form__field--invalid");
      if (errorEl) {
        errorEl.textContent = "";
        errorEl.classList.remove("contact-form__error--visible");
        errorEl.remove();
      }
    }
  }

  function getOrCreateErrorElement(fieldWrapper) {
    let errorEl = fieldWrapper.querySelector(".contact-form__error");
    if (errorEl) return errorEl;

    errorEl = document.createElement("p");
    errorEl.className = "contact-form__error";
    errorEl.setAttribute("aria-live", "polite");
    fieldWrapper.appendChild(errorEl);
    return errorEl;
  }

  function validateRequiredText(fieldName, label) {
    const el = getFieldElement(fieldName);
    if (!el) return true;

    const value = el.value.trim();
    if (!value) {
      setFieldError(fieldName, `${label} is required.`);
      return false;
    }

    setFieldError(fieldName, "");
    return true;
  }

  function validateEmail() {
    const el = getFieldElement("email");
    if (!el) return true;

    const value = el.value.trim();
    if (!value) {
      setFieldError("email", "Email is required.");
      return false;
    }

    // Simple email validation pattern
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(value)) {
      setFieldError("email", "Please enter a valid email address.");
      return false;
    }

    setFieldError("email", "");
    return true;
  }

  // Phone: optional, but if user types something, do a light validation
  function validatePhone() {
    const numberEl = getFieldElement("phoneNumber");
    if (!numberEl) return true;

    const value = numberEl.value.trim();
    if (!value) {
      // optional: no error if empty
      setFieldError("phone", "");
      return true;
    }

    const basicPhonePattern = /^[0-9+\-\s]{5,}$/;
    if (!basicPhonePattern.test(value)) {
      setFieldError(
        "phone",
        "Please enter a valid phone number or leave it blank."
      );
      return false;
    }

    setFieldError("phone", "");
    return true;
  }

  function validateCountry() {
    const el = getFieldElement("country");
    if (!el) return true;

    if (!el.value) {
      setFieldError("country", "Please select your country.");
      return false;
    }

    setFieldError("country", "");
    return true;
  }

  function validateConsent() {
    const el = getFieldElement("consent");
    if (!el) return true;

    if (!el.checked) {
      setFieldError(
        "consent",
        "Please check the box to confirm consent to data processing."
      );
      return false;
    }

    setFieldError("consent", "");
    return true;
  }

  function validateForm() {
    const results = [
      validateRequiredText("firstName", "First name"),
      validateRequiredText("lastName", "Last name"),
      validateEmail(),
      validatePhone(),
      validateCountry(),
      validateRequiredText("message", "Message"),
      validateConsent(),
      validateCaptcha(),
    ];

    return results.every(Boolean);
  }

  // Live validation on blur / change
  form.addEventListener("blur", (event) => {
    if (!hasSubmitted) return;

    const target = event.target;

    if (!(target instanceof HTMLElement)) return;
    const name = target.name;

    switch (name) {
      case "firstName":
        validateRequiredText("firstName", "First name");
        break;
      case "lastName":
        validateRequiredText("lastName", "Last name");
        break;
      case "email":
        validateEmail();
        break;
      case "phoneNumber":
        validatePhone();
        break;
      case "country":
        validateCountry();
        break;
      case "message":
        validateRequiredText("message", "Message");
        break;
      case "consent":
        validateConsent();
        break;
      default:
        break;
    }
  }, true);

  // Submit handler
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    hasSubmitted = true;
    setSubmitDisabled(true);

    const valid = validateForm();
    if (!valid) {
      setSubmitDisabled(false);
      return;
    }

    try {
      await submitFormData(new FormData(form));
      form.reset();
      if (
        window.grecaptcha &&
        typeof window.grecaptcha.reset === "function" &&
        captchaWidgetId !== null
      ) {
        window.grecaptcha.reset(captchaWidgetId);
      }
      resetPhoneSelect?.();
      hasSubmitted = false;
      // Clear field errors after reset
      Object.keys(FIELD_SELECTORS).forEach((key) => setFieldError(key, ""));
    } catch (error) {
      console.error("Form submission failed", error);
    } finally {
      setSubmitDisabled(false);
    }
  });

  function initPhoneCountrySelect(formEl) {
    const wrapper = document.querySelector("[data-phone-input]");
    if (!wrapper) return null;

    const hiddenInput = wrapper.querySelector("#phoneCountry");
    const triggerBtn = wrapper.querySelector(".PhoneInputCountryTrigger");
    const flagImg = triggerBtn?.querySelector(".PhoneInputCountryIconImg");
    const dropdown = wrapper.querySelector(".PhoneInputDropdown");

    if (!hiddenInput || !triggerBtn || !flagImg || !dropdown) {
      return null;
    }

    let isOpen = false;
    const defaultValue = hiddenInput.value || "SG";

    dropdown.innerHTML = "";
    PC_PHONE_COUNTRIES.forEach((country) => {
      const optionBtn = document.createElement("button");
      optionBtn.type = "button";
      optionBtn.className = "PhoneInputDropdownOption";
      optionBtn.dataset.value = country.code;
      optionBtn.textContent = country.name;
      optionBtn.setAttribute("role", "option");
      optionBtn.tabIndex = -1;
      optionBtn.addEventListener("click", () => {
        selectCountry(country.code);
        closeDropdown();
        triggerBtn.focus();
      });
      optionBtn.addEventListener("keydown", (event) =>
        handleOptionKeydown(event, optionBtn)
      );
      dropdown.appendChild(optionBtn);
    });

    function openDropdown() {
      if (isOpen) return;
      isOpen = true;
      wrapper.classList.add("PhoneInput--open");
      dropdown.hidden = false;
      triggerBtn.setAttribute("aria-expanded", "true");
      focusOptionByValue(hiddenInput.value);
    }

    function closeDropdown() {
      if (!isOpen) return;
      isOpen = false;
      wrapper.classList.remove("PhoneInput--open");
      dropdown.hidden = true;
      triggerBtn.setAttribute("aria-expanded", "false");
    }

    function selectCountry(code) {
      const normalized = (code || "ZZ").toUpperCase();
      hiddenInput.value = normalized;
      updateFlag(normalized);
      updateSelectedOption();
    }

    function updateSelectedOption() {
      dropdown.querySelectorAll(".PhoneInputDropdownOption").forEach((btn) => {
        const isSelected = btn.dataset.value === hiddenInput.value;
        btn.classList.toggle("PhoneInputDropdownOption--selected", isSelected);
        btn.setAttribute("aria-selected", String(isSelected));
      });
    }

    function updateFlag(code) {
      const normalizedCode =
        typeof code === "string" ? code.toUpperCase() : "";
      const country =
        PC_PHONE_COUNTRIES.find(
          (item) => item.code.toUpperCase() === normalizedCode
        ) || PC_PHONE_COUNTRIES[0];
      const normalized = country.code.toUpperCase();

      if (normalized === "ZZ") {
        flagImg.src = INTERNATIONAL_FLAG_SRC;
        flagImg.alt = country.name;
        return;
      }

      flagImg.src = `https://purecatamphetamine.github.io/country-flag-icons/3x2/${normalized}.svg`;
      flagImg.alt = country.name;
    }

    function focusOptionByValue(value) {
      const buttons = Array.from(
        dropdown.querySelectorAll(".PhoneInputDropdownOption")
      );
      if (!buttons.length) return;
      const index = buttons.findIndex(
        (btn) => btn.dataset.value === (value || "ZZ").toUpperCase()
      );
      const targetIndex = index >= 0 ? index : 0;
      buttons[targetIndex].focus();
    }

    function focusOptionByOffset(currentBtn, offset) {
      const buttons = Array.from(
        dropdown.querySelectorAll(".PhoneInputDropdownOption")
      );
      if (!buttons.length) return;

      const currentIndex = buttons.indexOf(currentBtn);
      const nextIndex = Math.min(
        Math.max(currentIndex + offset, 0),
        buttons.length - 1
      );
      buttons[nextIndex]?.focus();
    }

    function handleOptionKeydown(event, optionBtn) {
      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          focusOptionByOffset(optionBtn, 1);
          break;
        case "ArrowUp":
          event.preventDefault();
          focusOptionByOffset(optionBtn, -1);
          break;
        case "Home":
          event.preventDefault();
          focusOptionByValue(PC_PHONE_COUNTRIES[0]?.code || "ZZ");
          break;
        case "End":
          event.preventDefault();
          focusOptionByValue(
            PC_PHONE_COUNTRIES[PC_PHONE_COUNTRIES.length - 1]?.code || "ZZ"
          );
          break;
        case "Enter":
        case " ":
          event.preventDefault();
          selectCountry(optionBtn.dataset.value || "");
          closeDropdown();
          triggerBtn.focus();
          break;
        case "Escape":
          closeDropdown();
          triggerBtn.focus();
          break;
        default:
          break;
      }
    }

    triggerBtn.addEventListener("click", () => {
      if (isOpen) {
        closeDropdown();
      } else {
        openDropdown();
      }
    });

    triggerBtn.addEventListener("keydown", (event) => {
      if (
        event.key === "ArrowDown" ||
        event.key === "Enter" ||
        event.key === " "
      ) {
        event.preventDefault();
        if (!isOpen) {
          openDropdown();
        }
        focusOptionByValue(hiddenInput.value);
      } else if (event.key === "Escape" && isOpen) {
        closeDropdown();
      }
    });

    document.addEventListener("click", (event) => {
      if (!wrapper.contains(event.target)) {
        closeDropdown();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeDropdown();
      }
    });

    formEl.addEventListener("reset", () => {
      window.requestAnimationFrame(() => {
        selectCountry(defaultValue);
        closeDropdown();
      });
    });

    selectCountry(hiddenInput.value || defaultValue);

    return () => {
      selectCountry(defaultValue);
      closeDropdown();
    };
  }

  function initCountrySelectUI(formEl) {
    const wrapper = document.querySelector("[data-country-select]");
    if (!wrapper) return;

    const hiddenInput = document.getElementById("country");
    const displayBtn = wrapper.querySelector(".select-input__display");
    const valueEl = wrapper.querySelector(".select-input__value");
    const dropdown = wrapper.querySelector(".select-input__dropdown");
    const clearBtn = wrapper.querySelector(".select-input__clear");

    if (
      !hiddenInput ||
      !displayBtn ||
      !valueEl ||
      !dropdown ||
      !clearBtn ||
      !formEl
    ) {
      return;
    }

    let isOpen = false;

    COUNTRY_OPTIONS.forEach((option) => {
      if (!option.value) return;
      const optionBtn = document.createElement("button");
      optionBtn.type = "button";
      optionBtn.className = "select-input__option";
      optionBtn.tabIndex = -1;
      optionBtn.textContent = option.label;
      optionBtn.dataset.value = option.value;
      optionBtn.setAttribute("role", "option");
      optionBtn.addEventListener("click", () => {
        selectValue(option.value);
        closeDropdown();
        displayBtn.focus();
      });
      optionBtn.addEventListener("keydown", (event) =>
        handleOptionKeydown(event, optionBtn)
      );
      dropdown.appendChild(optionBtn);
    });

    function openDropdown() {
      if (isOpen) return;
      isOpen = true;
      wrapper.classList.add("select-input--open");
      dropdown.hidden = false;
      displayBtn.setAttribute("aria-expanded", "true");
    }

    function closeDropdown() {
      if (!isOpen) return;
      isOpen = false;
      wrapper.classList.remove("select-input--open");
      dropdown.hidden = true;
      displayBtn.setAttribute("aria-expanded", "false");
    }

    function selectValue(value) {
      hiddenInput.value = value;
      syncState();
      if (hasSubmitted) {
        validateCountry();
      }
    }

    function syncState() {
      const match =
        COUNTRY_OPTIONS.find((option) => option.value === hiddenInput.value) ||
        COUNTRY_OPTIONS[0];
      valueEl.textContent = match?.label ?? "";

      if (hiddenInput.value) {
        wrapper.classList.add("select-input--has-value");
      } else {
        wrapper.classList.remove("select-input--has-value");
      }

      dropdown
        .querySelectorAll(".select-input__option")
        .forEach((btn) => {
          const isSelected = btn.dataset.value === hiddenInput.value;
          btn.classList.toggle("select-input__option--selected", isSelected);
          btn.setAttribute("aria-selected", String(isSelected));
        });
    }

    function focusOptionByValue(value) {
      const buttons = Array.from(
        dropdown.querySelectorAll(".select-input__option")
      );
      const index = buttons.findIndex((btn) => btn.dataset.value === value);
      if (index >= 0) {
        buttons[index].focus();
      } else if (buttons.length) {
        buttons[0].focus();
      }
    }

    function focusOptionByOffset(currentBtn, offset) {
      const buttons = Array.from(
        dropdown.querySelectorAll(".select-input__option")
      );

      if (!buttons.length) return;

      const currentIndex = buttons.indexOf(currentBtn);
      const nextIndex = Math.min(
        Math.max(currentIndex + offset, 0),
        buttons.length - 1
      );
      buttons[nextIndex]?.focus();
    }

    function handleOptionKeydown(event, optionBtn) {
      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          focusOptionByOffset(optionBtn, 1);
          break;
        case "ArrowUp":
          event.preventDefault();
          focusOptionByOffset(optionBtn, -1);
          break;
        case "Enter":
        case " ":
          event.preventDefault();
          selectValue(optionBtn.dataset.value || "");
          closeDropdown();
          displayBtn.focus();
          break;
        case "Escape":
          closeDropdown();
          displayBtn.focus();
          break;
        default:
          break;
      }
    }

    displayBtn.addEventListener("click", () => {
      if (isOpen) {
        closeDropdown();
      } else {
        openDropdown();
        focusOptionByValue(hiddenInput.value);
      }
    });

    displayBtn.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        if (!isOpen) {
          openDropdown();
        }
        focusOptionByValue(hiddenInput.value);
      } else if (event.key === "Escape") {
        closeDropdown();
      }
    });

    clearBtn.addEventListener("click", () => {
      selectValue("");
      closeDropdown();
      displayBtn.focus();
    });

    document.addEventListener("click", (event) => {
      if (!wrapper.contains(event.target)) {
        closeDropdown();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeDropdown();
      }
    });

    formEl.addEventListener("reset", () => {
      window.requestAnimationFrame(() => {
        selectValue("");
        closeDropdown();
      });
    });

    syncState();
  }

  function handleFieldInteraction(target) {
    if (!hasSubmitted) return;
    if (!(target instanceof HTMLElement)) return;
    const name = target.name;
    if (!name) return;
    switch (name) {
      case "firstName":
        setFieldError("firstName", "");
        break;
      case "lastName":
        setFieldError("lastName", "");
        break;
      case "email":
        setFieldError("email", "");
        break;
      case "phoneNumber":
        setFieldError("phone", "");
        break;
      case "country":
        setFieldError("country", "");
        break;
      case "message":
        setFieldError("message", "");
        break;
      case "consent":
        setFieldError("consent", "");
        break;
      default:
        break;
    }
  }

  function setSubmitDisabled(state) {
    if (!submitBtn) return;
    submitBtn.disabled = state;
  }

  function validateCaptcha() {
    const response =
      window.grecaptcha && typeof window.grecaptcha.getResponse === "function"
        ? window.grecaptcha.getResponse(captchaWidgetId ?? undefined)
        : "";

    if (response) {
      setFieldError("captcha", "");
      return true;
    }

    setFieldError("captcha", "Please complete the captcha.");
    return false;
  }

  window.contactFormRecaptchaLoad = () => {
    if (!window.grecaptcha || captchaWidgetId !== null) return;
    captchaWidgetId = window.grecaptcha.render("contactCaptcha", {
      sitekey: CAPTCHA_SITE_KEY,
      callback: contactFormCaptchaSuccess,
      "expired-callback": contactFormCaptchaExpired,
    });
  };

  window.contactFormCaptchaSuccess = () => {
    setFieldError("captcha", "");
  };

  window.contactFormCaptchaExpired = () => {
    if (hasSubmitted) {
      setFieldError("captcha", "Please complete the captcha.");
    }
  };

  async function submitFormData(formData) {
    // Replace with actual API endpoint
    await fetch("/api/contact", {
      method: "POST",
      body: formData,
    });
  }
})();

