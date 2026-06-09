(function () {
  "use strict";

  const Store = window.DarcioStore;
  const state = {
    vehicles: Store.getPublicVehicles(),
    search: "",
    brand: "todas",
    price: "todos",
    sort: "recentes"
  };

  const els = {
    catalogGrid: document.getElementById("catalogGrid"),
    emptyCatalog: document.getElementById("emptyCatalog"),
    searchInput: document.getElementById("searchInput"),
    brandFilter: document.getElementById("brandFilter"),
    priceFilter: document.getElementById("priceFilter"),
    sortFilter: document.getElementById("sortFilter"),
    resultCount: document.getElementById("resultCount"),
    clearFilters: document.getElementById("clearFilters"),
    heroPublicCount: document.getElementById("heroPublicCount"),
    heroPhone: document.getElementById("heroPhone"),
    heroWhatsapp: document.getElementById("heroWhatsapp"),
    aboutWhatsapp: document.getElementById("aboutWhatsapp")
  };

  document.addEventListener("DOMContentLoaded", boot);

  function boot() {
    Store.bindThemeToggle();
    setupHeaderLinks();
    populateBrands();
    bindEvents();
    bindCatalogSync();
    renderCatalog();
  }

  function setupHeaderLinks() {
    const generalLink = Store.createGeneralWhatsappLink();
    els.heroWhatsapp.href = generalLink;
    els.aboutWhatsapp.href = generalLink;
    els.heroPhone.textContent = Store.CONFIG.telefonePrincipal;
  }

  function populateBrands() {
    const selected = state.brand;
    const brands = [...new Set(state.vehicles.map((vehicle) => vehicle.brand).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b));
    els.brandFilter.innerHTML = `<option value="todas">Todas</option>${brands.map((brand) => `<option value="${Store.escapeAttribute(brand)}">${Store.escapeHtml(brand)}</option>`).join("")}`;
    state.brand = selected === "todas" || brands.includes(selected) ? selected : "todas";
    els.brandFilter.value = state.brand;
  }

  function bindEvents() {
    const onSearch = Store.debounce(() => {
      state.search = els.searchInput.value;
      renderCatalog();
    }, 180);
    els.searchInput.addEventListener("input", onSearch);
    els.brandFilter.addEventListener("change", () => { state.brand = els.brandFilter.value; renderCatalog(); });
    els.priceFilter.addEventListener("change", () => { state.price = els.priceFilter.value; renderCatalog(); });
    els.sortFilter.addEventListener("change", () => { state.sort = els.sortFilter.value; renderCatalog(); });
    els.clearFilters.addEventListener("click", clearFilters);
  }

  function bindCatalogSync() {
    window.addEventListener("storage", (event) => {
      if (event.key === Store.KEYS.vehicles) refreshCatalogFromStorage();
    });
    window.addEventListener("focus", refreshCatalogFromStorage);
  }

  function refreshCatalogFromStorage() {
    state.vehicles = Store.getPublicVehicles();
    populateBrands();
    renderCatalog();
  }

  function clearFilters() {
    els.searchInput.value = "";
    els.brandFilter.value = "todas";
    els.priceFilter.value = "todos";
    els.sortFilter.value = "recentes";
    Object.assign(state, { search: "", brand: "todas", price: "todos", sort: "recentes" });
    renderCatalog();
  }

  function getFilteredVehicles() {
    const search = Store.normalizeText(state.search);
    let result = state.vehicles.filter((vehicle) => {
      const haystack = Store.normalizeText(`${vehicle.brand} ${vehicle.model} ${vehicle.version} ${vehicle.year} ${vehicle.color} ${vehicle.bodyType} ${vehicle.fuel}`);
      const matchSearch = !search || haystack.includes(search);
      const matchBrand = state.brand === "todas" || vehicle.brand === state.brand;
      const matchPrice = matchPriceRange(vehicle.price, state.price);
      return matchSearch && matchBrand && matchPrice;
    });

    const sorters = {
      "recentes": (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      "menor-preco": (a, b) => a.price - b.price,
      "maior-preco": (a, b) => b.price - a.price,
      "ano": (a, b) => b.year - a.year,
      "km": (a, b) => a.mileage - b.mileage
    };

    return result.sort(sorters[state.sort] || sorters.recentes);
  }

  function matchPriceRange(price, range) {
    if (range === "ate-80000") return price <= 80000;
    if (range === "80000-120000") return price > 80000 && price <= 120000;
    if (range === "120000-160000") return price > 120000 && price <= 160000;
    if (range === "acima-160000") return price > 160000;
    return true;
  }

  function renderCatalog() {
    const filtered = getFilteredVehicles();
    els.heroPublicCount.textContent = state.vehicles.length;
    els.resultCount.textContent = `${filtered.length} veículo${filtered.length === 1 ? "" : "s"} encontrado${filtered.length === 1 ? "" : "s"}`;
    els.emptyCatalog.hidden = filtered.length > 0;
    els.catalogGrid.innerHTML = filtered.map(renderCard).join("");
  }

  function renderCard(vehicle) {
    const vehicleName = Store.getVehicleName(vehicle);
    const whatsappLink = Store.createWhatsappLink(vehicle);
    return `
      <article class="car-card glass">
        ${Store.photoMarkup(vehicle, "car-photo")}
        <div class="car-content">
          <div class="car-topline">
            <div class="car-title">
              <h3>${Store.escapeHtml(vehicle.brand)} ${Store.escapeHtml(vehicle.model)}</h3>
              <p>${Store.escapeHtml(vehicle.version || vehicle.bodyType)} · ${vehicle.year}</p>
            </div>
            <strong class="price">${Store.formatCurrency(vehicle.price)}</strong>
          </div>
          <div class="specs" aria-label="Informações rápidas">
            <span>${Store.formatNumber(vehicle.mileage)} km</span>
            <span>${Store.escapeHtml(vehicle.transmission)}</span>
            <span>${Store.escapeHtml(vehicle.fuel)}</span>
            <span>${Store.escapeHtml(vehicle.color)}</span>
          </div>
          <div class="card-actions">
            <a class="secondary" href="veiculo.html?id=${encodeURIComponent(vehicle.id)}" aria-label="Ver detalhes de ${Store.escapeAttribute(vehicleName)}">Ver detalhes</a>
            <a class="primary" href="${whatsappLink}" target="_blank" rel="noopener" aria-label="Chamar no WhatsApp sobre ${Store.escapeAttribute(vehicleName)}">Chamar no Zap</a>
          </div>
        </div>
      </article>
    `;
  }
})();
