// ADVERTENCIA DE SEGURIDAD:
// Las credenciales estan hardcodeadas en el navegador (INSEGURO).
// TODO: Implementar autenticacion en backend (Node.js, Firebase, etc.)

// USUARIOS
const usuariosSistema = {
  luis:"123",
  katy:"123",
  katherine:"123",
  richard:"123",
  dante:"admin123"
};
const userProfiles = {
  luis: { nombre: "LUIS ANGEL ALATA", celular: "+51963963963" },
  katy: { nombre: "KATHERINE JAYO CANGRE", celular: "+51911122233" },
  katherine: { nombre: "KATHERINE APELLIDO", celular: "+51922233344" },
  richard: { nombre: "RICHARD APELLIDO", celular: "+51933344455" },
  dante: { nombre: "DANTE ADMINISTRADOR", celular: "+51922464915" }
};
const admins = ["dante"];

let inventario=[];
let CARRITO=[];
let currentDetailId=null;
let selectedVariantIndex=0;
let currentMode="venta";
let descuentoActual = 0;
let voucherReference = null;
let voucherFechaTexto = null;
let voucherTipoTexto = null;
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxe3MPdRwo8AY1OpFqNwuOcryv09ePGetGHgyDghIIn250LA5dntNjvCuje5i9gRWMX9g/exec';
let ultimoJSONVenta = null;

async function enviarDatosASheets(accion, datos) {
  try {
    const payload = { accion, ...datos };
    await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return true;
  } catch (error) {
    console.error('Error enviando datos a Google Sheets:', error);
    return false;
  }
}

function guardarUsuario(){

  const userInput = document.getElementById('usuario');
  const passInput = document.getElementById('password');
  const errorElement = document.getElementById('errorLogin');
  
  if(!userInput || !passInput || !errorElement) {
    console.error('Elementos del login no encontrados');
    return;
  }
  
  const user = (userInput.value || '').toLowerCase().trim();
  const pass = passInput.value || '';

  if(!user) return errorElement.innerText="Ingrese usuario";
  if(!pass) return errorElement.innerText="Ingrese contraseña";
  if(!usuariosSistema[user]) return errorElement.innerText="Usuario no registrado";
  if(usuariosSistema[user]!==pass) return errorElement.innerText="Contraseña incorrecta";

  localStorage.setItem("usuario",user);
  location.reload();
}

function cerrarSesion(){
  localStorage.removeItem("usuario");
  location.reload();
}

window.onload=()=>{
  try {
    const user = localStorage.getItem("usuario");
    const profile = userProfiles[user] || { nombre: user ? user.toUpperCase() : "INVITADO", celular: "+51922464915" };

    const loginEl = document.getElementById('login');
    const appEl = document.getElementById('app');
    
    if(loginEl) loginEl.style.display = user ? "none" : "flex";
    if(appEl) appEl.style.display = user ? "block" : "none";
    if(document.getElementById("footer-nav")) document.getElementById("footer-nav").style.display = "none";
    if(document.getElementById("detalle-view")) document.getElementById("detalle-view").style.display = "none";
    if(document.getElementById("carrito-view")) document.getElementById("carrito-view").style.display = "none";
    if(document.getElementById("voucher-view")) document.getElementById("voucher-view").style.display = "none";
    const btnBack = document.getElementById("btn-back");
    if(btnBack) btnBack.onclick = inicio;
    const btnNext = document.getElementById("btn-next");
    if(btnNext) btnNext.style.display = "none";

    if(user){
      const userName = document.getElementById("user-name");
      const userCell = document.getElementById("user-cell");
      const panelBtn = document.getElementById("panelBtn");
      
      if(userName) userName.innerText = profile.nombre;
      if(userCell) userCell.innerText = profile.celular;
      if(panelBtn) {
        if(admins.includes(user)){
          panelBtn.classList.add('visible');
        } else {
          panelBtn.classList.remove('visible');
        }
      }
      cargarInventario();
    }
  } catch(error) {
    console.error('Error en window.onload:', error);
    if(typeof showMessage === 'function') showMessage('Error inicializando aplicacion', 'error');
  }
};

const urlInv="https://opensheet.elk.sh/197The7KApBX0G_p9PCTiAAWZ1oBMLDWQEZIeUDHgXpE/INVENTARIO";

async function cargarInventario(){
  try {
    const r = await fetch(urlInv);
    if(!r.ok) throw new Error(`Error: ${r.status}`);
    
    const d = await r.json();
    if(!Array.isArray(d) || d.length===0) {
      throw new Error('Datos inválidos del servidor');
    }
    
    inventario = d.map(p => {
      let o = {};
      Object.keys(p).forEach(k => o[k.toLowerCase().trim()] = p[k]);
      return {
        id: o.id,
        producto: o.producto,
        categoria: (o.categoria || "").toUpperCase(),
        talla: o.talla,
        color: o.color,
        stock: parseInt(o.stock) || 0,
        unidad: parseFloat(o["p.unidad"]) || 0,
        docena: parseFloat(o["p.docena"]) || 0,
        imagen: o.imagen
      };
    });
  } catch (error) {
    console.error('Error cargando inventario:', error);
    showMessage('Error cargando inventario. Intenta recargar.', 'error');
    inventario = [];
  }
}

function recargarInventario(){
  cargarInventario()
    .then(() => {
      showMessage('Inventario recargado', 'success');
      inicio();
    })
    .catch(() => {
      showMessage('No se pudo recargar el inventario', 'error');
    });
}

function inicio(){
  menu.style.display="grid";
  productos.style.display="none";
  document.getElementById("detalle-view").style.display = "none";
  document.getElementById("carrito-view").style.display = "none";
  document.getElementById("voucher-view").style.display = "none";
  document.getElementById("panel").style.display = "none";
  document.getElementById("footer-nav").style.display = "none";
}

