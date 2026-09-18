// Product filter tabs
(function () {
  var buttons = document.querySelectorAll("[data-filter]");
  var cards = document.querySelectorAll("[data-category]");

  buttons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var filter = btn.getAttribute("data-filter");
      buttons.forEach(function (b) {
        b.setAttribute("aria-pressed", String(b === btn));
      });
      cards.forEach(function (card) {
        card.hidden = filter !== "all" && card.getAttribute("data-category") !== filter;
      });
    });
  });
})();

// Email forms
// TODO: replace the placeholder below with a real submit (fetch to your waitlist/newsletter endpoint).
// Until then this only shows a confirmation and does NOT store the address.
(function () {
  document.querySelectorAll("form[data-form]").forEach(function (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var status = form.parentElement.querySelector("[data-status]");
      if (status) {
        status.textContent = "Confirmed ✓ We'll be in touch.";
        setTimeout(function () {
          status.textContent = "";
        }, 4000);
      }
      form.reset();
    });
  });
})();

// ROI calculator: cost of repetitive tasks
(function () {
  var form = document.getElementById("calc-form");
  if (!form) return;

  var gbp = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 });
  var DAYS_PER_WEEK = 5;
  var WEEKS_PER_YEAR = 46;
  var OS_SETUP = 2000;
  var OS_MONTHLY = 299;
  var $ = function (id) { return document.getElementById(id); };
  var num = function (el, max) {
    var v = parseFloat(el.value);
    if (!isFinite(v) || v < 0) v = 0;
    return max ? Math.min(v, max) : v;
  };
  var trim = function (n) { return String(Math.round(n * 10) / 10); };

  function update() {
    var people = num($("calc-people"));
    var wage = num($("calc-wage"));
    var hours = num($("calc-hours"), 12);

    var hoursWeek = people * hours * DAYS_PER_WEEK;
    var week = hoursWeek * wage;
    var year = week * WEEKS_PER_YEAR;
    var month = year / 12;

    $("calc-month").textContent = gbp.format(month);
    $("calc-week").textContent = gbp.format(week);
    $("calc-year").textContent = gbp.format(year);
    $("calc-hoursweek").textContent = trim(hoursWeek);
    $("calc-note").textContent =
      "Every 10% of that time you get back is worth " + gbp.format(year * 0.1) + " a year. " +
      "Operating Systems start at " + gbp.format(OS_SETUP) + " plus " + gbp.format(OS_MONTHLY) + "/month.";
  }

  form.addEventListener("input", update);
  form.addEventListener("submit", function (e) { e.preventDefault(); });
  update();
})();

// Demo window tabs
(function () {
  var tabs = document.querySelectorAll(".mac [data-tab]");
  var panels = document.querySelectorAll(".mac [data-panel]");
  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      var target = tab.getAttribute("data-tab");
      tabs.forEach(function (t) { t.setAttribute("aria-pressed", String(t === tab)); });
      panels.forEach(function (p) { p.hidden = p.getAttribute("data-panel") !== target; });
    });
  });
})();
