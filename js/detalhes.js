(function () {
  "use strict";

  const Store = window.DarcioStore;
  const root = document.getElementById("detailRoot");

  document.addEventListener("DOMContentLoaded", () => {
    Store.bindThemeToggle();
    bindDetailSync();
    renderDetails();
  });

  function bindDetailSync() {
    window.addEventListener("storage", (event) => {
      if (event.key === Store.KEYS.vehicles) renderDetails();
    });
    window.addEventListener("focus", renderDetails);
  }

  function renderDetails() {
    const id = new URLSearchParams(window.location.search).get("id");
    const vehicle = id ? Store.findVehicle(id) : null;

    if (!vehicle || !vehicle.isPublic || !Store.STATUSES[vehicle.status]?.public) {
      renderNotFound();
      return;
    }

    document.title = `${Store.getVehicleName(vehicle)} | Dárcio Veículos`;
    const whatsappLink = Store.createWhatsappLink(vehicle);
    const features = vehicle.features?.length ? vehicle.features : ["Financiamento", "Troca", "Atendimento via WhatsApp"];

    root.innerHTML = `
      <div class="detail-layout reveal">
        ${Store.photoMarkup(vehicle, "detail-photo")}
        <article class="detail-info glass">
          <span class="eyebrow">Detalhes do veículo</span>
          <h1>${Store.escapeHtml(vehicle.brand)} ${Store.escapeHtml(vehicle.model)}</h1>
          <div class="detail-price">${Store.formatCurrency(vehicle.price)}</div>
          <p class="detail-description">${Store.escapeHtml(vehicle.description || "Veículo disponível no catálogo da Dárcio Veículos. Chame no WhatsApp para consultar condições, financiamento e troca.")}</p>

          <div class="detail-grid">
            <div><span>Versão</span><strong>${Store.escapeHtml(vehicle.version || "—")}</strong></div>
            <div><span>Ano</span><strong>${vehicle.year}</strong></div>
            <div><span>KM</span><strong>${Store.formatNumber(vehicle.mileage)} km</strong></div>
            <div><span>Cor</span><strong>${Store.escapeHtml(vehicle.color || "—")}</strong></div>
            <div><span>Câmbio</span><strong>${Store.escapeHtml(vehicle.transmission || "—")}</strong></div>
            <div><span>Combustível</span><strong>${Store.escapeHtml(vehicle.fuel || "—")}</strong></div>
            <div><span>Carroceria</span><strong>${Store.escapeHtml(vehicle.bodyType || "—")}</strong></div>
            <div><span>Status</span><strong>${Store.escapeHtml(vehicle.status)}</strong></div>
          </div>

          <div class="feature-list">
            ${features.map((feature) => `<span>${Store.escapeHtml(feature)}</span>`).join("")}
          </div>

          <div class="detail-actions">
            <a class="secondary" href="index.html#catalogo">Voltar ao catálogo</a>
            <a class="primary" href="${whatsappLink}" target="_blank" rel="noopener">Tenho interesse</a>
          </div>
        </article>
      </div>
    `;
  }

  function renderNotFound() {
    root.innerHTML = `
      <article class="not-found glass reveal">
        <span class="eyebrow">Não encontrado</span>
        <h1>Veículo indisponível</h1>
        <p>Esse carro pode ter sido vendido, removido do catálogo ou estar temporariamente fora da vitrine pública.</p>
        <a class="primary" href="index.html#catalogo">Voltar ao catálogo</a>
      </article>
    `;
  }
})();