function abrir(cat){
  menu.style.display="none";
  productos.style.display="grid";
  document.getElementById("detalle-view").style.display = "none";
  document.getElementById("carrito-view").style.display = "none";
  document.getElementById("voucher-view").style.display = "none";
  document.getElementById("panel").style.display = "none";
  document.getElementById("footer-nav").style.display = "grid";
  document.getElementById("btn-back").onclick = inicio;
  document.getElementById("btn-back").innerText = "← Volver";
  document.getElementById("btn-next").style.display = "none";

  const filtrados = inventario.filter(p => p.categoria===cat && p.stock>0);
  const unicos = {};
  filtrados.forEach(p => { if(!unicos[p.id]) unicos[p.id]=p; });
  render(Object.values(unicos));
}

function render(lista){
  let html="";
  lista.forEach(p=>{
    const imgSrc = p.imagen ? `${p.imagen}&sz=200` : 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%23333%22 width=%22200%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22 font-size=%2214%22%3ESin Imagen%3C/text%3E%3C/svg%3E';
    html+=`
    <div class="card" onclick="verProducto('${p.id}')">
      <img src="${imgSrc}" alt="${p.producto}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22150%22 height=%22150%22%3E%3Crect fill=%22%23333%22 width=%22150%22 height=%22150%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22 font-size=%2212%22%3E${p.producto}%3C/text%3E%3C/svg%3E'">
      <h3>${p.producto}</h3>
      <p style="color:lime;">S/ ${p.unidad}</p>
    </div>`;
  });
  productos.innerHTML=html;
}

function verProducto(id){
  currentDetailId = id;
  selectedVariantIndex = 0;
  document.getElementById("detalle-view").style.display = "block";
  document.getElementById("carrito-view").style.display = "none";
  document.getElementById("voucher-view").style.display = "none";
  document.getElementById("panel").style.display = "none";
  menu.style.display = "none";
  productos.style.display = "none";
  document.getElementById("footer-nav").style.display = "grid";
  const producto = inventario.find(item => item.id == id);
  document.getElementById("btn-back").style.display = "inline-block";
  document.getElementById("btn-back").onclick = () => abrir(producto?.categoria || 'INVIERNO');
  document.getElementById("btn-back").innerText = "← Volver";
  document.getElementById("btn-next").style.display = "inline-block";
  document.getElementById("btn-next").onclick = () => agregarAlCarrito();
  document.getElementById("btn-next").innerText = "Añadir al carrito";
  renderDetalle();
}

function renderDetalle(){
  const todasVariantes = inventario.filter(p => p.id==currentDetailId && p.stock>0);
  if(!todasVariantes.length){
    inicio();
    return;
  }

  const producto = todasVariantes[0];
  const imgSrc = producto.imagen ? `${producto.imagen}&sz=300` : 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22300%22%3E%3Crect fill=%22%23333%22 width=%22300%22 height=%22300%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22 font-size=%2220%22%3E${producto.producto}%3C/text%3E%3C/svg%3E';
  const tallas = [...new Set(todasVariantes.map(v => v.talla))];
  const tallaSeleccionada = document.getElementById("tallaSelect")?.value || "TODAS";
  const variantes = tallaSeleccionada === "TODAS" ? todasVariantes : todasVariantes.filter(v => v.talla === tallaSeleccionada);
  const stockTotal = todasVariantes.reduce((sum, item) => sum + item.stock, 0);
  const stockFiltrado = variantes.reduce((sum, item) => sum + item.stock, 0);

  const opcionesTalla = tallas.map(t => `<option value="${t}" ${t === tallaSeleccionada ? 'selected' : ''}>${t}</option>`).join("");
  const opciones = `
    ${opcionesTalla}
    <option value="TODAS" ${tallaSeleccionada === 'TODAS' ? 'selected' : ''}>TODAS</option>
  `;

  let filas = `
    <tr>
      <th>Agregar</th><th>TALLA</th><th>COLOR</th><th>STOCK</th><th>P.UNIDAD</th><th>P.DOCENA</th>
    </tr>
  `;

  variantes.forEach((v, index) => {
    const checked = index === selectedVariantIndex ? 'checked' : '';
    filas += `
      <tr>
        <td><input type="radio" name="variant" value="${index}" ${checked} onchange="seleccionarVariante(${index})"></td>
        <td>${v.talla}</td>
        <td>${v.color}</td>
        <td>${v.stock}</td>
        <td>S/ ${v.unidad}</td>
        <td>S/ ${v.docena}</td>
      </tr>
    `;
  });

  document.getElementById("detalle-content").innerHTML = `
    <div class="detalle-card">
      <img class="detalle-img" src="${producto.imagen ? producto.imagen + '&sz=300' : 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22300%22%3E%3Crect fill=%22%23333%22 width=%22300%22 height=%22300%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22 font-size=%2220%22%3E${producto.producto}%3C/text%3E%3C/svg%3E'}" alt="${producto.producto}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22300%22%3E%3Crect fill=%22%23333%22 width=%22300%22 height=%22300%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22%3EImagen no disponible%3C/text%3E%3C/svg%3E'">
      <h2>${producto.producto}</h2>
      <div class="fila-opciones">
        <div>
          🧵 TALLAS
          <select id="tallaSelect" onchange="cambiarTalla()">
            ${opciones}
          </select>
        </div>
        <div>
          📦 STOCK
          <span class="stock" id="stockTalla">${stockFiltrado}</span>
        </div>
        <div>
          📊 TOTAL
          <span class="total">${stockTotal}</span>
        </div>
      </div>
      <table id="tablaDetalle">${filas}</table>
    </div>
  `;
}

function cambiarTalla(){
  selectedVariantIndex = 0;
  renderDetalle();
}

function seleccionarVariante(index){
  selectedVariantIndex = index;
  renderDetalle();
}

