// Markup the dashboard script (served by the camera server) renders into.
//
// Every container the script fills is pre-filled here with a placeholder shaped like real
// content (same labels, typical text lengths, `.sk` = grey bar with invisible text), so the
// page has its final size before the data arrives and nothing jumps when it does. The script
// overwrites these with innerHTML/textContent, so the placeholders vanish on first render.

const sk = (t: string) => `<span class="sk">${t}</span>`;
const pill = (t: string) => `<span class="pill off sk">${t}</span>`;
const row = (k: string, v: string) => `<div class="row"><span class="k">${k}</span><span class="v">${v}</span></div>`;
const stat = (k: string, v: string, s: string) =>
  `<div class="stat"><div class="k">${k}</div><div class="v">${sk(v)}</div><div class="s">${sk(s)}</div></div>`;
const tile = (z: number) => `<div class="tile" style="border-top:3px solid var(--line)">
      <div class="nm"><span>Zone ${z}</span>${pill("on target")}</div>
      <div class="big">${sk("21.0°C")}<small>${sk("set 21.0° · +0.0°")}</small></div>
      <div class="sub">${sk("Home · heat · 50% RH")}</div>
    </div>`;
const loadingRow = (cols: number) => `<tr class="ph"><td colspan="${cols}">Loading…</td></tr>`;

const STATS = [
  stat("Last reading", "10:40 AM", "today · 2 min ago"),
  stat("Coverage", "97%", "654 of ~673 expected · every 15 min"),
  stat("Temp range", "23.3–75.6°C", "in window"),
  stat("Burner firing", "144/654", "heat call 162 · DHW call 12"),
  stat("Model spend", "$10/mo", "$0.33/day · 32 checks in 24 h (Opus 4, Sonnet 28) · pixels trusted 5/5 fields"),
  stat("Outdoor now", "6.8°C", "feels 4.8° · 95% RH · wind 7.3 km/h · fog"),
].join("");

const BOILER_ROWS = [
  row("Temperature", sk("42.8°C")),
  row("Mode", sk("idle")),
  row("Burner", pill("off")),
  row("Pumps", `${sk("boiler")} ${pill("off")} ${sk("· CH")} ${pill("off")} ${sk("· DHW")} ${pill("off")}`),
  row("Screen clock", sk("—")),
  row("Other icons", `<span class="icons">${pill("((o)) comm")}${pill("house: outdoor reset")}</span>`),
  row("Errors", pill("none")),
  row("Screen", pill("legible")),
].join("");

const ZONE_ROWS = [
  row("Power", `${pill("ON")} ${sk("100% white")}`),
  row("Zone 1", `${sk("■ 21.0°/21.0° ok")} ${pill("off")} ${sk("0% white")}`),
  row("Zone 2", `${sk("■ 21.0°/21.0° ok")} ${pill("off")} ${sk("0% white")}`),
  row("Zone 3", `${sk("■ 21.0°/21.0° ok")} ${pill("off")} ${sk("0% white")}`),
  row("Zone 4 / priority", `${pill("off")} ${sk("0% white")}`),
  row("Read by", sk("pixels")),
].join("");

export const MARKUP = `
<div class="dash">
  <div class="sub" id="sub">Loading…</div>
  <div class="banner wait" id="banner">Checking the latest readings…</div>

  <div class="stats" id="stats">${STATS}</div>

  <!-- LIVE NOW -->
  <div class="cards">
    <div class="cam">
      <h2>Boiler <span id="b-mode" class="pill off">—</span></h2>
      <img id="b-img" alt="boiler" src="/heating/stills/boiler_latest.jpg">
      <div class="rows" id="b-rows">${BOILER_ROWS}</div>
    </div>
    <div class="cam">
      <h2>Zone controller <span class="sub" style="font-weight:400">relay LEDs · ■ paired thermostat</span> <span id="z-pwr" class="pill off">—</span></h2>
      <img id="z-img" alt="zone" src="/heating/stills/zone_latest.jpg">
      <div class="rows" id="z-rows">${ZONE_ROWS}</div>
    </div>
  </div>

  <!-- ECOBEE THERMOSTATS (shown with placeholders; the script hides it if there is no thermostat data) -->
  <div class="card" id="eco-card">
    <h2>Thermostats <span class="sub" id="eco-sub">${sk("Nov 22, 10:40 AM · all on target (2 reporting, 1 offline not counted) · below target = more than 2 °C under set-point and under 21 °C, with a 6 h grace after set-point rises")}</span></h2>
    <div class="tiles" id="eco-tiles">${tile(1)}${tile(2)}${tile(3)}</div>
  </div>

  <!-- UNIFIED TIMELINE -->
  <div class="card">
    <h2>Timeline</h2>
    <div class="ctls" id="ctls">
      <button data-h="24">24 h</button>
      <button data-h="72">3 d</button>
      <button data-h="168" class="on">7 d</button>
      <button data-h="720">30 d</button>
      <button data-h="0">All</button>
      <span class="range" id="rangeLbl">${sk("Nov 15, 10:47 AM → Nov 22, 10:40 AM")}</span>
    </div>
    <div id="tl"><div class="tip" id="tip"></div></div>
    <div class="lgnd">
      <span><i class="sw" style="background:#ff7a1a"></i>burner / fan / heat call / thermostat calling</span>
      <span><i class="sw" style="background:#0a84ff"></i>DHW</span>
      <span><i class="sw" style="background:#5e5ce6"></i>outdoor °C</span>
      <span><i class="sw" style="background:#34c759"></i>pump or zone relay on</span>
      <span><i class="sw" style="background:#ff3b30"></i>error / screen unreadable</span>
      <span><i class="sw" style="background:var(--nodata)"></i>shaded = that source had no data (camera slot missed, thermostat not logged)</span>
      <span>empty track = off · dotted line end = last value held until the next sample</span>
    </div>
  </div>

  <!-- ALERT HISTORY -->
  <div class="card">
    <h2>Alert history</h2>
    <div class="tbl-wrap"><table><thead><tr>
      <th>Time</th><th>Type</th><th>Delivery</th><th>Details</th><th>Screen</th>
    </tr></thead><tbody id="abody">${loadingRow(5)}</tbody></table></div>
  </div>

  <!-- TABLE -->
  <div class="card">
    <h2>Readings <span class="sub">(click a row for the full detail)</span></h2>
    <div class="tbl-wrap"><table><thead><tr>
      <th>Time</th><th>Temp °C</th><th>Mode</th><th>Flame</th><th>Fan</th><th>Pumps B·CH·DHW</th><th>Errors</th>
      <th>Pwr</th><th title="relay LED · thermostat temp (▲ = calling)">Z1</th><th>Z2</th><th>Z3</th><th>Z4</th><th>Zone via</th><th>Model</th><th>Tokens</th>
    </tr></thead><tbody id="tbody">${loadingRow(15)}</tbody></table></div>
  </div>

</div>`;
