/* Konfigurationsguide – Linux deployment server
   Sparar markeringar lokalt i webbläsaren (localStorage). Om lagringen inte
   är tillgänglig fungerar sidan ändå, men markeringarna försvinner vid omladdning. */
(function () {
  "use strict";

  var PREFIX = "lds-guide:" + ((window.GUIDE && window.GUIDE.id) || "") + ":";
  var store = {
    get: function (key, fallback) {
      try {
        var v = localStorage.getItem(PREFIX + key);
        return v === null ? fallback : JSON.parse(v);
      } catch (e) { return fallback; }
    },
    set: function (key, value) {
      try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch (e) { /* ignoreras */ }
    }
  };

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  var steps = $$("li.step");
  var parts = $$(".part");
  var done = new Set(store.get("done", []));
  var collapsed = new Set(store.get("collapsed", []));

  /* ------------------------------------------------------------ steg och framsteg */
  function render() {
    steps.forEach(function (li) {
      var id = li.dataset.step;
      var isDone = done.has(id);
      li.classList.toggle("done", isDone);
      $(".tick", li).setAttribute("aria-checked", String(isDone));
    });

    parts.forEach(function (part) {
      var ps = $$("li.step", part);
      var n = ps.filter(function (li) { return done.has(li.dataset.step); }).length;
      var text = n + "/" + ps.length;
      var complete = n === ps.length;
      $(".part-count", part).textContent = text;
      part.classList.toggle("complete", complete);
      if (!complete) part.classList.remove("force-open");
      syncAria(part);
      var toc = $('[data-toc="' + part.id + '"]');
      if (toc) {
        $(".toc-count", toc).textContent = text;
        toc.classList.toggle("complete", complete);
      }
    });

    var total = steps.length;
    var count = steps.filter(function (li) { return done.has(li.dataset.step); }).length;
    $$("[data-progress-text]").forEach(function (el) { el.textContent = count + " av " + total; });
    $("[data-progress-bar]").style.width = (total ? (100 * count / total) : 0) + "%";
  }

  function toggleStep(li) {
    var id = li.dataset.step;
    if (done.has(id)) done.delete(id); else done.add(id);
    store.set("done", Array.from(done));
    render();
  }

  steps.forEach(function (li) {
    $(".tick", li).addEventListener("click", function () { toggleStep(li); });
  });

  /* ------------------------------------------------------------ hopfällning */
  /* en sektion kan vara stängd på två sätt: manuellt, eller för att den är klar
     och "Minimera utförda sektioner" är på. Ett klick på rubriken öppnar den ändå. */
  function minimizedByMode(part) {
    return document.body.classList.contains("min-parts")
      && part.classList.contains("complete")
      && !part.classList.contains("force-open");
  }
  function isClosed(part) {
    return part.classList.contains("collapsed") || minimizedByMode(part);
  }
  function syncAria(part) {
    $(".part-toggle", part).setAttribute("aria-expanded", String(!isClosed(part)));
  }
  function setCollapsed(part, value) {
    part.classList.toggle("collapsed", value);
    if (value) {
      collapsed.add(part.id);
      part.classList.remove("force-open");
    } else {
      collapsed.delete(part.id);
      if (minimizedByMode(part)) part.classList.add("force-open");
    }
    syncAria(part);
  }
  function saveCollapsed() { store.set("collapsed", Array.from(collapsed)); }

  parts.forEach(function (part) {
    setCollapsed(part, collapsed.has(part.id));
    $(".part-toggle", part).addEventListener("click", function () {
      setCollapsed(part, !isClosed(part));
      saveCollapsed();
    });
  });

  function reveal(target) {
    var part = target.closest(".part");
    if (part && isClosed(part)) { setCollapsed(part, false); saveCollapsed(); }
  }

  /* länkar i innehållsförteckning och översikt öppnar hopfällda avsnitt */
  document.addEventListener("click", function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var target = document.getElementById(a.getAttribute("href").slice(1));
    if (!target) return;
    reveal(target);
    if (target.classList.contains("step")) flash(target);
    document.body.classList.remove("nav-open");
    $(".nav-toggle").setAttribute("aria-expanded", "false");
  });

  function flash(el) {
    el.classList.remove("flash");
    void el.offsetWidth;
    el.classList.add("flash");
  }

  /* ------------------------------------------------------------ nästa steg, dölj klara, nollställ */
  $("#next-step").addEventListener("click", function () {
    var next = steps.find(function (li) { return !done.has(li.dataset.step); });
    if (!next) { $("#resultat").scrollIntoView({ behavior: "smooth", block: "start" }); return; }
    reveal(next);
    next.scrollIntoView({ behavior: "smooth", block: "center" });
    flash(next);
    $(".tick", next).focus({ preventScroll: true });
    document.body.classList.remove("nav-open");
  });

  var hide = $("#hide-done");
  hide.checked = store.get("hideDone", false);
  document.body.classList.toggle("hide-done", hide.checked);
  hide.addEventListener("change", function () {
    document.body.classList.toggle("hide-done", hide.checked);
    store.set("hideDone", hide.checked);
  });

  var minParts = $("#min-parts");
  minParts.checked = store.get("minParts", false);
  document.body.classList.toggle("min-parts", minParts.checked);
  minParts.addEventListener("change", function () {
    document.body.classList.toggle("min-parts", minParts.checked);
    parts.forEach(function (p) { p.classList.remove("force-open"); syncAria(p); });
    store.set("minParts", minParts.checked);
  });

  $("#reset").addEventListener("click", function () {
    if (!window.confirm("Ta bort alla markeringar av klara steg?")) return;
    done.clear();
    store.set("done", []);
    render();
  });

  /* ------------------------------------------------------------ kopiering */
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy") ? resolve() : reject(); } catch (e) { reject(e); }
      document.body.removeChild(ta);
    });
  }

  $$(".copy").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var holder = btn.closest(".copy-unit") || btn.closest("figure.code") || btn.closest("td");
      var code = $("code", holder);
      var original = btn.textContent;
      copyText(code.textContent).then(function () {
        btn.textContent = "Kopierat";
        btn.classList.add("copied");
      }, function () {
        btn.textContent = "Markera och kopiera manuellt";
      }).then(function () {
        setTimeout(function () { btn.textContent = original; btn.classList.remove("copied"); }, 1600);
      });
    });
  });

  /* ------------------------------------------------------------ förklaringsrutor */
  var tip = $("#tip");
  var tipOwner = null;

  function showTip(el) {
    tipOwner = el;
    tip.textContent = el.dataset.tip;
    tip.hidden = false;
    var r = el.getBoundingClientRect();
    var t = tip.getBoundingClientRect();
    var left = Math.min(Math.max(8, r.left + r.width / 2 - t.width / 2), window.innerWidth - t.width - 8);
    var top = r.bottom + 8;
    if (top + t.height > window.innerHeight - 8) top = r.top - t.height - 8;
    tip.style.left = left + "px";
    tip.style.top = top + "px";
  }
  function hideTip() { tip.hidden = true; tipOwner = null; }

  document.addEventListener("pointerover", function (e) {
    if (e.pointerType === "touch") return;
    var el = e.target.closest("[data-tip]");
    if (el) showTip(el);
  });
  document.addEventListener("pointerout", function (e) {
    if (e.pointerType === "touch") return;
    var el = e.target.closest("[data-tip]");
    if (el && !el.contains(e.relatedTarget)) hideTip();
  });
  document.addEventListener("focusin", function (e) {
    var el = e.target.closest && e.target.closest("[data-tip]");
    if (el) showTip(el);
  });
  document.addEventListener("focusout", function (e) {
    if (e.target.closest && e.target.closest("[data-tip]")) hideTip();
  });
  /* pekskärm: tryck visar, nytt tryck döljer */
  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-tip]");
    if (el) { if (tipOwner === el) hideTip(); else showTip(el); }
    else if (tipOwner) hideTip();
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") hideTip(); });
  window.addEventListener("scroll", function () { if (tipOwner) hideTip(); }, { passive: true });

  /* ------------------------------------------------------------ aktiv plats i innehållsförteckningen */
  var tocItems = {};
  $$(".toc a").forEach(function (a) { tocItems[a.getAttribute("href").slice(1)] = a.parentElement; });
  var watched = $$(".chapter, .part").filter(function (el) { return tocItems[el.id]; });
  if ("IntersectionObserver" in window) {
    var visible = new Map();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { visible.set(en.target, en.isIntersecting); });
      var current = watched.filter(function (el) { return visible.get(el); }).pop();
      if (!current) return;
      Object.keys(tocItems).forEach(function (k) { tocItems[k].classList.remove("active"); });
      tocItems[current.id].classList.add("active");
      if (current.classList.contains("part")) { var pc = current.closest(".chapter"); if (pc && tocItems[pc.id]) tocItems[pc.id].classList.add("active"); }
    }, { rootMargin: "-10% 0px -70% 0px" });
    watched.forEach(function (el) { io.observe(el); });
  }

  /* ------------------------------------------------------------ tema */
  var themeBtn = $("#theme");
  var theme = "light";
  try { theme = localStorage.getItem("lds-guide:theme") === "dark" ? "dark" : "light"; } catch (e) { /* ignoreras */ }
  function applyTheme() {
    if (theme === "dark") document.documentElement.dataset.theme = "dark";
    else delete document.documentElement.dataset.theme;
    themeBtn.textContent = "Tema: " + (theme === "dark" ? "mörkt" : "ljust");
  }
  themeBtn.addEventListener("click", function () {
    theme = theme === "dark" ? "light" : "dark";
    try { localStorage.setItem("lds-guide:theme", theme); } catch (e) { /* ignoreras */ }
    applyTheme();
  });
  applyTheme();

  /* ------------------------------------------------------------ fäll undan sidopanelen */
  var sideCollapse = $("#side-collapse");
  var sideExpand = $("#side-expand");
  function setSidebarHidden(hidden) {
    document.body.classList.toggle("side-hidden", hidden);
    sideCollapse.setAttribute("aria-expanded", String(!hidden));
    sideExpand.setAttribute("aria-expanded", String(!hidden));
    store.set("sideHidden", hidden);
  }
  setSidebarHidden(store.get("sideHidden", false));
  sideCollapse.addEventListener("click", function () {
    if (document.body.classList.contains("nav-open")) {   /* smal skärm: stäng bara panelen */
      document.body.classList.remove("nav-open");
      $(".nav-toggle").setAttribute("aria-expanded", "false");
      return;
    }
    setSidebarHidden(true);
    sideExpand.focus({ preventScroll: true });
  });
  sideExpand.addEventListener("click", function () {
    setSidebarHidden(false);
    sideCollapse.focus({ preventScroll: true });
  });

  /* ------------------------------------------------------------ meny på smal skärm */
  var navToggle = $(".nav-toggle");
  navToggle.addEventListener("click", function () {
    var open = document.body.classList.toggle("nav-open");
    navToggle.setAttribute("aria-expanded", String(open));
  });

  render();
})();