function agregarAlCarrito(){
  const todasVariantes = inventario.filter(p => p.id==currentDetailId && p.stock>0);
  if(!todasVariantes.length) return showMessage('No hay stock disponible', 'error');
  const tallaSeleccionada = document.getElementById("tallaSelect")?.value || "TODAS";
  const variantes = tallaSeleccionada === "TODAS" ? todasVariantes : todasVariantes.filter(v => v.talla === tallaSeleccionada);
  const variante = variantes[selectedVariantIndex] || variantes[0];
  if(!variante) return showMessage('Selecciona una variante', 'error');

  if(variante.stock < 1) return showMessage('No hay stock', 'error');

  const existente = CARRITO.find(item => item.id===variante.id && item.talla===variante.talla && item.color===variante.color);
  if(existente){
    existente.cant += 1;
  } else {
    CARRITO.push({ ...variante, cant: 1 });
  }

  variante.stock -= 1;
  if(variante.stock <= 0){
    selectedVariantIndex = 0;
  }

  document.getElementById("count").innerText = CARRITO.length;
  showMessage('Se añadió al carrito', 'success');
  renderDetalle();
}

function showMessage(text, type){
  let message = document.getElementById('app-message');
  if(!message){
    message = document.createElement('div');
    message.id = 'app-message';
    document.body.appendChild(message);
  }
  message.className = `notice ${type}`;
  message.innerText = text;
  message.style.display = 'inline-block';
  setTimeout(()=>{ message.style.display='none'; }, 2200);
}

function verCarrito(){
  document.getElementById("carrito-view").style.display = "block";
  document.getElementById("detalle-view").style.display = "none";
  document.getElementById("voucher-view").style.display = "none";
  document.getElementById("panel").style.display = "none";
  menu.style.display = "none";
  productos.style.display = "none";
  document.getElementById("footer-nav").style.display = "none";
  renderCarrito();
}

function obtenerPrecioUnitario(item){
  const precioVenta = item.precioVenta != null ? Number(item.precioVenta) : null;
  if(precioVenta != null) return precioVenta;

  const precio = item.precio != null ? Number(item.precio) : null;
  if(precio != null) return precio;

  const precioUnitario = Number(item.unidad || 0);
  const precioDocena = Number(item.docena || 0);
  const cantidad = Number(item.cantidad ?? item.cant ?? 0);

  if(precioDocena > 0) {
    const cantidadMismoDocena = CARRITO.reduce((sum, cartItem) => {
      const mismoId = cartItem.id === item.id;
      const mismoDocena = Number(cartItem.docena || 0) === precioDocena;
      return sum + ((mismoId && mismoDocena) ? Number(cartItem.cantidad ?? cartItem.cant ?? 0) : 0);
    }, 0);

    if(cantidadMismoDocena >= 12) {
      return precioDocena;
    }
  }

  return precioUnitario;
}

function obtenerTotalProducto(item){
  const precioUnit = obtenerPrecioUnitario(item);
  const cantidad = Number(item.cantidad ?? item.cant ?? 0);
  return Math.round((precioUnit * cantidad) * 100) / 100;
}

function calcularPrecioItem(item){
  return obtenerTotalProducto(item);
}

function calcularTotalesVenta(){
  let subtotalOriginal = 0;
  CARRITO.forEach(item => {
    const precioUnit = obtenerPrecioUnitario(item);
    subtotalOriginal += precioUnit * item.cant;
  });
  
  const descuento = descuentoActual || 0;
  const subtotalConDescuento = Math.max(0, subtotalOriginal - descuento);
  const factor = subtotalOriginal > 0 ? subtotalConDescuento / subtotalOriginal : 1;
  const igv = Math.round(subtotalConDescuento * 0.18 * 100) / 100;
  const totalConDescuento = subtotalConDescuento + igv;
  
  return {
    subtotalOriginal,
    subtotal: subtotalConDescuento,
    igv,
    totalConDescuento,
    descuento,
    factor
  };
}

function renderCarrito(){
  if(CARRITO.length===0){
    document.getElementById("cart-table").innerHTML = `<p style="text-align:center; color:#ccc;">El carrito está vacío.</p>`;
    return;
  }

  let rows = `<table><tr><th>Producto</th><th>Cantidad</th><th>Precio</th><th></th></tr>`;
  CARRITO.forEach((item, index) => {
    const precioUnit = obtenerPrecioUnitario(item);
    rows += `<tr>
      <td>${item.producto}<br><small>${item.talla} • ${item.color}</small></td>
      <td><button class="qty-btn" onclick="modificarCantidad(${index}, -1)">-</button> ${item.cant} <button class="qty-btn" onclick="modificarCantidad(${index}, 1)">+</button></td>
      <td>S/ ${precioUnit.toFixed(2)}</td>
      <td><button class="remove-btn" onclick="eliminarItem(${index})">x</button></td>
    </tr>`;
  });
  rows += `</table>`;

  const subtotal = CARRITO.reduce((sum, item) => sum + calcularPrecioItem(item), 0);
  const descuento = descuentoActual || 0;
  const total = Math.max(0, subtotal - descuento);

  rows += `<div class="cart-summary">
      <div><span>Subtotal:</span><span style="text-align:right;">S/ ${subtotal.toFixed(2)}</span></div>
      <div class="discount-row">
        <span>Descuento:</span>
        <input id="cart-discount" type="number" placeholder="S/" value="${descuento}" oninput="actualizarDescuento(this.value)" style="width:60px;">
        <button class="btn-apply" onclick="aplicarDescuento()">Aplicar</button>
      </div>
      <div><strong>Total:</strong><strong style="text-align:right; display:block;">S/ ${total.toFixed(2)}</strong></div>
    </div>`;

  document.getElementById("cart-table").innerHTML = rows;
}

