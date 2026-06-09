(function () {
  "use strict";

  const CONFIG = {
    loja: "Dárcio Veículos",
    slogan: "Compra · Venda · Troca · Financiamento",
    whatsappPrincipal: "5575988698486",
    whatsappSecundario: "5575991235618",
    telefonePrincipal: "75 98869-8486",
    telefoneSecundario: "75 99123-5618",
    endereco: "Bahia",
    adminUser: "admin",
    adminPassword: "1234"
  };

  const KEYS = {
    vehicles: "darcio.veiculos.v2",
    movements: "darcio.movimentacoes.v2",
    theme: "darcio.tema.v2",
    session: "darcio.admin.session.v2"
  };

  const STATUSES = {
    "Disponível": { className: "disponivel", public: true },
    "Reservado": { className: "reservado", public: true },
    "Vendido": { className: "vendido", public: false },
    "Manutenção": { className: "manutencao", public: false }
  };

  const demoVehicles = [
    {
      id: createId(), brand: "Toyota", model: "Corolla", version: "XEi 2.0", year: 2021,
      purchasePrice: 124000, price: 139900, mileage: 41000, color: "Branco", plate: "DAR1C21",
      status: "Disponível", fuel: "Flex", transmission: "CVT", bodyType: "Sedan", image: "",
      isPublic: true, entryDate: offsetDate(8),
      features: ["Bancos em couro", "Chave presencial", "Câmera de ré", "Controle de estabilidade"],
      description: "Sedan confortável, econômico e completo. Veículo revisado, com laudo cautelar aprovado e excelente aceitação para financiamento.",
      createdAt: offsetDateTime(8), updatedAt: offsetDateTime(2)
    },
    {
      id: createId(), brand: "Honda", model: "Civic", version: "Touring 1.5 Turbo", year: 2020,
      purchasePrice: 133000, price: 149900, mileage: 52000, color: "Prata", plate: "CIV5T20",
      status: "Disponível", fuel: "Gasolina", transmission: "CVT", bodyType: "Sedan", image: "",
      isPublic: true, entryDate: offsetDate(6),
      features: ["Teto solar", "Piloto automático", "Multimídia", "Sensor de estacionamento"],
      description: "Civic Touring com pacote premium, ótimo desempenho e acabamento superior. Ideal para quem busca conforto e presença.",
      createdAt: offsetDateTime(6), updatedAt: offsetDateTime(1)
    },
    {
      id: createId(), brand: "Jeep", model: "Compass", version: "Longitude", year: 2023,
      purchasePrice: 155000, price: 172900, mileage: 18500, color: "Cinza", plate: "JEP3L23",
      status: "Reservado", fuel: "Flex", transmission: "Automático", bodyType: "SUV", image: "",
      isPublic: true, entryDate: offsetDate(4),
      features: ["Painel digital", "Ar digital", "Rodas de liga leve", "Assistente de faixa"],
      description: "SUV moderno, espaçoso e tecnológico. Unidade reservada, mas ainda visível para negociação mediante consulta.",
      createdAt: offsetDateTime(4), updatedAt: offsetDateTime(1)
    },
    {
      id: createId(), brand: "Chevrolet", model: "Onix", version: "Premier", year: 2024,
      purchasePrice: 86500, price: 98900, mileage: 9000, color: "Azul", plate: "ONX4P24",
      status: "Disponível", fuel: "Flex", transmission: "Automático", bodyType: "Hatch", image: "",
      isPublic: true, entryDate: offsetDate(2),
      features: ["Wi-Fi nativo", "MyLink", "Alerta de ponto cego", "6 airbags"],
      description: "Hatch premium com baixa quilometragem, tecnológico e muito econômico. Excelente opção para uso urbano.",
      createdAt: offsetDateTime(2), updatedAt: offsetDateTime(1)
    },
    {
      id: createId(), brand: "Fiat", model: "Toro", version: "Volcano 4x4", year: 2022,
      purchasePrice: 139000, price: 154900, mileage: 37000, color: "Vermelho", plate: "TOR4V22",
      status: "Manutenção", fuel: "Diesel", transmission: "Automático", bodyType: "Picape", image: "",
      isPublic: false, entryDate: offsetDate(1),
      features: ["Tração 4x4", "Capota marítima", "Central multimídia", "Controle de descida"],
      description: "Picape robusta em revisão preventiva antes de retornar para a vitrine pública.",
      createdAt: offsetDateTime(1), updatedAt: offsetDateTime(1)
    },
    {
      id: createId(), brand: "Volkswagen", model: "T-Cross", version: "Highline 250 TSI", year: 2023,
      purchasePrice: 144000, price: 159900, mileage: 22000, color: "Preto", plate: "TCR2H23",
      status: "Vendido", fuel: "Flex", transmission: "Automático", bodyType: "SUV", image: "",
      isPublic: false, entryDate: offsetDate(12),
      features: ["Motor turbo", "Painel digital", "ACC", "Park Assist"],
      description: "Veículo vendido. Registro mantido para relatórios e histórico administrativo.",
      createdAt: offsetDateTime(12), updatedAt: offsetDateTime(3)
    }
  ];

  function bootStorage() {
    if (!localStorage.getItem(KEYS.vehicles)) {
      saveVehicles(demoVehicles);
    }
    if (!localStorage.getItem(KEYS.movements)) {
      const initialMovements = demoVehicles.slice(0, 5).map((vehicle, index) => ({
        id: createId(),
        vehicleId: vehicle.id,
        vehicleName: getVehicleName(vehicle),
        type: vehicle.status === "Reservado" ? "Reserva" : vehicle.status === "Manutenção" ? "Manutenção" : "Entrada",
        note: vehicle.status === "Reservado" ? "Veículo reservado por cliente interessado." : vehicle.status === "Manutenção" ? "Veículo retirado temporariamente do catálogo para revisão." : "Entrada inicial no estoque.",
        createdAt: offsetDateTime(index + 1)
      }));
      saveMovements(initialMovements);
    }
  }

  function getVehicles() {
    return readArray(KEYS.vehicles).map(normalizeVehicle);
  }

  function saveVehicles(vehicles) {
    localStorage.setItem(KEYS.vehicles, JSON.stringify(vehicles.map(normalizeVehicle)));
  }

  function getMovements() {
    return readArray(KEYS.movements);
  }

  function saveMovements(movements) {
    localStorage.setItem(KEYS.movements, JSON.stringify(Array.isArray(movements) ? movements : []));
  }

  function readArray(key) {
    try {
      const data = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  function normalizeVehicle(vehicle) {
    return {
      id: vehicle.id || createId(),
      brand: String(vehicle.brand || "").trim(),
      model: String(vehicle.model || "").trim(),
      version: String(vehicle.version || "").trim(),
      year: Number(vehicle.year || new Date().getFullYear()),
      purchasePrice: Number(vehicle.purchasePrice || 0),
      price: Number(vehicle.price || 0),
      mileage: Number(vehicle.mileage || 0),
      color: String(vehicle.color || "").trim(),
      plate: String(vehicle.plate || "").trim().toUpperCase(),
      status: STATUSES[vehicle.status] ? vehicle.status : "Disponível",
      fuel: String(vehicle.fuel || "Flex").trim(),
      transmission: String(vehicle.transmission || "Automático").trim(),
      bodyType: String(vehicle.bodyType || "Sedan").trim(),
      image: String(vehicle.image || "").trim(),
      isPublic: vehicle.isPublic !== false,
      entryDate: vehicle.entryDate || new Date().toISOString().slice(0, 10),
      features: Array.isArray(vehicle.features)
        ? vehicle.features.map((item) => String(item).trim()).filter(Boolean)
        : String(vehicle.features || "").split(",").map((item) => item.trim()).filter(Boolean),
      description: String(vehicle.description || "").trim(),
      createdAt: vehicle.createdAt || new Date().toISOString(),
      updatedAt: vehicle.updatedAt || vehicle.createdAt || new Date().toISOString()
    };
  }

  function getPublicVehicles() {
    return getVehicles().filter((vehicle) => vehicle.isPublic && STATUSES[vehicle.status]?.public);
  }

  function findVehicle(id) {
    return getVehicles().find((vehicle) => vehicle.id === id);
  }

  function getVehicleName(vehicle) {
    return [vehicle.brand, vehicle.model, vehicle.version].filter(Boolean).join(" ");
  }

  function createWhatsappLink(vehicle, customText) {
    const message = customText || `Olá! Tenho interesse no ${getVehicleName(vehicle)} ${vehicle.year}, anunciado por ${formatCurrency(vehicle.price)} no catálogo da Dárcio Veículos. Poderia me passar mais informações, por favor?`;
    return `https://wa.me/${CONFIG.whatsappPrincipal}?text=${encodeURIComponent(message)}`;
  }

  function createGeneralWhatsappLink() {
    const message = "Olá! Vim pelo catálogo da Dárcio Veículos e gostaria de mais informações sobre os carros disponíveis.";
    return `https://wa.me/${CONFIG.whatsappPrincipal}?text=${encodeURIComponent(message)}`;
  }

  function addMovement(vehicle, type, note) {
    const movements = getMovements();
    movements.unshift({
      id: createId(),
      vehicleId: vehicle.id,
      vehicleName: getVehicleName(vehicle),
      type,
      note: note || "Movimentação registrada no painel administrativo.",
      createdAt: new Date().toISOString()
    });
    saveMovements(movements);
  }

  function isLoggedIn() {
    return sessionStorage.getItem(KEYS.session) === "true";
  }

  function login(username, password) {
    const ok = username === CONFIG.adminUser && password === CONFIG.adminPassword;
    if (ok) sessionStorage.setItem(KEYS.session, "true");
    return ok;
  }

  function logout() {
    sessionStorage.removeItem(KEYS.session);
  }

  function applySavedTheme() {
    const savedTheme = localStorage.getItem(KEYS.theme) || "light";
    document.documentElement.dataset.theme = savedTheme;
    updateThemeButtons(savedTheme);
  }

  function toggleTheme() {
    const current = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem(KEYS.theme, next);
    updateThemeButtons(next);
  }

  function updateThemeButtons(theme) {
    document.querySelectorAll("#themeToggle").forEach((button) => {
      button.textContent = theme === "dark" ? "☀" : "☾";
    });
  }

  function bindThemeToggle() {
    applySavedTheme();
    document.querySelectorAll("#themeToggle").forEach((button) => {
      button.addEventListener("click", toggleTheme);
    });
  }

  function formatCurrency(value) {
    return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function compactCurrency(value) {
    return Number(value || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      notation: "compact",
      maximumFractionDigits: 1
    });
  }

  function formatNumber(value) {
    return Number(value || 0).toLocaleString("pt-BR");
  }

  function formatDate(date) {
    if (!date) return "—";
    return new Date(date).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function normalizeText(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replaceAll("`", "&#096;");
  }

  function safeImageUrl(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";
    try {
      const url = new URL(raw, window.location.href);
      if (!["http:", "https:", "data:"].includes(url.protocol)) return "";
      return raw;
    } catch {
      return "";
    }
  }

  function photoMarkup(vehicle, className) {
    const image = safeImageUrl(vehicle.image);
    const badge = `<span class="badge ${STATUSES[vehicle.status]?.className || "disponivel"}">${escapeHtml(vehicle.status)}</span>`;
    if (image) {
      return `<div class="${className} has-image" style="background-image:url('${escapeAttribute(image)}')">${badge}</div>`;
    }
    return `<div class="${className}">${badge}<div class="wheels" aria-hidden="true"><span></span><span></span></div></div>`;
  }

  function showToast(message) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("show"), 2600);
  }

  function createId() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function offsetDate(days) {
    return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  }

  function offsetDateTime(days) {
    return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  }

  function debounce(callback, wait = 220) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => callback(...args), wait);
    };
  }

  bootStorage();
  window.DarcioStore = {
    CONFIG,
    KEYS,
    STATUSES,
    demoVehicles,
    getVehicles,
    saveVehicles,
    getMovements,
    saveMovements,
    getPublicVehicles,
    findVehicle,
    getVehicleName,
    createWhatsappLink,
    createGeneralWhatsappLink,
    addMovement,
    isLoggedIn,
    login,
    logout,
    bindThemeToggle,
    formatCurrency,
    compactCurrency,
    formatNumber,
    formatDate,
    normalizeText,
    escapeHtml,
    escapeAttribute,
    photoMarkup,
    showToast,
    createId,
    debounce
  };
})();
