// Coordenadas orientativas para una maqueta en Santa Cruz de la Sierra.
// Las líneas y recorridos son ilustrativos, NO rutas oficiales.
const places = {
  "Plaza 24 de Septiembre": [-17.7833, -63.1821],
  "Universidad Autónoma Gabriel René Moreno": [-17.7769, -63.1950],
  "Terminal Bimodal": [-17.8005, -63.1755],
  "Mercado Los Pozos": [-17.7870, -63.1780],
  "Plan 3000": [-17.8315, -63.1395],
  "Cine Center": [-17.7952, -63.1808],
  "Parque Urbano": [-17.7798, -63.1884],
  "Hospital Japonés": [-17.7585, -63.1675]
};

const routeTemplates = [
  {id:1,mode:"Combinado",lines:[{name:"Línea 21",color:"#1479ed"},{name:"Línea 17",color:"#bd35c9"}],minutes:18,walk:1.2,wait:4,stops:7,transfers:1,coords:[[-17.7833,-63.1821],[-17.7820,-63.1860],[-17.7790,-63.1900],[-17.7769,-63.1950]]},
  {id:2,mode:"Linea",lines:[{name:"Línea 21",color:"#1479ed"}],minutes:22,walk:1.4,wait:6,stops:8,transfers:0,coords:[[-17.7833,-63.1821],[-17.7815,-63.1870],[-17.7790,-63.1910],[-17.7769,-63.1950]]},
  {id:3,mode:"Linea",lines:[{name:"Línea 56",color:"#0ba86b"},{name:"Línea 10",color:"#e64d4d"}],minutes:25,walk:1.6,wait:8,stops:10,transfers:1,coords:[[-17.7833,-63.1821],[-17.7890,-63.1800],[-17.7900,-63.1870],[-17.7835,-63.1920],[-17.7769,-63.1950]]},
  {id:4,mode:"Trufi",lines:[{name:"Trufi",color:"#ff941f"},{name:"Línea 21",color:"#1479ed"}],minutes:27,walk:1.8,wait:12,stops:6,transfers:1,coords:[[-17.7833,-63.1821],[-17.7860,-63.1860],[-17.7810,-63.1920],[-17.7769,-63.1950]]}
];

const $ = id => document.getElementById(id);
const originInput = $("origin");
const destinationInput = $("destination");
const map = L.map("map",{zoomControl:true}).setView([-17.7835,-63.1845],14);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{
  maxZoom:19,
  attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>'
}).addTo(map);