function modificarCantidad(index, cambio){
  const item = CARRITO[index];
  if(!item) return;
  if(cambio === 1){
    const original = inventario.find(prod => prod.id===item.id && prod.talla===item.talla && prod.color===item.color);
    if(original && original.stock > 0){
      item.cant += 1;
      original.stock -= 1;
    } else {
      return showMessage('No hay más stock disponible', 'error');
    }
  } else {
    item.cant -= 1;
    const original = inventario.find(prod => prod.id===item.id && prod.talla===item.talla && prod.color===item.color);
    if(original) original.stock += 1;
    if(item.cant <= 0){
      CARRITO.splice(index, 1);
    }
  }
  document.getElementById("count").innerText = CARRITO.length;
  renderCarrito();
}

function eliminarItem(index){
  const item = CARRITO[index];
  if(!item) return;
  const original = inventario.find(prod => prod.id===item.id && prod.talla===item.talla && prod.color===item.color);
  if(original) original.stock += item.cant;
  CARRITO.splice(index, 1);
  document.getElementById("count").innerText = CARRITO.length;
  showMessage('Se eliminó del carrito', 'error');
  renderCarrito();
}

function actualizarDescuento(value){
  descuentoActual = parseFloat(value) || 0;
}

function aplicarDescuento(){
  descuentoActual = parseFloat(document.getElementById('cart-discount')?.value) || 0;
  renderCarrito();
  showMessage('Descuento aplicado', 'success');
}

function pagar(tipo){
  if(CARRITO.length===0) return showMessage('El carrito está vacío', 'error');
  currentMode = tipo;
  voucherReference = null;
  voucherFechaTexto = null;
  voucherTipoTexto = null;
  if(tipo === 'venta') {
    voucherReference = generarNroBoleta();
  }
  document.getElementById("carrito-view").style.display = "none";
  document.getElementById("voucher-view").style.display = "block";
  document.getElementById("detalle-view").style.display = "none";
  renderVoucher();
}

function renderVoucher(){
  const tipoTexto = currentMode === 'proforma' ? 'PROFORMA' : 'REGISTRO DE VENTA';
  voucherReference = voucherReference || generarReferencia(currentMode);
  voucherFechaTexto = voucherFechaTexto || (() => {
    const now = new Date();
    return now.toLocaleDateString('es-PE') + ' ' + now.toLocaleTimeString('es-PE', { hour: '2-digit', minute:'2-digit' });
  })();
  voucherTipoTexto = tipoTexto;

  const usuario = localStorage.getItem('usuario');
  const profile = userProfiles[usuario] || { nombre: usuario, celular: '+51922464915' };
  const numRef = voucherReference;
  const fechaTexto = voucherFechaTexto;

  const totales = calcularTotalesVenta();

  // Generar líneas de productos con detalles usando IGV inverso
  let productosHtml = '';
  productosHtml += `<div style="font-family: monospace; font-size: 11px; color: #999;">----------------------------------------------------------------------</div>`;
  productosHtml += `<div style="font-family: monospace; font-size: 11px; font-weight: bold;">DETALLES</div>`;
  productosHtml += `<div style="font-family: monospace; font-size: 11px; color: #999;">----------------------------------------------------------------------</div>`;
  
  let subtotalBaseIgv = 0;
  
  CARRITO.forEach(item => {
    const precioUnit = obtenerPrecioUnitario(item);
    const precioEfectivo = precioUnit * totales.factor;
    const totalItem = precioEfectivo * item.cant;
    
    // Precio base sin IGV (dividido por 1.18)
    const precioBaseItem = Math.round((totalItem / 1.18) * 100) / 100;
    subtotalBaseIgv += precioBaseItem;
    
    productosHtml += `<div style="font-family: monospace; font-size: 11px;">ID: ${item.id || '-'} - ${item.producto}</div>`;
    productosHtml += `<div style="font-family: monospace; font-size: 11px;">Talla ${item.talla || '-'} - Color ${item.color || '-'} - Cantidad ${item.cant} - Precio S/ ${totalItem.toFixed(2)}</div>`;
    productosHtml += `<div style="font-family: monospace; font-size: 11px; color: #999; margin-bottom: 6px;">----------------------------------------------------------------------</div>`;
  });

  // Header del voucher con alineación
  let headerHtml = `<div style="font-family: monospace; font-size: 12px; text-align: center; font-weight: bold; margin-bottom: 8px;">A&T KAMIARA S.A.C.</div>`;
  
  const ruc = `RUC: 20XXXXXXXXXX`;
  const fechaLine = `Fecha: ${fechaTexto}`;
  const spacing = ' '.repeat(Math.max(0, 45 - ruc.length - fechaLine.length));
  headerHtml += `<div style="font-family: monospace; font-size: 11px;">${ruc}${spacing}${fechaLine}</div>`;
  headerHtml += `<div style="font-family: monospace; font-size: 11px; text-align: center; margin: 4px 0;">DIRECCION: AMPLIACIÓN LOS LAURELES PAMPLONA ALTA SJM</div>`;
  headerHtml += `<div style="font-family: monospace; font-size: 11px; color: #999;">----------------------------------------------------------------------</div>`;

  const tipoLine = tipoTexto;
  const codigoLine = `CODIGO: ${numRef}`;
  const tipoSpacing = ' '.repeat(Math.max(0, 50 - tipoLine.length - codigoLine.length));
  headerHtml += `<div style="font-family: monospace; font-size: 11px; font-weight: bold;">${tipoLine}${tipoSpacing}${codigoLine}</div>`;

  const vendedorLine = profile.nombre.substring(0, 30);
  const cellLine = `CELL: ${profile.celular}`;
  const vendSpacing = ' '.repeat(Math.max(0, 50 - vendedorLine.length - cellLine.length));
  headerHtml += `<div style="font-family: monospace; font-size: 11px;">${vendedorLine}${vendSpacing}${cellLine}</div>`;
  headerHtml += `<div style="font-family: monospace; font-size: 11px; color: #999;">----------------------------------------------------------------------</div>`;

  // Footer resumen con IGV inverso
  let footerHtml = '';
  footerHtml += `<div style="font-family: monospace; font-size: 11px; color: #999; margin-top: 8px;">----------------------------------------------------------------------</div>`;
  
  // Calcular IGV sobre el subtotal base
  const igvCalculado = Math.round(subtotalBaseIgv * 0.18 * 100) / 100;
  const totalCalculado = Math.round((subtotalBaseIgv + igvCalculado) * 100) / 100;
  
  const subtotalLabel = 'SUBTOTAL';
  const subtotalVal = `S/ ${subtotalBaseIgv.toFixed(2)}`;
  const subtotalSpacing = ' '.repeat(Math.max(0, 45 - subtotalLabel.length - subtotalVal.length));
  footerHtml += `<div style="font-family: monospace; font-size: 11px;">${subtotalLabel}${subtotalSpacing}${subtotalVal}</div>`;

  const descLabel = 'DESCUENTO';
  const descVal = `S/ ${totales.descuento.toFixed(2)}`;
  const descSpacing = ' '.repeat(Math.max(0, 45 - descLabel.length - descVal.length));
  footerHtml += `<div style="font-family: monospace; font-size: 11px;">${descLabel}${descSpacing}${descVal}</div>`;

  const igvLabel = 'IGV 18%';
  const igvVal = `S/ ${igvCalculado.toFixed(2)}`;
  const igvSpacing = ' '.repeat(Math.max(0, 45 - igvLabel.length - igvVal.length));
  footerHtml += `<div style="font-family: monospace; font-size: 11px;">${igvLabel}${igvSpacing}${igvVal}</div>`;

  footerHtml += `<div style="font-family: monospace; font-size: 11px; color: #999; margin-top: 4px;">----------------------------------------------------------------------</div>`;

  const totalLabel = 'TOTAL';
  const totalVal = `S/ ${totalCalculado.toFixed(2)}`;
  const totalSpacing = ' '.repeat(Math.max(0, 45 - totalLabel.length - totalVal.length));
  footerHtml += `<div style="font-family: monospace; font-size: 11px; font-weight: bold;">${totalLabel}${totalSpacing}${totalVal}</div>`;

  footerHtml += `<div style="text-align: center; font-weight: bold; font-size: 11px; margin-top: 12px; font-family: monospace;">GRACIAS POR SU PREFERENCIA VUELVA PRONTO</div>`;

  document.getElementById("voucher-header").innerHTML = headerHtml;
  document.getElementById("voucher-body").innerHTML = `
    <div class="voucher-block">
      ${productosHtml}
      ${footerHtml}
    </div>
  `;
  const btnConfirm = document.querySelector('.voucher-footer .btn-confirm');
  if(btnConfirm) {
    btnConfirm.innerText = currentMode === 'proforma' ? 'Enviar Proforma' : 'Confirmar Compra';
    btnConfirm.onclick = currentMode === 'proforma' ? enviarProforma : confirmarCompra;
  }
}

