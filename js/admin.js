(function () {
  "use strict";

  const Store = window.DarcioStore;
  let vehicles = [];
  let movements = [];
  let editingId = null;
  let currentView = "dashboard";

  const els = {};

  document.addEventListener("DOMContentLoaded", boot);

  function boot() {
    if (!Store.isLoggedIn()) {
      window.location.href = "login.html";
      return;
    }

    Store.bindThemeToggle();
    cacheElements();
    loadState();
    bindEvents();
    renderAll();
  }

  function cacheElements() {
    Object.assign(els, {
      adminTitle: document.getElementById("adminTitle"),
      menuLinks: [...document.querySelectorAll(".menu-link")],
      views: [...document.querySelectorAll(".admin-view")],
      logoutBtn: document.getElementById("logoutBtn"),
      newVehicleShortcut: document.getElementById("newVehicleShortcut"),
      vehicleForm: document.getElementById("vehicleForm"),
      clearFormBtn: document.getElementById("clearFormBtn"),
      formTitle: document.getElementById("formTitle"),
      formMode: document.getElementById("formMode"),
      vehicleTable: document.getElementById("vehicleTable"),
      adminCount: document.getElementById("adminCount"),
      adminSearch: document.getElementById("adminSearch"),
      adminStatusFilter: document.getElementById("adminStatusFilter"),
      movementForm: document.getElementById("movementForm"),
      movementVehicle: document.getElementById("movementVehicle"),
      movementType: document.getElementById("movementType"),
      movementNote: document.getElementById("movementNote"),
      movementTable: document.getElementById("movementTable"),
      movementCount: document.getElementById("movementCount"),
      exportBtn: document.getElementById("exportBtn"),
      importInput: document.getElementById("importInput"),
      resetDemoBtn: document.getElementById("resetDemoBtn")
    });
  }

  function loadState() {
    vehicles = Store.getVehicles();
    movements = Store.getMovements();
  }

  function persistVehicles() {
    Store.saveVehicles(vehicles);
  }

  function persistMovements() {
    Store.saveMovements(movements);
  }

  function bindEvents() {
    els.menuLinks.forEach((button) => {
      button.addEventListener("click", () => {
        if (button.dataset.view === "cadastro") resetForm();
        switchView(button.dataset.view);
      });
    });

    els.logoutBtn.addEventListener("click", () => {
      Store.logout();
      window.location.href = "login.html";
    });

    els.newVehicleShortcut.addEventListener("click", () => {
      switchView("cadastro");
      resetForm();
      focusFirstFormField();
    });

    els.vehicleForm.addEventListener("submit", handleVehicleSubmit);
    els.clearFormBtn.addEventListener("click", resetForm);
    els.vehicleTable.addEventListener("click", handleVehicleTableClick);
    els.adminSearch.addEventListener("input", Store.debounce(renderVehicleTable, 180));
    els.adminStatusFilter.addEventListener("change", renderVehicleTable);

    els.movementForm.addEventListener("submit", handleMovementSubmit);
    els.exportBtn.addEventListener("click", exportData);
    els.importInput.addEventListener("change", importData);
    els.resetDemoBtn.addEventListener("click", resetDemoData);
  }

  function switchView(view) {
    currentView = view;
    const titles = {
      dashboard: "Dashboard",
      cadastro: editingId ? "Editar veículo" : "Cadastrar veículo",
      veiculos: "Estoque de veículos",
      movimentos: "Movimentações",
      backup: "Backup e dados"
    };

    els.adminTitle.textContent = titles[view] || "Painel";
    els.menuLinks.forEach((button) => button.classList.toggle("active", button.dataset.view === view));
    els.views.forEach((section) => section.classList.toggle("is-visible", section.id === `view-${view}`));

    if (view === "dashboard") renderDashboard();
    if (view === "cadastro") populateMovementVehicles();
    if (view === "veiculos") renderVehicleTable();
    if (view === "movimentos") renderMovements();
  }

  function renderAll() {
    populateMovementVehicles();
    renderDashboard();
    renderVehicleTable();
    renderMovements();
  }

  function getActiveVehicles() {
    return vehicles.filter((vehicle) => vehicle.status !== "Vendido");
  }

  function renderDashboard() {
    const active = getActiveVehicles();
    const available = vehicles.filter((vehicle) => vehicle.status === "Disponível").length;
    const reserved = vehicles.filter((vehicle) => vehicle.status === "Reservado").length;
    const sold = vehicles.filter((vehicle) => vehicle.status === "Vendido").length;
    const stockValue = active.reduce((sum, vehicle) => sum + Number(vehicle.price || 0), 0);
    const investment = active.reduce((sum, vehicle) => sum + Number(vehicle.purchasePrice || 0), 0);
    const profit = stockValue - investment;
    const activePrices = active.map((vehicle) => Number(vehicle.price || 0)).filter((value) => value > 0);
    const average = activePrices.length ? activePrices.reduce((sum, price) => sum + price, 0) / activePrices.length : 0;

    document.getElementById("statTotal").textContent = vehicles.length;
    document.getElementById("statAvailable").textContent = available;
    document.getElementById("statReserved").textContent = reserved;
    document.getElementById("statSold").textContent = sold;
    document.getElementById("statStockValue").textContent = Store.compactCurrency(stockValue);
    document.getElementById("statProfit").textContent = Store.compactCurrency(profit);
    document.getElementById("investmentValue").textContent = Store.formatCurrency(investment);
    document.getElementById("averageTicket").textContent = Store.formatCurrency(average);
    document.getElementById("highestPrice").textContent = Store.formatCurrency(activePrices.length ? Math.max(...activePrices) : 0);
    document.getElementById("lowestPrice").textContent = Store.formatCurrency(activePrices.length ? Math.min(...activePrices) : 0);

    renderStatusBars();
    renderRecentMovements();
  }

  function renderStatusBars() {
    const total = Math.max(vehicles.length, 1);
    document.getElementById("statusBars").innerHTML = Object.keys(Store.STATUSES).map((status) => {
      const count = vehicles.filter((vehicle) => vehicle.status === status).length;
      const percentage = Math.round((count / total) * 100);
      return `
        <div class="status-bar-row">
          <div class="status-label"><span>${status}</span><strong>${count}</strong></div>
          <div class="status-bar"><span style="width:${percentage}%"></span></div>
        </div>
      `;
    }).join("");
  }

  function renderRecentMovements() {
    const latest = movements.slice(0, 6);
    document.getElementById("recentMovements").innerHTML = latest.length ? latest.map((movement) => `
      <div class="timeline-item">
        <span class="timeline-dot"></span>
        <div>
          <strong>${Store.escapeHtml(movement.type)} · ${Store.escapeHtml(movement.vehicleName)}</strong>
          <span>${Store.formatDate(movement.createdAt)} — ${Store.escapeHtml(movement.note)}</span>
        </div>
      </div>
    `).join("") : `<p>Nenhuma movimentação registrada.</p>`;
  }

  function renderVehicleTable() {
    const filtered = getFilteredAdminVehicles();
    els.adminCount.textContent = `${filtered.length} registro${filtered.length === 1 ? "" : "s"}`;
    els.vehicleTable.innerHTML = filtered.length ? filtered.map(renderVehicleRow).join("") : `
      <tr><td colspan="5">Nenhum veículo encontrado.</td></tr>
    `;
  }

  function getFilteredAdminVehicles() {
    const search = Store.normalizeText(els.adminSearch.value);
    const status = els.adminStatusFilter.value;

    return vehicles
      .filter((vehicle) => {
        const haystack = Store.normalizeText(`${vehicle.brand} ${vehicle.model} ${vehicle.version} ${vehicle.year} ${vehicle.color} ${vehicle.plate} ${vehicle.status}`);
        const matchSearch = !search || haystack.includes(search);
        const matchStatus = status === "todos" || vehicle.status === status;
        return matchSearch && matchStatus;
      })
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
  }

  function renderVehicleRow(vehicle) {
    const statusCanAppear = Boolean(Store.STATUSES[vehicle.status]?.public);
    const publicLabel = vehicle.isPublic && statusCanAppear ? "Visível" : "Oculto";
    const publicDescription = !statusCanAppear ? "Oculto pelo status" : vehicle.isPublic ? "Liberado no catálogo" : "Apenas admin";
    const profit = Number(vehicle.price || 0) - Number(vehicle.purchasePrice || 0);
    const vehicleName = Store.getVehicleName(vehicle);
    return `
      <tr>
        <td>
          <strong>${Store.escapeHtml(vehicle.brand)} ${Store.escapeHtml(vehicle.model)}</strong>
          <small>${Store.escapeHtml(vehicle.version || vehicle.bodyType)} · ${vehicle.year} · ${Store.formatNumber(vehicle.mileage)} km · ${Store.escapeHtml(vehicle.plate || "sem placa")}</small>
        </td>
        <td>
          <strong>${Store.formatCurrency(vehicle.price)}</strong>
          <small>Compra: ${Store.formatCurrency(vehicle.purchasePrice)} · Lucro: ${Store.formatCurrency(profit)}</small>
        </td>
        <td><span class="badge ${Store.STATUSES[vehicle.status]?.className || "disponivel"}" style="position:static;">${Store.escapeHtml(vehicle.status)}</span></td>
        <td><strong>${publicLabel}</strong><small>${publicDescription}</small></td>
        <td>
          <div class="action-row">
            <button type="button" data-action="edit" data-id="${vehicle.id}">Editar</button>
            <button type="button" data-action="status" data-status="Disponível" data-id="${vehicle.id}">Disponível</button>
            <button type="button" data-action="status" data-status="Reservado" data-id="${vehicle.id}">Reservar</button>
            <button type="button" data-action="status" data-status="Vendido" data-id="${vehicle.id}">Vender</button>
            <button type="button" data-action="status" data-status="Manutenção" data-id="${vehicle.id}">Manutenção</button>
            <button type="button" data-action="toggle-public" data-id="${vehicle.id}">${vehicle.isPublic ? "Ocultar" : "Exibir"}</button>
            <a href="veiculo.html?id=${encodeURIComponent(vehicle.id)}" target="_blank" rel="noopener" aria-label="Abrir detalhes de ${Store.escapeAttribute(vehicleName)}">Detalhes</a>
            <button class="danger-action" type="button" data-action="delete" data-id="${vehicle.id}">Excluir</button>
          </div>
        </td>
      </tr>
    `;
  }

  function handleVehicleTableClick(event) {
    const target = event.target.closest("[data-action]");
    if (!target) return;
    const id = target.dataset.id;
    const action = target.dataset.action;

    if (action === "edit") editVehicle(id);
    if (action === "delete") deleteVehicle(id);
    if (action === "status") updateVehicleStatus(id, target.dataset.status);
    if (action === "toggle-public") toggleVehiclePublic(id);
  }

  function handleVehicleSubmit(event) {
    event.preventDefault();
    const now = new Date().toISOString();
    const vehicle = Store.findVehicle(editingId) || {};
    const payload = {
      id: editingId || Store.createId(),
      brand: inputValue("brand"),
      model: inputValue("model"),
      version: inputValue("version"),
      year: Number(inputValue("year")),
      purchasePrice: Number(inputValue("purchasePrice") || 0),
      price: Number(inputValue("price")),
      mileage: Number(inputValue("mileage")),
      color: inputValue("color"),
      plate: inputValue("plate").toUpperCase(),
      status: inputValue("status"),
      fuel: inputValue("fuel"),
      transmission: inputValue("transmission"),
      bodyType: inputValue("bodyType"),
      image: inputValue("image"),
      isPublic: inputValue("isPublic") === "true",
      entryDate: inputValue("entryDate") || new Date().toISOString().slice(0, 10),
      features: inputValue("features").split(",").map((item) => item.trim()).filter(Boolean),
      description: inputValue("description"),
      createdAt: editingId ? vehicle.createdAt || now : now,
      updatedAt: now
    };

    applyVisibilityRules(payload, vehicle.status, { restoreWhenAvailable: Boolean(editingId) });

    if (editingId) {
      vehicles = vehicles.map((item) => item.id === editingId ? payload : item);
      addLocalMovement(payload, "Edição", "Dados do veículo atualizados no painel administrativo.");
      Store.showToast("Veículo atualizado com sucesso.");
    } else {
      vehicles.unshift(payload);
      addLocalMovement(payload, "Entrada", "Novo veículo cadastrado no estoque.");
      Store.showToast("Veículo cadastrado com sucesso.");
    }

    persistVehicles();
    persistMovements();
    resetForm();
    renderAll();
  }

  function inputValue(id) {
    return document.getElementById(id).value.trim();
  }

  function resetForm() {
    els.vehicleForm.reset();
    editingId = null;
    document.getElementById("vehicleId").value = "";
    document.getElementById("entryDate").value = new Date().toISOString().slice(0, 10);
    els.formTitle.textContent = "Novo veículo";
    els.formMode.textContent = "cadastro";
    if (currentView === "cadastro") els.adminTitle.textContent = "Cadastrar veículo";
  }

  function editVehicle(id) {
    const vehicle = vehicles.find((item) => item.id === id);
    if (!vehicle) return;

    editingId = id;
    switchView("cadastro");
    document.getElementById("vehicleId").value = vehicle.id;
    setValue("brand", vehicle.brand);
    setValue("model", vehicle.model);
    setValue("version", vehicle.version);
    setValue("year", vehicle.year);
    setValue("purchasePrice", vehicle.purchasePrice);
    setValue("price", vehicle.price);
    setValue("mileage", vehicle.mileage);
    setValue("color", vehicle.color);
    setValue("plate", vehicle.plate);
    setValue("status", vehicle.status);
    setValue("fuel", vehicle.fuel);
    setValue("transmission", vehicle.transmission);
    setValue("bodyType", vehicle.bodyType);
    setValue("image", vehicle.image);
    setValue("isPublic", String(vehicle.isPublic));
    setValue("entryDate", vehicle.entryDate || new Date().toISOString().slice(0, 10));
    setValue("features", (vehicle.features || []).join(", "));
    setValue("description", vehicle.description);

    els.formTitle.textContent = "Editando veículo";
    els.formMode.textContent = Store.getVehicleName(vehicle);
    focusFirstFormField();
    Store.showToast("Veículo carregado para edição.");
  }

  function setValue(id, value) {
    document.getElementById(id).value = value ?? "";
  }

  function deleteVehicle(id) {
    const vehicle = vehicles.find((item) => item.id === id);
    if (!vehicle) return;
    if (!confirm(`Deseja excluir ${Store.getVehicleName(vehicle)} do estoque?`)) return;

    vehicles = vehicles.filter((item) => item.id !== id);
    addLocalMovement(vehicle, "Exclusão", "Veículo removido do estoque.");
    persistVehicles();
    persistMovements();
    renderAll();
    Store.showToast("Veículo excluído.");
  }

  function updateVehicleStatus(id, status) {
    const vehicle = vehicles.find((item) => item.id === id);
    if (!vehicle) return;
    const previousStatus = vehicle.status;
    vehicle.status = status;
    vehicle.updatedAt = new Date().toISOString();
    applyVisibilityRules(vehicle, previousStatus, { forcePublicWhenAvailable: true });
    const type = status === "Vendido" ? "Venda" : status === "Reservado" ? "Reserva" : status === "Manutenção" ? "Manutenção" : "Disponibilização";
    const visibilityNote = Store.STATUSES[status]?.public ? " Veículo liberado na vitrine pública." : " Veículo removido da vitrine pública.";
    addLocalMovement(vehicle, type, `Status alterado para ${status}.${visibilityNote}`);
    persistVehicles();
    persistMovements();
    renderAll();
    Store.showToast(`Status alterado para ${status} e catálogo sincronizado.`);
  }

  function toggleVehiclePublic(id) {
    const vehicle = vehicles.find((item) => item.id === id);
    if (!vehicle) return;
    const nextVisibility = !vehicle.isPublic;
    if (nextVisibility && !Store.STATUSES[vehicle.status]?.public) {
      Store.showToast("Para exibir no catálogo, altere o status para Disponível ou Reservado.");
      return;
    }
    vehicle.isPublic = nextVisibility;
    vehicle.updatedAt = new Date().toISOString();
    addLocalMovement(vehicle, "Edição", vehicle.isPublic ? "Veículo liberado no catálogo público." : "Veículo ocultado do catálogo público.");
    persistVehicles();
    persistMovements();
    renderAll();
    Store.showToast(vehicle.isPublic ? "Veículo exibido no catálogo." : "Veículo ocultado do catálogo.");
  }

  function applyVisibilityRules(vehicle, previousStatus, options = {}) {
    const statusCanAppear = Boolean(Store.STATUSES[vehicle.status]?.public);
    const previousCouldAppear = Boolean(Store.STATUSES[previousStatus]?.public);

    if (!statusCanAppear) {
      vehicle.isPublic = false;
      return;
    }

    if (options.forcePublicWhenAvailable || (options.restoreWhenAvailable && previousStatus && !previousCouldAppear)) {
      vehicle.isPublic = true;
    }
  }

  function focusFirstFormField() {
    requestAnimationFrame(() => document.getElementById("brand")?.focus());
  }

  function addLocalMovement(vehicle, type, note) {
    movements.unshift({
      id: Store.createId(),
      vehicleId: vehicle.id,
      vehicleName: Store.getVehicleName(vehicle),
      type,
      note,
      createdAt: new Date().toISOString()
    });
  }

  function populateMovementVehicles() {
    els.movementVehicle.innerHTML = vehicles.length ? vehicles.map((vehicle) => `
      <option value="${vehicle.id}">${Store.escapeHtml(Store.getVehicleName(vehicle))} · ${vehicle.year} · ${Store.escapeHtml(vehicle.status)}</option>
    `).join("") : `<option value="">Nenhum veículo cadastrado</option>`;
  }

  function handleMovementSubmit(event) {
    event.preventDefault();
    const vehicle = vehicles.find((item) => item.id === els.movementVehicle.value);
    if (!vehicle) return;

    const type = els.movementType.value;
    const note = els.movementNote.value.trim() || "Movimentação registrada manualmente.";

    const previousStatus = vehicle.status;
    if (type === "Venda") vehicle.status = "Vendido";
    if (type === "Reserva") vehicle.status = "Reservado";
    if (type === "Manutenção") vehicle.status = "Manutenção";
    if (["Entrada", "Disponibilização"].includes(type)) vehicle.status = "Disponível";
    if (type === "Saída") vehicle.isPublic = false;
    applyVisibilityRules(vehicle, previousStatus, { forcePublicWhenAvailable: ["Entrada", "Reserva", "Disponibilização"].includes(type) });
    vehicle.updatedAt = new Date().toISOString();

    addLocalMovement(vehicle, type, note);
    persistVehicles();
    persistMovements();
    els.movementForm.reset();
    renderAll();
    Store.showToast("Movimentação registrada.");
  }

  function renderMovements() {
    els.movementCount.textContent = `${movements.length} registro${movements.length === 1 ? "" : "s"}`;
    els.movementTable.innerHTML = movements.length ? movements.map((movement) => `
      <tr>
        <td>${Store.formatDate(movement.createdAt)}</td>
        <td><strong>${Store.escapeHtml(movement.vehicleName)}</strong></td>
        <td>${Store.escapeHtml(movement.type)}</td>
        <td>${Store.escapeHtml(movement.note)}</td>
      </tr>
    `).join("") : `<tr><td colspan="4">Nenhuma movimentação registrada.</td></tr>`;
  }

  function exportData() {
    const payload = {
      exportedAt: new Date().toISOString(),
      loja: Store.CONFIG.loja,
      vehicles,
      movements
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `backup-darcio-veiculos-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    Store.showToast("Backup exportado em JSON.");
  }

  function importData(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!Array.isArray(data.vehicles)) throw new Error("Arquivo inválido");
        vehicles = data.vehicles;
        movements = Array.isArray(data.movements) ? data.movements : [];
        persistVehicles();
        persistMovements();
        loadState();
        renderAll();
        Store.showToast("Dados importados com sucesso.");
      } catch {
        Store.showToast("Não foi possível importar esse arquivo.");
      } finally {
        els.importInput.value = "";
      }
    };
    reader.readAsText(file);
  }

  function resetDemoData() {
    if (!confirm("Isso apagará os dados atuais e restaurará os exemplos. Continuar?")) return;
    Store.saveVehicles(Store.demoVehicles);
    Store.saveMovements([]);
    localStorage.removeItem(Store.KEYS.movements);
    window.location.reload();
  }
})();