let routeLayers=[];
let markerLayers=[];
let activeFilter="Todos";
let currentRoutes=routeTemplates.map(route=>({...route,coords:route.coords.map(p=>[...p])}));
let selectedId=1;

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
}
function coordinateFor(name,index) {
  const exact=Object.keys(places).find(key=>key.toLowerCase()===name.trim().toLowerCase());
  if (exact) return places[exact];
  return [-17.7833+index*0.0012,-63.1821+index*0.0014];
}
function makeRoutes(origin,destination) {
  const start=coordinateFor(origin,0), end=coordinateFor(destination,1);
  return routeTemplates.map(route=>({...route,coords:[start,...route.coords.slice(1,-1),end],_origin:origin,_destination:destination}));
}
function getVisibleRoutes() {
  let list=currentRoutes.filter(route=>activeFilter==="Todos"||route.mode===activeFilter||
    (activeFilter==="Combinado"&&route.lines.length>1));
  const sort=$("sortSelect").value;
  if(sort==="time") list.sort((a,b)=>a.minutes-b.minutes);
  if(sort==="walk") list.sort((a,b)=>a.walk-b.walk);
  if(sort==="transfers") list.sort((a,b)=>a.transfers-b.transfers||a.minutes-b.minutes);
  return list;
}
function renderResults() {
  const list=getVisibleRoutes();
  $("resultStatus").textContent=`${list.length} opción${list.length===1?"":"es"} de demostración · Santa Cruz de la Sierra`;
  const results=$("results");
  if(!list.length) {
    results.innerHTML='<div class="empty">No hay opciones para este filtro. Prueba con “Todas” para ver los recorridos de ejemplo.</div>';
    return;
  }
  results.innerHTML=list.map((route,index)=>`
    <button class="route-card ${route.id===selectedId?"selected":""}" type="button" data-route-id="${route.id}">
      <div class="card-top">
        <div>${index===0?'<div class="recommend">✦ RECOMENDADA · DEMO</div>':""}
          <div class="line-row">${route.lines.map((line,i)=>`${i?'<span class="arrow">→</span>':""}<span class="line-pill" style="background:${line.color}">${escapeHTML(line.name)}</span>`).join("")}</div>
        </div>
        <div class="time">${route.minutes} min<small>🚶 ${route.walk.toFixed(1)} km a pie</small></div>
      </div>
      <div class="card-foot"><span>Sale en ${route.wait} min · ${route.stops} paradas</span><strong>${route.transfers===0?"Directo":route.transfers+" transbordo"+(route.transfers>1?"s":"")}　›</strong></div>
    </button>`).join("");
  results.querySelectorAll("[data-route-id]").forEach(button=>button.addEventListener("click",()=>{
    selectedId=Number(button.dataset.routeId);
    renderResults(); drawMap();
  }));
}
function clearLayers() {
  [...routeLayers,...markerLayers].forEach(layer=>map.removeLayer(layer));
  routeLayers=[]; markerLayers=[];
}
function drawMap() {
  clearLayers();
  const route=currentRoutes.find(r=>r.id===selectedId)||getVisibleRoutes()[0]||currentRoutes[0];
  if(!route) return;
  const coords=route.coords;
  if(coords.length>2) {
    const split=Math.max(2,Math.ceil(coords.length*.58));
    routeLayers.push(L.polyline(coords.slice(0,split),{color:"#1479ed",weight:6,opacity:.95,lineCap:"round"}).addTo(map));
    if(split<coords.length) routeLayers.push(L.polyline(coords.slice(split-1),{color:"#bd35c9",weight:6,opacity:.95}).addTo(map));
  } else {
    routeLayers.push(L.polyline(coords,{color:"#1479ed",weight:6,opacity:.95}).addTo(map));
  }
  coords.slice(1,-1).forEach((point,i)=>{
    const marker=L.circleMarker(point,{radius:5,color:"#fff",weight:2,fillColor:i===0?"#bd35c9":"#1479ed",fillOpacity:1}).addTo(map);
    marker.bindPopup(`<strong>Parada de ejemplo ${i+1}</strong><br>Ubicación ilustrativa, no oficial.`);
    markerLayers.push(marker);
  });
  const startIcon=L.divIcon({className:"",html:'<div style="width:22px;height:22px;border:4px solid white;border-radius:50%;background:#0ba86b;box-shadow:0 2px 8px #0004"></div>',iconSize:[22,22],iconAnchor:[11,11]});
  const endIcon=L.divIcon({className:"",html:'<div style="width:22px;height:22px;border:4px solid white;border-radius:50%;background:#e83c5b;box-shadow:0 2px 8px #0004"></div>',iconSize:[22,22],iconAnchor:[11,11]});
  markerLayers.push(L.marker(coords[0],{icon:startIcon}).addTo(map).bindPopup(`<strong>Origen</strong><br>${escapeHTML(originInput.value)}`));
  markerLayers.push(L.marker(coords[coords.length-1],{icon:endIcon}).addTo(map).bindPopup(`<strong>Destino</strong><br>${escapeHTML(destinationInput.value)}`));
  map.fitBounds(L.latLngBounds(coords).pad(.22),{maxZoom:15});
  $("mapSummary").textContent=`${route.minutes} min · ${route.lines.map(l=>l.name).join(" → ")}`;
}
function runSearch() {
  const origin=originInput.value.trim(),destination=destinationInput.value.trim();
  if(!origin||!destination) { alert("Escribe un origen y un destino para buscar.");return; }
  if(origin.toLowerCase()===destination.toLowerCase()) { alert("El origen y el destino son iguales. Cambia uno de los lugares.");return; }
  currentRoutes=makeRoutes(origin,destination);
  if(activeFilter!=="Todos"&&!currentRoutes.some(r=>r.mode===activeFilter)) activeFilter="Todos";
  document.querySelectorAll(".filter").forEach(btn=>btn.classList.toggle("active",btn.dataset.filter===activeFilter));
  selectedId=getVisibleRoutes()[0]?.id||1;
  renderResults();drawMap();
  $("resultStatus").textContent="Búsqueda de demostración: confirma las rutas reales antes de viajar.";
  localStorage.setItem("tpp-last-search",JSON.stringify({origin,destination}));
}

$("searchForm").addEventListener("submit",event=>{event.preventDefault();runSearch();});
$("swapBtn").addEventListener("click",()=>{
  const old=originInput.value;originInput.value=destinationInput.value;destinationInput.value=old;
});
document.querySelectorAll("[data-clear]").forEach(btn=>btn.addEventListener("click",()=>{
  const input=$(btn.dataset.clear);input.value="";input.focus();
}));
document.querySelectorAll(".filter").forEach(btn=>btn.addEventListener("click",()=>{
  activeFilter=btn.dataset.filter;
  document.querySelectorAll(".filter").forEach(item=>item.classList.toggle("active",item===btn));
  const visible=getVisibleRoutes();
  if(visible.length&&!visible.some(route=>route.id===selectedId)) selectedId=visible[0].id;
  renderResults();drawMap();
}));
$("sortSelect").addEventListener("change",()=>{renderResults();drawMap();});
$("favoritesBtn").addEventListener("click",()=>alert("En esta versión MVP, los favoritos están pendientes de implementación."));
$("historyBtn").addEventListener("click",()=>{
  const saved=localStorage.getItem("tpp-last-search");
  if(!saved) { alert("Todavía no hay búsquedas guardadas en este navegador.");return; }
  const last=JSON.parse(saved);originInput.value=last.origin;destinationInput.value=last.destination;runSearch();
});
$("showMapBtn").addEventListener("click",()=>document.querySelector(".map-area").scrollIntoView({behavior:"smooth"}));

renderResults();
drawMap();
setTimeout(()=>map.invalidateSize(),150);
window.addEventListener("resize",()=>map.invalidateSize());