function generarNroBoleta(){
  const now = Date.now().toString();
  const last6 = now.slice(-6).padStart(6,'0');
  return `VENT ${last6.slice(0,3)} ${last6.slice(3)}`;
}

function generarReferencia(tipo){

  const num = Math.floor(Math.random() * 900) + 100;
  return tipo === 'proforma' ? `PRF ${num}` : `VENT ${num}`;
}

function confirmarCompra() {
  if(CARRITO.length === 0) {
    return showMessage('El carrito está vacío', 'error');
  }
  
  showMessage('Registrando venta en Google Sheets...', 'success');
  
  const usuario = localStorage.getItem('usuario');
  const profile = userProfiles[usuario] || { nombre: usuario };
  const totales = calcularTotalesVenta();
  
  // Extraer nroBoleta del voucher mostrado o usar voucherReference
  let numRef = voucherReference;
  
  if (!numRef) {
    // Intentar extraer del DOM del voucher
    const voucherBody = document.getElementById("voucher-body");
    if (voucherBody) {
      const content = voucherBody.innerText || voucherBody.textContent;
      const match = content.match(/CODIGO:\s*(VENT\s+\d+\s+\d+|PRF\s+\d+)/i);
      numRef = match ? match[1] : null;
    }
  }
  
  // Si aún no hay número, generar uno
  if (!numRef) {
    numRef = currentMode === 'proforma' ? generarReferencia('proforma') : generarNroBoleta();
  }
  
  voucherReference = numRef;
  
  const fechaTexto = voucherFechaTexto || (() => {
    const now = new Date();
    return now.toLocaleDateString('es-PE') + ' ' + now.toLocaleTimeString('es-PE', { hour: '2-digit', minute:'2-digit' });
  })();
  voucherFechaTexto = fechaTexto;
  
  console.log('nroBoleta en confirmarCompra:', numRef);
  
  // Calcular descuento proporcional por producto
  const descuentoTotal = descuentoActual || 0;
  const subtotalOriginal = totales.subtotalOriginal;
  
  const productos = CARRITO.map((item) => {
    const precioUnitOriginal = obtenerPrecioUnitario(item);
    const subtotalProducto = precioUnitOriginal * item.cant;
    
    // Descuento proporcional para este producto
    const descuentoProducto = subtotalOriginal > 0 
      ? (subtotalProducto / subtotalOriginal) * descuentoTotal 
      : 0;
    
    // Precio de venta por unidad después de descontar
    const precioVenta = Math.max(0, precioUnitOriginal - (descuentoProducto / item.cant));
    const totalProducto = Math.round((precioVenta * item.cant) * 100) / 100;
    
    return {
      idUsuario: usuario,
      usuario: usuario,
      nroBoleta: numRef,
      fecha: fechaTexto,
      categoria: item.categoria,
      id: item.id || '',
      idProducto: item.id || '',
      producto: item.producto,
      talla: item.talla,
      color: item.color,
      cantidad: item.cant,
      precio: Math.round(precioVenta * 100) / 100,
      precioVenta: Math.round(precioVenta * 100) / 100,
      total: totalProducto,
      totalProducto: totalProducto
    };
  });
  
  const datosVenta = {
    fecha: fechaTexto,
    usuario: usuario,
    accion: 'VENTA',
    nroBoleta: numRef,
    vendedor: profile.nombre,
    productos: productos,
    subtotal: totales.subtotal,
    descuento: totales.descuento,
    igv: totales.igv,
    totalVenta: totales.totalConDescuento
  };
  
  // Guardar globalmente para usar en descargar PDF
  window.ultimoJSONVenta = datosVenta;
  
  console.log('Enviando al Sheets:', datosVenta);
  
  enviarDatosASheets('VENTA', datosVenta)
    .then(success => {
      if(success) {
        showMessage('Venta registrada. Abriendo WhatsApp...', 'success');
        setTimeout(() => {
          mostrarVentanaWhatsappConPDF();
        }, 800);
      } else {
        showMessage('Error al enviar a Sheets', 'error');
      }
    });
}

