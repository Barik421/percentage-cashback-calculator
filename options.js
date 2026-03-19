document.addEventListener("DOMContentLoaded", async () => {
  const app = window.CashbackCalculator;
  const languageSelect = document.getElementById("language-select");
  const defaultModeSelect = document.getElementById("default-mode-select");
  const rememberValuesInput = document.getElementById("remember-values");
  const saveStatus = document.getElementById("save-status");

  let settings = await app.getSettings();

  function populateModeOptions(language) {
    defaultModeSelect.innerHTML = "";

    const options = [
      { value: "cashback", label: app.getMessage(language, "cashbackMode") },
      { value: "percent", label: app.getMessage(language, "percentMode") }
    ];

    options.forEach((option) => {
      const optionElement = document.createElement("option");
      optionElement.value = option.value;
      optionElement.textContent = option.label;
      defaultModeSelect.appendChild(optionElement);
    });
  }

  function render() {
    document.documentElement.lang = settings.language;
    app.applyTranslations(document, settings.language);
    populateModeOptions(settings.language);
    languageSelect.value = settings.language;
    defaultModeSelect.value = settings.defaultMode;
    rememberValuesInput.checked = Boolean(settings.rememberValues);
  }

  function flashSaved() {
    saveStatus.textContent = app.getMessage(settings.language, "settingsSaved");
    window.clearTimeout(flashSaved.timerId);
    flashSaved.timerId = window.setTimeout(() => {
      saveStatus.textContent = "";
    }, 1200);
  }

  async function persist() {
    settings = await app.saveSettings({
      language: languageSelect.value,
      defaultMode: defaultModeSelect.value,
      rememberValues: rememberValuesInput.checked
    });

    if (!settings.rememberValues) {
      await app.clearRememberedValues();
    }

    render();
    flashSaved();
  }

  languageSelect.addEventListener("change", persist);
  defaultModeSelect.addEventListener("change", persist);
  rememberValuesInput.addEventListener("change", persist);

  render();
});
