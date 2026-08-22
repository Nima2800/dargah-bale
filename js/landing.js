(function () {
  const data = window.BALE_PAY_LANDING;
  const themes = data.THEMES;
  const groups = data.GROUPS;
  const order = data.GROUP_ORDER;
  const pitch = data.GROUP_PITCH;

  const live = document.getElementById("lp-live");
  const nameEl = document.getElementById("lp-theme-name");
  const descEl = document.getElementById("lp-theme-desc");
  const catalog = document.getElementById("lp-catalog");
  const empty = document.getElementById("lp-empty");
  const search = document.getElementById("lp-search");
  const filters = document.getElementById("lp-filters");
  const ticker = document.getElementById("lp-ticker-track");
  const nav = document.querySelector(".lp-nav");
  const toggle = document.querySelector(".lp-nav-toggle");
  const countEl = document.getElementById("lp-theme-count");

  function faNum(n) {
    return String(n).replace(/[0-9]/g, function (d) {
      return "۰۱۲۳۴۵۶۷۸۹"[d];
    });
  }

  let currentId = "tile";
  let groupFilter = "all";
  let query = "";
  let timer = null;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function slipMarkup(theme) {
    const vars = data.cssVars(theme.colors);
    return (
      '<div class="bale-pay-body theme-' +
      theme.id +
      '" style="' +
      vars +
      '">' +
      '<div class="bale-pay-shell">' +
      '<header class="bale-pay-masthead">' +
      '<p class="bale-pay-kicker">فروشگاه نمونه</p>' +
      "<h1>درگاه بله</h1></header>" +
      '<section class="bale-pay-slip">' +
      '<p class="bale-pay-label">شماره سفارش</p><p class="bale-pay-ref" dir="ltr">1042</p>' +
      '<p class="bale-pay-copy">کیف چرم دست‌دوز</p>' +
      '<p class="bale-pay-label">مبلغ نهایی</p>' +
      '<p class="bale-pay-amount">۲۴۸٬۰۰۰ تومان</p>' +
      '<span class="bale-pay-btn" aria-hidden="true">پرداخت</span>' +
      "</section></div></div>"
    );
  }

  function applyTheme(id, userAction) {
    const theme = data.findTheme(id);
    currentId = theme.id;
    if (live) {
      live.className = "bale-pay-body theme-" + theme.id;
      live.setAttribute("style", data.cssVars(theme.colors));
    }
    if (nameEl) nameEl.textContent = theme.label;
    if (descEl) {
      descEl.textContent = groups[theme.group] + " · " + theme.desc;
    }
    document.querySelectorAll(".lp-card").forEach(function (card) {
      card.classList.toggle("is-on", card.getAttribute("data-theme") === theme.id);
    });
    if (userAction) {
      history.replaceState(null, "", "#" + theme.id);
      stopAuto();
    }
  }

  function visibleThemes() {
    return themes.filter(function (theme) {
      if (groupFilter !== "all" && theme.group !== groupFilter) return false;
      if (!query) return true;
      const hay = (theme.label + " " + theme.desc + " " + groups[theme.group] + " " + theme.id).toLowerCase();
      return hay.indexOf(query) !== -1;
    });
  }

  function renderCatalog() {
    if (!catalog) return;
    const visible = visibleThemes();
    catalog.innerHTML = "";
    if (!visible.length) {
      if (empty) empty.hidden = false;
      return;
    }
    if (empty) empty.hidden = true;

    order.forEach(function (groupId) {
      const items = visible.filter(function (theme) {
        return theme.group === groupId;
      });
      if (!items.length) return;

      const section = document.createElement("section");
      section.className = "lp-group";
      section.id = "group-" + groupId;
      section.innerHTML =
        '<header class="lp-group-banner" style="background:' +
        items[0].colors.bg +
        '">' +
        "<div><h3>" +
        groups[groupId] +
        "</h3><p>" +
        pitch[groupId] +
        "</p></div><b>" +
        faNum(items.length) +
        " مدل</b></header>";

      const grid = document.createElement("div");
      grid.className = "lp-grid";
      items.forEach(function (theme) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "lp-card" + (theme.id === currentId ? " is-on" : "");
        btn.setAttribute("data-theme", theme.id);
        btn.innerHTML =
          '<div class="lp-card-stage">' +
          slipMarkup(theme) +
          "</div>" +
          '<span class="lp-card-meta"><strong>' +
          theme.label +
          "</strong><em>" +
          theme.desc +
          "</em></span>";
        btn.addEventListener("click", function () {
          applyTheme(theme.id, true);
          document.getElementById("top").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
        });
        grid.appendChild(btn);
      });
      section.appendChild(grid);
      catalog.appendChild(section);
    });
  }

  function renderFilters() {
    if (!filters) return;
    const all = document.createElement("button");
    all.type = "button";
    all.className = "lp-filter is-on";
    all.textContent = "همه";
    all.setAttribute("data-group", "all");
    filters.appendChild(all);
    order.forEach(function (id) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "lp-filter";
      btn.textContent = groups[id];
      btn.setAttribute("data-group", id);
      filters.appendChild(btn);
    });
    filters.addEventListener("click", function (event) {
      const btn = event.target.closest(".lp-filter");
      if (!btn) return;
      groupFilter = btn.getAttribute("data-group");
      filters.querySelectorAll(".lp-filter").forEach(function (el) {
        el.classList.toggle("is-on", el === btn);
      });
      renderCatalog();
    });
  }

  function renderTicker() {
    if (!ticker) return;
    const names = themes.map(function (theme) {
      return theme.label;
    });
    ticker.innerHTML = names.concat(names).map(function (name) {
      return "<span>" + name + "</span>";
    }).join("");
  }

  function indexOfCurrent() {
    for (let i = 0; i < themes.length; i += 1) {
      if (themes[i].id === currentId) return i;
    }
    return 0;
  }

  function step(delta) {
    const next = (indexOfCurrent() + delta + themes.length) % themes.length;
    applyTheme(themes[next].id, true);
  }

  function startAuto() {
    if (reduceMotion || timer) return;
    timer = window.setInterval(function () {
      const next = (indexOfCurrent() + 1) % themes.length;
      applyTheme(themes[next].id, false);
    }, 3800);
  }

  function stopAuto() {
    if (!timer) return;
    window.clearInterval(timer);
    timer = null;
  }

  function bindNav() {
    if (toggle && nav) {
      toggle.addEventListener("click", function () {
        const open = nav.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
      });
      nav.querySelectorAll("a").forEach(function (link) {
        link.addEventListener("click", function () {
          nav.classList.remove("is-open");
        });
      });
    }

    const map = [
      { id: "models", link: 'a[href="#models"]' },
      { id: "flow", link: 'a[href="#flow"]' },
      { id: "security", link: 'a[href="#security"]' },
      { id: "faq", link: 'a[href="#faq"]' },
      { id: "buy", link: 'a[href="#buy"]' },
    ];
    if (!("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          document.querySelectorAll(".lp-nav-links a").forEach(function (a) {
            a.classList.remove("is-on");
          });
          const item = map.find(function (row) {
            return row.id === entry.target.id;
          });
          if (item) {
            const a = document.querySelector(item.link);
            if (a) a.classList.add("is-on");
          }
        });
      },
      { rootMargin: "-45% 0px -45% 0px" }
    );
    map.forEach(function (row) {
      const el = document.getElementById(row.id);
      if (el) observer.observe(el);
    });
  }

  if (countEl) countEl.textContent = faNum(themes.length);

  renderFilters();
  renderTicker();
  bindNav();

  const fromHash = (location.hash || "").replace("#", "");
  if (fromHash && data.findTheme(fromHash).id === fromHash) {
    currentId = fromHash;
  }
  applyTheme(currentId, false);
  renderCatalog();
  startAuto();

  const sectionHash = (location.hash || "").replace("#", "");
  if (sectionHash && !themes.some(function (theme) { return theme.id === sectionHash; })) {
    const target = document.getElementById(sectionHash);
    if (target) {
      window.requestAnimationFrame(function () {
        target.scrollIntoView();
      });
    }
  }

  if (search) {
    search.addEventListener("input", function () {
      query = search.value.trim().toLowerCase();
      renderCatalog();
    });
  }

  document.getElementById("lp-prev")?.addEventListener("click", function () {
    step(-1);
  });
  document.getElementById("lp-next")?.addEventListener("click", function () {
    step(1);
  });

  document.addEventListener("keydown", function (event) {
    if (event.target && /input|textarea|select/i.test(event.target.tagName)) return;
    if (event.key === "ArrowLeft") step(1);
    if (event.key === "ArrowRight") step(-1);
  });

  const stage = document.querySelector(".lp-stage");
  if (stage) {
    stage.addEventListener("mouseenter", stopAuto);
    stage.addEventListener("mouseleave", startAuto);
  }
})();