function enviarProforma() {
  if(CARRITO.length === 0) {
    return showMessage('El carrito está vacío', 'error');
  }

  showMessage('Preparando proforma...', 'success');
  const usuario = localStorage.getItem('usuario');
  const profile = userProfiles[usuario] || { nombre: usuario };
  const totales = calcularTotalesVenta();
  const numRef = voucherReference || generarReferencia(currentMode);
  const fecha = voucherFechaTexto || (() => {
    const now = new Date();
    return now.toLocaleDateString('es-PE') + ' ' + now.toLocaleTimeString('es-PE', { hour: '2-digit', minute:'2-digit' });
  })();
  voucherReference = voucherReference || numRef;
  voucherFechaTexto = voucherFechaTexto || fecha;

  const productos = CARRITO.map(item => {
    const precioUnit = obtenerPrecioUnitario(item);
    return {
      idProducto: item.id || '',
      producto: item.producto,
      categoria: item.categoria,
      talla: item.talla,
      color: item.color,
      cantidad: item.cant,
      precioUnitario: precioUnit,
      precioVenta: Math.round(precioUnit * totales.factor * 100) / 100,
      totalProducto: Math.round(precioUnit * totales.factor * item.cant * 100) / 100
    };
  });

  const datosProforma = {
    idUsuario: usuario,
    fecha,
    vendedor: profile.nombre,
    codigoRef: numRef,
    tipo: 'PROFORMA',
    productos: productos,
    subtotal: totales.subtotal,
    descuento: totales.descuento,
    igv: totales.igv,
    totalVenta: totales.totalConDescuento
  };

  window.ultimoJSONVenta = datosProforma;
  mostrarVentanaWhatsappConPDF();
}

function descargarPDFVoucher() {
  const ventaGuardada = window.ultimoJSONVenta || null;
  const tipoTexto = ventaGuardada?.tipo || voucherTipoTexto || (currentMode === 'proforma' ? 'PROFORMA' : 'REGISTRO DE VENTA');
  const usuario = localStorage.getItem('usuario');
  const profile = userProfiles[usuario] || { nombre: usuario, celular: '+51922464915' };
  const numRef = ventaGuardada?.nroBoleta || ventaGuardada?.codigoRef || voucherReference || generarReferencia(currentMode);
  const fechaTexto = voucherFechaTexto || new Date().toLocaleDateString('es-PE') + ' ' + new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute:'2-digit' });
  const totales = ventaGuardada ? {
    subtotal: ventaGuardada.subtotal || 0,
    descuento: ventaGuardada.descuento || 0,
    igv: ventaGuardada.igv || 0,
    totalConDescuento: ventaGuardada.totalVenta || ventaGuardada.totalConDescuento || 0,
    factor: 1
  } : calcularTotalesVenta();
  const productos = ventaGuardada?.productos || CARRITO;

  const pdf = new jspdf.jsPDF();
  pdf.setFont('courier');
  let y = 15;

  pdf.setFontSize(12);
  pdf.text('A&T KAMIARA S.A.C.', 105, y, { align: 'center' });
  y += 5;
  
  const ruc = `RUC: 20XXXXXXXXXX`;
  const fechaLine = `${fechaTexto}`;
  pdf.setFontSize(10);
  pdf.text(ruc, 10, y);
  pdf.text(fechaLine, 200, y, { align: 'right' });
  y += 5;

  pdf.text('DIRECCION: AMPLIACIÓN LOS LAURELES PAMPLONA ALTA SJM', 105, y, { align: 'center' });
  y += 5;

  pdf.text('----------------------------------------------------------------------', 105, y, { align: 'center' });
  y += 5;

  pdf.text(tipoTexto, 10, y);
  pdf.text(`CODIGO: ${numRef}`, 200, y, { align: 'right' });
  y += 5;

  pdf.text(profile.nombre.substring(0, 30), 10, y);
  pdf.text(`CELL: ${profile.celular}`, 200, y, { align: 'right' });
  y += 5;

  pdf.text('----------------------------------------------------------------------', 105, y, { align: 'center' });
  y += 6;

  pdf.setFontSize(9);
  pdf.text('DETALLES', 10, y);
  y += 4;

  let subtotalBaseIgv = 0;

  productos.forEach(item => {
    const precioUnit = obtenerPrecioUnitario(item);
    const cantidad = item.cantidad || item.cant || 0;
    const totalItem = item.totalProducto || (precioUnit * cantidad);
    const nombreTrunc = (item.producto || '').substring(0, 20);
    
    const precioBaseItem = Math.round((totalItem / 1.18) * 100) / 100;
    subtotalBaseIgv += precioBaseItem;

    pdf.text(`ID: ${item.id || item.idProducto || '-'} - ${nombreTrunc}`, 10, y);
    y += 4;
    pdf.text(`Talla ${item.talla || '-'} - Color ${item.color || '-'} - Cant ${cantidad} - Precio S/ ${totalItem.toFixed(2)}`, 10, y);
    y += 6;
    pdf.text('----------------------------------------------------------------------', 105, y, { align: 'center' });
    y += 6;
  });

  pdf.text('----------------------------------------------------------------------', 105, y, { align: 'center' });
  y += 6;

  const igvCalculado = Math.round(subtotalBaseIgv * 0.18 * 100) / 100;
  const totalCalculado = Math.round((subtotalBaseIgv + igvCalculado) * 100) / 100;

  pdf.setFontSize(10);
  pdf.text('SUBTOTAL', 10, y);
  pdf.text(`S/ ${subtotalBaseIgv.toFixed(2)}`, 180, y, { align: 'right' });
  y += 5;

  pdf.text('DESCUENTO', 10, y);
  pdf.text(`S/ ${totales.descuento.toFixed(2)}`, 180, y, { align: 'right' });
  y += 5;

  pdf.text('IGV 18%', 10, y);
  pdf.text(`S/ ${igvCalculado.toFixed(2)}`, 180, y, { align: 'right' });
  y += 5;

  pdf.text('----------------------------------------------------------------------', 105, y, { align: 'center' });
  y += 6;

  pdf.setFont('courier', 'bold');
  pdf.setFontSize(11);
  pdf.text('TOTAL', 10, y);
  pdf.text(`S/ ${totalCalculado.toFixed(2)}`, 180, y, { align: 'right' });
  y += 8;

  pdf.setFont('courier', 'normal');
  pdf.setFontSize(9);
  pdf.text('GRACIAS POR SU PREFERENCIA VUELVA PRONTO', 105, y, { align: 'center' });

  pdf.save(`${tipoTexto.replace(' ', '_')}.pdf`);
  showMessage('PDF descargado', 'success');
}

