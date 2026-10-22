/* Bygger sidans innehåll från window.GUIDE (guide.js). Körs före script.js. */
(function () {
  "use strict";
  var G = window.GUIDE;
  var root = document.getElementById("guide-root");
  if (!G || !root) { if (root) root.innerHTML = "<p>guide.js saknas. Kör: python docx2guide.py din-guide.docx</p>"; return; }
  var e = function (s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;"); };
  var total = 0, toc = "", main = "";
  G.chapters.forEach(function (c, ci) {
    var cn = ci + 1, hasParts = c.parts.length > 0, ptoc = "";
    main += '<section class="chapter" id="' + c.id + '"><h2>' + cn + ". " + e(c.title) + "</h2>\n" + c.intro.join("\n");
    c.parts.forEach(function (p, pi) {
      var pn = cn + "." + (pi + 1), k = 0, n = 0, body = "";
      p.groups.forEach(function (g) {
        body += "<h4>" + e(g.heading) + "</h4>" + (g.lead || []).join("\n") + '<ol class="steps">\n';
        g.steps.forEach(function (s) {
          var num = pn + "." + (++k); n++;
          body += '<li class="step" id="' + s.id + '" data-step="' + s.id + '"><button type="button" class="tick" role="checkbox" aria-checked="false" aria-label="Markera steg ' + num +
            ' som klart"></button><a class="step-num" href="#' + s.id + '">' + num + '</a><div class="step-body">' + s.html + "</div></li>\n";
        });
        body += "</ol>\n";
      });
      total += n;
      main += '<section class="part" id="' + p.id + '" data-part="' + p.id + '">\n<h3 class="part-head"><button type="button" class="part-toggle" aria-expanded="true" aria-controls="' + p.id +
        '-body"><span class="chev" aria-hidden="true"></span><span class="num">' + pn + ".0</span> " + e(p.title) + '</button><span class="part-count" aria-label="Klara steg">0/' + n +
        '</span></h3>\n<div class="part-body" id="' + p.id + '-body">\n' + p.intro.join("\n") + body + "</div></section>\n";
      ptoc += '<li data-toc="' + p.id + '"><a href="#' + p.id + '"><span class="toc-num">' + pn + '</span><span class="toc-title">' + e(p.title) + '</span></a><span class="toc-count">0/' + n + "</span></li>";
    });
    main += "</section>\n";
    toc += '<li data-toc="' + c.id + '"><a href="#' + c.id + '"><span class="toc-num">' + cn + '</span><span class="toc-title">' + e(c.title) + "</span></a>" + (hasParts ? "<ol>" + ptoc + "</ol>" : "") + "</li>";
  });
  root.innerHTML = '<header class="doc-head">' + (G.course ? '<p class="course">' + e(G.course) + "</p>" : "") + "<h1>" + e(G.title) + "</h1>" +
    (G.meta ? '<p class="meta">' + e(G.meta) + "</p>" : "") + (G.authors ? '<p class="authors">' + e(G.authors) + "</p>" : "") + "</header>\n" + main;
  document.querySelector(".toc").innerHTML = "<ol>" + toc + "</ol>";
  document.title = G.title;
  [[".topbar-title", G.title], [".side-title", G.title], [".side-course", G.course]].forEach(function (x) { var el = document.querySelector(x[0]); if (el) el.textContent = x[1]; });
  Array.prototype.forEach.call(document.querySelectorAll("[data-progress-text]"), function (el) { el.textContent = "0 av " + total; });
})();
