document.addEventListener("DOMContentLoaded", async () => {
  const app = window.CashbackCalculator;
  const valueOneInput = document.getElementById("value-one");
  const valueTwoInput = document.getElementById("value-two");
  const resultValue = document.getElementById("result-value");
  const resultLabel = document.getElementById("result-label");
  const hintText = document.getElementById("hint-text");
  const currentModeText = document.getElementById("current-mode-text");
  const labelOne = document.getElementById("label-one");
  const labelTwo = document.getElementById("label-two");
  const openLargeViewButton = document.getElementById("open-large-view");
  const openSettingsButton = document.getElementById("open-settings");
  const backToCalculatorButton = document.getElementById("back-to-calculator");
  const copyResultButton = document.getElementById("copy-result");
  const resetValuesButton = document.getElementById("reset-values");
  const calculatorView = document.getElementById("calculator-view");
  const settingsView = document.getElementById("settings-view");
  const languageSelect = document.getElementById("language-select");
  const defaultModeSelect = document.getElementById("default-mode-select");
  const rememberValuesInput = document.getElementById("remember-values");
  const saveStatus = document.getElementById("save-status");

  let settings = await app.getSettings();
  const remembered = settings.rememberValues ? await app.getRememberedValues() : { valueOne: "", valueTwo: "" };

  valueOneInput.value = remembered.valueOne;
  valueTwoInput.value = remembered.valueTwo;

  function updateStaticText() {
    document.documentElement.lang = settings.language;
    app.applyTranslations(document, settings.language);
    openLargeViewButton.textContent = app.getMessage(settings.language, "openLargeView");
    openSettingsButton.setAttribute("aria-label", app.getMessage(settings.language, "openSettings"));
    openSettingsButton.setAttribute("title", app.getMessage(settings.language, "openSettings"));
    backToCalculatorButton.textContent = app.getMessage(settings.language, "backToCalculator");
    copyResultButton.textContent = app.getMessage(settings.language, "copyResult");
    resetValuesButton.textContent = app.getMessage(settings.language, "resetValues");

    const isCashback = settings.defaultMode === "cashback";
    currentModeText.textContent = app.getMessage(settings.language, isCashback ? "cashbackMode" : "percentMode");
    labelOne.textContent = app.getMessage(settings.language, isCashback ? "amountLabel" : "totalAmountLabel");
    labelTwo.textContent = app.getMessage(settings.language, isCashback ? "percentLabel" : "partAmountLabel");
    resultLabel.textContent = app.getMessage(settings.language, isCashback ? "cashbackResultLabel" : "percentResultLabel");
    renderSettingsControls();
  }

  function renderSettingsControls() {
    defaultModeSelect.innerHTML = "";

    [
      { value: "cashback", label: app.getMessage(settings.language, "cashbackMode") },
      { value: "percent", label: app.getMessage(settings.language, "percentMode") }
    ].forEach((option) => {
      const optionElement = document.createElement("option");
      optionElement.value = option.value;
      optionElement.textContent = option.label;
      defaultModeSelect.appendChild(optionElement);
    });

    languageSelect.value = settings.language;
    defaultModeSelect.value = settings.defaultMode;
    rememberValuesInput.checked = Boolean(settings.rememberValues);
  }

  function setView(viewName) {
    const showSettings = viewName === "settings";
    calculatorView.classList.toggle("hidden", showSettings);
    settingsView.classList.toggle("hidden", !showSettings);
  }

  async function renderCalculation(hintOverrideKey) {
    const calculation = app.calculate(settings.defaultMode, valueOneInput.value, valueTwoInput.value);
    resultValue.textContent = calculation.result;
    const hintKey = hintOverrideKey || calculation.hintKey;
    hintText.textContent = hintKey ? app.getMessage(settings.language, hintKey) : "";

    if (settings.rememberValues) {
      await app.saveRememberedValues({
        valueOne: valueOneInput.value,
        valueTwo: valueTwoInput.value
      });
    }

    copyResultButton.dataset.copyValue = calculation.copyValue;
  }

  function clearHintSoon() {
    window.clearTimeout(clearHintSoon.timerId);
    clearHintSoon.timerId = window.setTimeout(() => {
      renderCalculation();
    }, 1200);
  }

  function clearSaveStatusSoon() {
    window.clearTimeout(clearSaveStatusSoon.timerId);
    clearSaveStatusSoon.timerId = window.setTimeout(() => {
      saveStatus.textContent = "";
    }, 1200);
  }

  async function refreshFromStorage() {
    settings = await app.getSettings();
    updateStaticText();
    await renderCalculation();
  }

  async function persistSettings() {
    settings = await app.saveSettings({
      language: languageSelect.value,
      defaultMode: defaultModeSelect.value,
      rememberValues: rememberValuesInput.checked
    });

    if (!settings.rememberValues) {
      await app.clearRememberedValues();
    }

    updateStaticText();
    await renderCalculation();
    saveStatus.textContent = app.getMessage(settings.language, "settingsSaved");
    clearSaveStatusSoon();
  }

  [valueOneInput, valueTwoInput].forEach((input) => {
    input.addEventListener("input", () => {
      renderCalculation();
    });
  });

  app.setInputSelectionBehavior([valueOneInput, valueTwoInput]);
  app.handleEnterToAdvance([valueOneInput, valueTwoInput]);

  resetValuesButton.addEventListener("click", async () => {
    valueOneInput.value = "";
    valueTwoInput.value = "";
    await app.clearRememberedValues();
    await renderCalculation();
    valueOneInput.focus();
  });

  copyResultButton.addEventListener("click", async () => {
    const copyValue = copyResultButton.dataset.copyValue || "";
    let hintKey = "copyUnavailable";

    if (copyValue && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(copyValue);
        hintKey = "copySuccess";
      } catch (error) {
        hintText.textContent = app.getMessage(settings.language, "copyUnavailable");
        clearHintSoon();
        return;
      }
    }

    hintText.textContent = app.getMessage(settings.language, hintKey);
    clearHintSoon();
  });

  openLargeViewButton.addEventListener("click", () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("large.html") });
  });

  openSettingsButton.addEventListener("click", () => {
    setView("settings");
  });

  backToCalculatorButton.addEventListener("click", () => {
    setView("calculator");
  });

  languageSelect.addEventListener("change", persistSettings);
  defaultModeSelect.addEventListener("change", persistSettings);
  rememberValuesInput.addEventListener("change", persistSettings);

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "sync" && (changes.language || changes.defaultMode || changes.rememberValues)) {
      refreshFromStorage();
    }
  });

  updateStaticText();
  await renderCalculation();
  setView("calculator");
});
