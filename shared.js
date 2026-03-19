(function () {
  const DEFAULT_SETTINGS = {
    language: "en",
    defaultMode: "cashback",
    rememberValues: true
  };

  const DEFAULT_STATE = {
    valueOne: "",
    valueTwo: ""
  };

  const PLACEHOLDER_RESULT = "--";

  const MESSAGES = {
    en: {
      extensionName: "Percentage Cashback Calculator",
      popupEyebrow: "Quick calculator",
      currentModeLabel: "Mode",
      cashbackMode: "Cashback",
      percentMode: "Percent",
      amountLabel: "Amount",
      percentLabel: "Percent",
      totalAmountLabel: "Total amount",
      partAmountLabel: "Part amount",
      cashbackResultLabel: "Cashback amount",
      percentResultLabel: "Percent result",
      placeholderResult: PLACEHOLDER_RESULT,
      openLargeView: "Open large view",
      openSettings: "Settings",
      openOptions: "Open settings",
      copyResult: "Copy result",
      resetValues: "Reset",
      switchMode: "Switch mode",
      copySuccess: "Result copied.",
      copyUnavailable: "Nothing to copy yet.",
      invalidNumberHint: "Enter valid numbers to see a result.",
      emptyStateHint: "Start typing to calculate instantly.",
      zeroTotalHint: "Total amount must be greater than 0.",
      largeSubtitle: "A more spacious view for longer work sessions.",
      settingsEyebrow: "Extension settings",
      settingsTitle: "Settings",
      settingsSubtitle: "Keep the calculator simple and ready for your daily workflow.",
      languageLabel: "Language",
      defaultModeLabel: "Default mode",
      rememberValuesLabel: "Remember last values",
      rememberValuesHelp: "Restore the last entered values when you reopen the calculator.",
      settingsSaved: "Settings saved.",
      languageEnglish: "English",
      languageUkrainian: "Ukrainian"
    },
    uk: {
      extensionName: "Калькулятор відсоткового кешбеку",
      popupEyebrow: "Швидкий калькулятор",
      currentModeLabel: "Режим",
      cashbackMode: "Кешбек",
      percentMode: "Відсоток",
      amountLabel: "Сума",
      percentLabel: "Відсоток",
      totalAmountLabel: "Загальна сума",
      partAmountLabel: "Частина суми",
      cashbackResultLabel: "Сума кешбеку",
      percentResultLabel: "Результат у відсотках",
      placeholderResult: PLACEHOLDER_RESULT,
      openLargeView: "Відкрити великий вигляд",
      openSettings: "Налаштування",
      openOptions: "Відкрити налаштування",
      copyResult: "Копіювати результат",
      resetValues: "Скинути",
      switchMode: "Змінити режим",
      copySuccess: "Результат скопійовано.",
      copyUnavailable: "Поки немає що копіювати.",
      invalidNumberHint: "Введіть коректні числа, щоб побачити результат.",
      emptyStateHint: "Почніть вводити дані для миттєвого розрахунку.",
      zeroTotalHint: "Загальна сума має бути більшою за 0.",
      largeSubtitle: "Більш просторий вигляд для довших робочих сесій.",
      settingsEyebrow: "Налаштування розширення",
      settingsTitle: "Налаштування",
      settingsSubtitle: "Збережіть калькулятор простим і зручним для щоденної роботи.",
      languageLabel: "Мова",
      defaultModeLabel: "Режим за замовчуванням",
      rememberValuesLabel: "Пам'ятати останні значення",
      rememberValuesHelp: "Відновлювати останні введені значення після повторного відкриття калькулятора.",
      settingsSaved: "Налаштування збережено.",
      languageEnglish: "Англійська",
      languageUkrainian: "Українська"
    }
  };

  function getMessage(language, key) {
    const locale = MESSAGES[language] ? language : DEFAULT_SETTINGS.language;
    return MESSAGES[locale][key] || MESSAGES.en[key] || key;
  }

  function applyTranslations(root, language) {
    root.querySelectorAll("[data-i18n]").forEach((node) => {
      node.textContent = getMessage(language, node.dataset.i18n);
    });
  }

  function normalizeDecimal(value) {
    if (typeof value !== "string") {
      return "";
    }

    const trimmed = value.trim().replace(/\s+/g, "").replace(",", ".");
    if (!trimmed) {
      return "";
    }

    const normalized = trimmed.replace(/[^0-9.-]/g, "");
    if (!/^-?\d*\.?\d*$/.test(normalized)) {
      return null;
    }

    return normalized;
  }

  function parseDecimal(value) {
    const normalized = normalizeDecimal(value);
    if (normalized === "" || normalized === null || normalized === "-" || normalized === "." || normalized === "-.") {
      return normalized === "" ? null : Number.NaN;
    }

    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : Number.NaN;
  }

  function formatNumber(value, suffix) {
    if (!Number.isFinite(value)) {
      return PLACEHOLDER_RESULT;
    }

    const formatted = new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 2
    }).format(value);

    return suffix ? formatted + suffix : formatted;
  }

  function calculate(mode, rawValueOne, rawValueTwo) {
    const valueOne = parseDecimal(rawValueOne);
    const valueTwo = parseDecimal(rawValueTwo);
    const hasAnyValue = String(rawValueOne).trim() !== "" || String(rawValueTwo).trim() !== "";

    if (!hasAnyValue) {
      return {
        result: PLACEHOLDER_RESULT,
        hintKey: "emptyStateHint",
        copyValue: ""
      };
    }

    if (!Number.isFinite(valueOne) || !Number.isFinite(valueTwo)) {
      return {
        result: PLACEHOLDER_RESULT,
        hintKey: "invalidNumberHint",
        copyValue: ""
      };
    }

    if (mode === "percent") {
      if (valueOne === 0) {
        return {
          result: PLACEHOLDER_RESULT,
          hintKey: "zeroTotalHint",
          copyValue: ""
        };
      }

      const percentValue = (valueTwo / valueOne) * 100;
      return {
        result: formatNumber(percentValue, "%"),
        hintKey: "",
        copyValue: formatNumber(percentValue, "%")
      };
    }

    const cashbackValue = (valueOne * valueTwo) / 100;
    return {
      result: formatNumber(cashbackValue, ""),
      hintKey: "",
      copyValue: formatNumber(cashbackValue, "")
    };
  }

  function storageGet(area, defaults) {
    return new Promise((resolve) => {
      chrome.storage[area].get(defaults, resolve);
    });
  }

  function storageSet(area, values) {
    return new Promise((resolve) => {
      chrome.storage[area].set(values, resolve);
    });
  }

  async function getSettings() {
    const stored = await storageGet("sync", DEFAULT_SETTINGS);
    return { ...DEFAULT_SETTINGS, ...stored };
  }

  async function saveSettings(nextSettings) {
    const merged = { ...DEFAULT_SETTINGS, ...nextSettings };
    await storageSet("sync", merged);
    return merged;
  }

  async function getRememberedValues() {
    const stored = await storageGet("local", DEFAULT_STATE);
    return { ...DEFAULT_STATE, ...stored };
  }

  async function saveRememberedValues(values) {
    await storageSet("local", {
      valueOne: values.valueOne || "",
      valueTwo: values.valueTwo || ""
    });
  }

  async function clearRememberedValues() {
    await saveRememberedValues(DEFAULT_STATE);
  }

  function setInputSelectionBehavior(inputs) {
    inputs.forEach((input) => {
      input.addEventListener("focus", () => {
        if (input.value) {
          input.select();
        }
      });
    });
  }

  function handleEnterToAdvance(inputs) {
    inputs.forEach((input, index) => {
      input.addEventListener("keydown", (event) => {
        if (event.key !== "Enter") {
          return;
        }

        event.preventDefault();
        const nextInput = inputs[index + 1];
        if (nextInput) {
          nextInput.focus();
        }
      });
    });
  }

  window.CashbackCalculator = {
    DEFAULT_SETTINGS,
    MESSAGES,
    getMessage,
    applyTranslations,
    calculate,
    getSettings,
    saveSettings,
    getRememberedValues,
    saveRememberedValues,
    clearRememberedValues,
    setInputSelectionBehavior,
    handleEnterToAdvance
  };
})();