function mostrarVentanaWhatsappConPDF(){
  const tipoTexto = currentMode === 'proforma' ? 'PROFORMA' : 'REGISTRO DE VENTA';
  const usuario = localStorage.getItem('usuario');
  const profile = userProfiles[usuario] || { nombre: usuario, celular: '+51922464915' };
  const ventaGuardada = window.ultimoJSONVenta || null;
  const totales = ventaGuardada ? {
    subtotal: ventaGuardada.subtotal || 0,
    descuento: ventaGuardada.descuento || 0,
    igv: ventaGuardada.igv || 0,
    totalConDescuento: ventaGuardada.totalVenta || ventaGuardada.totalConDescuento || 0,
    factor: 1
  } : calcularTotalesVenta();
  const productos = ventaGuardada?.productos || CARRITO;
  
  document.getElementById("voucher-view").style.display = "none";
  document.getElementById("carrito-view").style.display = "none";
  document.getElementById("whatsapp-view").style.display = "block";
  
  let previewHtml = `<div style="font-family: monospace; font-size: 11px; text-align: center;">`;
  previewHtml += `<strong>A&T KAMIARA S.A.C.</strong><br>`;
  previewHtml += `${tipoTexto}<br>`;
  previewHtml += `CODIGO: ${voucherReference || (ventaGuardada?.codigoRef || '-') }<br><br>`;
  previewHtml += `<strong>DETALLES</strong><br>`;
  previewHtml += `----------------------------------------------------------------------<br>`;
  
  let subtotalBaseIgv = 0;
  
  productos.forEach(item => {
    const precioUnit = obtenerPrecioUnitario(item);
    const totalItem = item.totalProducto || (precioUnit * item.cantidad);
    
    const precioBaseItem = Math.round((totalItem / 1.18) * 100) / 100;
    subtotalBaseIgv += precioBaseItem;
    
    previewHtml += `ID: ${item.id || item.idProducto || '-'} - ${item.producto}<br>`;
    previewHtml += `Talla ${item.talla || '-'} - Color ${item.color || '-'} - Cant ${item.cantidad || item.cant} - Precio S/ ${totalItem.toFixed(2)}<br>`;
    previewHtml += `----------------------------------------------------------------------<br>`;
  });
  
  const igvCalculado = Math.round(subtotalBaseIgv * 0.18 * 100) / 100;
  const totalCalculado = Math.round((subtotalBaseIgv + igvCalculado) * 100) / 100;
  
  previewHtml += `SUBTOTAL: S/ ${subtotalBaseIgv.toFixed(2)}<br>`;
  if(totales.descuento > 0) previewHtml += `DESCUENTO: -S/ ${totales.descuento.toFixed(2)}<br>`;
  previewHtml += `IGV 18%: S/ ${igvCalculado.toFixed(2)}<br>`;
  previewHtml += `<strong>TOTAL: S/ ${totalCalculado.toFixed(2)}</strong><br><br>`;
  previewHtml += `Vendedor: ${profile.nombre}<br>`;
  previewHtml += `${profile.celular}`;
  previewHtml += `</div>`;
  
  document.getElementById("voucher-preview").innerHTML = previewHtml;
  document.getElementById("voucher-phone").value = '';
  document.getElementById("voucher-phone").focus();
}

function volverVoucher(){
  document.getElementById("whatsapp-view").style.display = "none";
  document.getElementById("voucher-view").style.display = "block";
}

