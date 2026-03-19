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
  const openOptionsButton = document.getElementById("open-options");
  const copyResultButton = document.getElementById("copy-result");
  const switchModeButton = document.getElementById("switch-mode");
  const resetValuesButton = document.getElementById("reset-values");

  let settings = await app.getSettings();
  const remembered = settings.rememberValues ? await app.getRememberedValues() : { valueOne: "", valueTwo: "" };

  valueOneInput.value = remembered.valueOne;
  valueTwoInput.value = remembered.valueTwo;

  function updateStaticText() {
    document.documentElement.lang = settings.language;
    app.applyTranslations(document, settings.language);
    openOptionsButton.textContent = app.getMessage(settings.language, "openOptions");
    copyResultButton.textContent = app.getMessage(settings.language, "copyResult");
    switchModeButton.textContent = app.getMessage(settings.language, "switchMode");
    resetValuesButton.textContent = app.getMessage(settings.language, "resetValues");

    const isCashback = settings.defaultMode === "cashback";
    currentModeText.textContent = app.getMessage(settings.language, isCashback ? "cashbackMode" : "percentMode");
    labelOne.textContent = app.getMessage(settings.language, isCashback ? "amountLabel" : "totalAmountLabel");
    labelTwo.textContent = app.getMessage(settings.language, isCashback ? "percentLabel" : "partAmountLabel");
    resultLabel.textContent = app.getMessage(settings.language, isCashback ? "cashbackResultLabel" : "percentResultLabel");
  }

  async function renderCalculation(hintOverrideKey) {
    const calculation = app.calculate(settings.defaultMode, valueOneInput.value, valueTwoInput.value);
    resultValue.textContent = calculation.result;
    hintText.textContent = hintOverrideKey ? app.getMessage(settings.language, hintOverrideKey) : (calculation.hintKey ? app.getMessage(settings.language, calculation.hintKey) : "");
    copyResultButton.dataset.copyValue = calculation.copyValue;

    if (settings.rememberValues) {
      await app.saveRememberedValues({
        valueOne: valueOneInput.value,
        valueTwo: valueTwoInput.value
      });
    }
  }

  function clearHintSoon() {
    window.clearTimeout(clearHintSoon.timerId);
    clearHintSoon.timerId = window.setTimeout(() => {
      renderCalculation();
    }, 1200);
  }

  [valueOneInput, valueTwoInput].forEach((input) => {
    input.addEventListener("input", () => {
      renderCalculation();
    });
  });

  app.setInputSelectionBehavior([valueOneInput, valueTwoInput]);
  app.handleEnterToAdvance([valueOneInput, valueTwoInput]);

  openOptionsButton.addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });

  copyResultButton.addEventListener("click", async () => {
    const copyValue = copyResultButton.dataset.copyValue || "";

    if (copyValue && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(copyValue);
        hintText.textContent = app.getMessage(settings.language, "copySuccess");
      } catch (error) {
        hintText.textContent = app.getMessage(settings.language, "copyUnavailable");
      }
    } else {
      hintText.textContent = app.getMessage(settings.language, "copyUnavailable");
    }

    clearHintSoon();
  });

  switchModeButton.addEventListener("click", async () => {
    settings.defaultMode = settings.defaultMode === "cashback" ? "percent" : "cashback";
    await app.saveSettings({ defaultMode: settings.defaultMode });
    updateStaticText();
    await renderCalculation();
  });

  resetValuesButton.addEventListener("click", async () => {
    valueOneInput.value = "";
    valueTwoInput.value = "";
    await app.clearRememberedValues();
    await renderCalculation();
    valueOneInput.focus();
  });

  chrome.storage.onChanged.addListener(async (changes, areaName) => {
    if (areaName === "sync" && (changes.language || changes.defaultMode || changes.rememberValues)) {
      settings = await app.getSettings();
      updateStaticText();
      await renderCalculation();
    }
  });

  updateStaticText();
  await renderCalculation();
});
