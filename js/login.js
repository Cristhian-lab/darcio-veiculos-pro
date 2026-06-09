(function () {
  "use strict";

  const Store = window.DarcioStore;

  document.addEventListener("DOMContentLoaded", () => {
    Store.bindThemeToggle();
    if (Store.isLoggedIn()) {
      window.location.href = "admin.html";
      return;
    }
    document.getElementById("loginForm").addEventListener("submit", handleLogin);
  });

  function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    if (!Store.login(username, password)) {
      Store.showToast("Usuário ou senha incorretos.");
      return;
    }

    Store.showToast("Login realizado com sucesso.");
    setTimeout(() => {
      window.location.href = "admin.html";
    }, 450);
  }
})();