function enviarWhatsappVoucher(){
  const numeroCliente = document.getElementById('voucher-phone').value.replace(/\D/g,'');
  if(!numeroCliente || numeroCliente.length < 9) return showMessage('Ingrese un número válido', 'error');
  
  const numClienteFormato = numeroCliente.startsWith('51') ? numeroCliente : '51' + numeroCliente;
  const hiddenAdmin = '51922464915';
  const tipoTexto = currentMode === 'proforma' ? 'PROFORMA' : 'REGISTRO DE VENTA';
  const usuario = localStorage.getItem('usuario');
  const profile = userProfiles[usuario] || { nombre: usuario };
  const ventaGuardada = window.ultimoJSONVenta || null;
  const totales = ventaGuardada ? {
    subtotal: ventaGuardada.subtotal || 0,
    descuento: ventaGuardada.descuento || 0,
    igv: ventaGuardada.igv || 0,
    totalConDescuento: ventaGuardada.totalVenta || ventaGuardada.totalConDescuento || 0,
    factor: 1
  } : calcularTotalesVenta();
  const productos = ventaGuardada?.productos || CARRITO;
  
  let msg = `*A&T KAMIARA - ${tipoTexto}*\n\n`;
  msg += `Vendedor: ${profile.nombre}\n\n`;
  msg += `*PRODUCTOS:*\n`;
  
  productos.forEach(item => {
    const precioUnit = obtenerPrecioUnitario(item);
    const cantidad = item.cantidad || item.cant || 0;
    const totalItem = item.totalProducto || (precioUnit * cantidad);
    msg += `• ${item.producto}\n`;
    msg += `  Talla: ${item.talla || '-'} | Color: ${item.color || '-'}\n`;
    msg += `  Cantidad: ${cantidad} | Precio: S/ ${totalItem.toFixed(2)}\n\n`;
  });
  
  msg += `*TOTALES:*\n`;
  msg += `Subtotal: S/ ${totales.subtotal.toFixed(2)}\n`;
  if(totales.descuento > 0) msg += `Descuento: S/ ${totales.descuento.toFixed(2)}\n`;
  msg += `IGV 18%: S/ ${totales.igv.toFixed(2)}\n`;
  msg += `*TOTAL: S/ ${totales.totalConDescuento.toFixed(2)}*`;
  
  window.open(`https://api.whatsapp.com/send?phone=${numClienteFormato}&text=${encodeURIComponent(msg)}`, '_blank');
  
  const msgAdmin = `Nuevo ${tipoTexto}: ${profile.nombre}\nCliente: +${numClienteFormato}\nTotal: S/ ${totales.totalConDescuento.toFixed(2)}`;
  window.open(`https://api.whatsapp.com/send?phone=${hiddenAdmin}&text=${encodeURIComponent(msgAdmin)}`, '_blank');
  
  showMessage('Abiertas las ventanas de WhatsApp', 'success');
}

function finalizarVenta(){
  CARRITO = [];
  descuentoActual = 0;
  currentMode = 'venta';
  voucherReference = null;
  voucherFechaTexto = null;
  voucherTipoTexto = null;
  if(document.getElementById('count')) document.getElementById('count').innerText = 0;
  document.getElementById('whatsapp-view').style.display = 'none';
  inicio();
}


function volverDetalle(){
  if(currentDetailId) abrir(inventario.find(item=>item.id==currentDetailId)?.categoria || 'INVIERNO');
}

function volverCarrito(){
  document.getElementById("voucher-view").style.display = "none";
  document.getElementById("carrito-view").style.display = "block";
}

function abrirPanel(){
  menu.style.display="none";
  productos.style.display="none";
  document.getElementById("detalle-view").style.display = "none";
  document.getElementById("carrito-view").style.display = "none";
  document.getElementById("voucher-view").style.display = "none";
  document.getElementById("admin-add-product").style.display = "none";
  document.getElementById("panel").style.display = "block";
  document.getElementById("footer-nav").style.display = "none";
}

function mostrarFormularioAgregarProducto(){
  ['new-product-id','new-product-nombre','new-product-categoria','new-product-talla','new-product-color','new-product-cantidad','new-product-unidad','new-product-docena','new-product-imagen']
    .forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });

  menu.style.display="none";
  productos.style.display="none";
  document.getElementById("detalle-view").style.display = "none";
  document.getElementById("carrito-view").style.display = "none";
  document.getElementById("voucher-view").style.display = "none";
  document.getElementById("panel").style.display = "none";
  document.getElementById("admin-add-product").style.display = "block";
  document.getElementById("footer-nav").style.display = "none";
}

function volverPanelAdmin(){
  document.getElementById("admin-add-product").style.display = "none";
  document.getElementById("panel").style.display = "block";
}

function enviarNuevoProducto(){
  const id = document.getElementById('new-product-id').value.trim().toUpperCase();
  const nombre = document.getElementById('new-product-nombre').value.trim().toUpperCase();
  const categoria = document.getElementById('new-product-categoria').value.trim().toUpperCase();
  const talla = document.getElementById('new-product-talla').value.trim().toUpperCase();
  const color = document.getElementById('new-product-color').value.trim().toUpperCase();
  const cantidad = parseInt(document.getElementById('new-product-cantidad').value, 10) || 0;
  const unidad = parseFloat(document.getElementById('new-product-unidad').value) || 0;
  const docena = parseFloat(document.getElementById('new-product-docena').value) || 0;
  const imagen = document.getElementById('new-product-imagen').value.trim();

  if(!id || !nombre || !categoria || !talla || !color) {
    return showMessage('Completa todos los campos obligatorios', 'error');
  }

  const nuevoProducto = {
    id,
    producto: nombre,
    nombre,
    categoria,
    talla,
    color,
    stock: cantidad,
    cantidad,
    unidad,
    docena,
    imagen
  };

  showMessage('Enviando producto al sheet...', 'success');

  enviarDatosASheets('NUEVO_PRODUCTO', nuevoProducto).then(success => {
    if(success) {
      inventario.push(nuevoProducto);
      showMessage('Producto enviado y agregado al inventario', 'success');
      volverPanelAdmin();
    } else {
      showMessage('Error al enviar producto al sheet', 'error');
    }
  });
}


