const $ = s => document.querySelector(s);
let ordersCursor = null;
let codesCursor = null;
let selectedId = null;
const selectedOrders = new Set();
let deletingOrders = false;
const message = text => { $('#admin-message').textContent = text; };
async function api(path = '', body) {
  const response = await fetch(`/api/admin${path}`, { cache: 'no-store', ...(body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}) });
  const result = await response.json();
  if (!response.ok) {
    if (response.status === 401) { $('#dashboard').hidden = true; $('#admin-login').hidden = false; $('#logout').hidden = true; $('#order-detail').close(); $('#detail-content').replaceChildren(); $('#orders').replaceChildren(); $('#codes').replaceChildren(); }
    throw new Error(result.error || 'Anfrage fehlgeschlagen.');
  }
  return result;
}
const money = cents => (cents / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
const date = seconds => new Date(seconds * 1000).toLocaleString('de-DE');
function cell(row, value) { const td = document.createElement('td'); td.textContent = value || '—'; row.append(td); return td; }
async function loadOrders(more = false) {
  const result = await api(more && ordersCursor ? `?cursor=${encodeURIComponent(ordersCursor)}` : '');
  if (!more) { $('#orders').replaceChildren(); selectedOrders.clear(); }
  for (const order of result.orders) {
    const row = document.createElement('tr'); row.dataset.id = order.id;
    const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.dataset.orderId = order.id;
    checkbox.setAttribute('aria-label', `Bestellung ${order.plate} ausw\u00e4hlen`);
    checkbox.onchange = () => { if (checkbox.checked) selectedOrders.add(order.id); else selectedOrders.delete(order.id); updateSelection(); };
    cell(row, '').replaceChildren(checkbox);
    cell(row, date(order.created)); cell(row, order.plate); cell(row, order.customer.name); cell(row, money(order.amount)); cell(row, order.status);
    const button = document.createElement('button'); button.className = 'btn btn-light small'; button.textContent = 'Ansehen'; button.setAttribute('aria-label', `Bestellung ${order.plate} ansehen`); button.onclick = () => detail(order.id).catch(e => message(e.message)); const remove = document.createElement('button'); remove.className = 'btn btn-light small'; remove.textContent = 'L\u00f6schen';
    remove.setAttribute('aria-label', `Bestellung ${order.plate} l\u00f6schen`); remove.onclick = () => deleteOrders([order.id]);
    cell(row, '').replaceChildren(button, remove); $('#orders').append(row);
  }
  updateSelection();
  ordersCursor = result.nextCursor; $('#more-orders').hidden = !ordersCursor; $('#orders-empty').hidden = Boolean($('#orders').children.length);
}

function updateSelection() {
  const checkboxes = [...document.querySelectorAll('[data-order-id]')];
  $('#selection-count').textContent = `${selectedOrders.size} ausgew\u00e4hlt`;
  $('#delete-selected').disabled = deletingOrders || selectedOrders.size === 0;
  $('#select-all-orders').checked = checkboxes.length > 0 && selectedOrders.size === checkboxes.length;
  $('#select-all-orders').indeterminate = selectedOrders.size > 0 && selectedOrders.size < checkboxes.length;
  $('#select-all-orders').disabled = deletingOrders || checkboxes.length === 0;
}
async function deleteOrders(ids) {
  if (deletingOrders || !ids.length) return;
  if (!window.confirm(`${ids.length === 1 ? 'Diese Bestellung' : ids.length + ' Bestellungen'} aus der Verwaltung l\u00f6schen? Zahlungen und Rechnungen bleiben erhalten.`)) return;
  deletingOrders = true;
  const controls = [...document.querySelectorAll('#orders button, #orders input, #refresh, #more-orders')];
  controls.forEach(control => { control.disabled = true; }); updateSelection();
  try {
    const result = await api('', { action: 'delete-orders', ids });
    for (const id of result.deletedIds) {
      [...$('#orders').children].find(row => row.dataset.id === id)?.remove(); selectedOrders.delete(id);
      if (selectedId === id) { $('#order-detail').close(); $('#detail-content').replaceChildren(); selectedId = null; }
    }
    $('#orders-empty').hidden = Boolean($('#orders').children.length);
    message(`${result.deletedIds.length} Bestellung(en) gel\u00f6scht.${result.failedIds.length ? ' ' + result.failedIds.length + ' konnten nicht gel\u00f6scht werden. Bitte erneut versuchen.' : ''}`);
  } catch (e) { message(e.message); }
  finally { deletingOrders = false; controls.forEach(control => { control.disabled = false; }); updateSelection(); }
}
$('#select-all-orders').onchange = e => {
  for (const checkbox of document.querySelectorAll('[data-order-id]')) {
    checkbox.checked = e.currentTarget.checked;
    if (checkbox.checked) selectedOrders.add(checkbox.dataset.orderId); else selectedOrders.delete(checkbox.dataset.orderId);
  }
  updateSelection();
};
$('#delete-selected').onclick = () => deleteOrders([...selectedOrders]);

async function detail(id) {
  const { order } = await api(`?id=${encodeURIComponent(id)}`); selectedId = id;
  const dl = document.createElement('dl');
  const values = { 'Bestellnummer': id, 'Bestelleingang': date(order.created), 'Kennzeichennummer': order.plate, 'Name': order.customer.name, 'Adresse': `${order.customer.street}, ${order.customer.postcode} ${order.customer.town}`, 'Telefonnummer': order.customer.phone, 'E-Mail-Adresse': order.customer.email, 'Gesamt bezahlt': money(order.amount), 'Zahlung': 'Bezahlt', 'Anzahl Schilder': order.details.quantity, 'Kennzeichentyp': order.details.plateType, 'Lieferung': order.details.delivery, 'Carbon-Optik': order.details.carbon === 'true' ? 'Ja' : 'Nein', 'Umweltplakette': order.details.environmentSticker === 'true' ? 'Ja' : 'Nein', 'Saison': order.details.season === 'true' ? `${order.details.seasonStart}–${order.details.seasonEnd}` : 'Nein', 'Hinweise / Rechnungsadresse': order.details.notes || 'Keine' };
  for (const [label, value] of Object.entries(values)) { const dt = document.createElement('dt'); dt.textContent = label; const dd = document.createElement('dd'); dd.textContent = value; dl.append(dt, dd); }
  $('#detail-content').replaceChildren(dl); $('#status-form').elements.status.value = order.status; $('#detail-message').textContent = ''; $('#order-detail').showModal();
}
async function loadCodes(more = false) {
  const result = await api(`?resource=discounts${more && codesCursor ? `&cursor=${encodeURIComponent(codesCursor)}` : ''}`);
  if (!more) $('#codes').replaceChildren();
  for (const code of result.codes) {
    const li = document.createElement('li'); const text = document.createElement('span'); text.textContent = `${code.code} · ${code.percentOff ?? '—'} % · ${code.active ? 'Aktiv' : 'Inaktiv'} · ${code.redeemed}${code.maxRedemptions ? ` / ${code.maxRedemptions}` : ''} Einlösungen${code.expiresAt ? ` · Bis ${date(code.expiresAt)}` : ''}`;
    const button = document.createElement('button'); button.className = 'btn btn-light small'; button.textContent = code.active ? 'Deaktivieren' : 'Aktivieren'; button.onclick = async () => { button.disabled = true; try { await api('', { action: 'toggle-discount', id: code.id, active: !code.active }); await loadCodes(); message('Rabattcode aktualisiert.'); } catch (e) { message(e.message); button.disabled = false; } }; li.append(text, button); $('#codes').append(li);
  }
  codesCursor = result.nextCursor; $('#more-codes').hidden = !codesCursor;
}
async function openDashboard() {
  await loadOrders(); $('#admin-login').hidden = true; $('#dashboard').hidden = false; $('#logout').hidden = false; await loadCodes();
}
$('#admin-login').onsubmit = async e => { e.preventDefault(); const button = e.currentTarget.querySelector('button'); button.disabled = true; try { await api('', { action: 'login', username: e.currentTarget.elements.username.value, password: e.currentTarget.elements.password.value }); $('#admin-login').reset(); await openDashboard(); message(''); } catch (e) { message(e.message); } finally { button.disabled = false; } };
$('#logout').onclick = async () => { try { await api('', { action: 'logout' }); location.reload(); } catch (e) { message(e.message); } };
$('#refresh').onclick = () => openDashboard().catch(e => message(e.message));
$('#more-orders').onclick = () => loadOrders(true).catch(e => message(e.message));
$('#more-codes').onclick = () => loadCodes(true).catch(e => message(e.message));
$('#close-detail').onclick = () => $('#order-detail').close();
$('#status-form').onsubmit = async e => { e.preventDefault(); const button = e.currentTarget.querySelector('button'); button.disabled = true; try { await api('', { action: 'status', id: selectedId, status: e.currentTarget.elements.status.value }); $('#detail-message').textContent = 'Status gespeichert.'; await loadOrders(); } catch (e) { $('#detail-message').textContent = e.message; } finally { button.disabled = false; } };
$('#discount-form').onsubmit = async e => { e.preventDefault(); const button = e.currentTarget.querySelector('button'); button.disabled = true; try { await api('', { action: 'create-discount', ...Object.fromEntries(new FormData(e.currentTarget)) }); $('#discount-form').reset(); await loadCodes(); message('Rabattcode erstellt.'); } catch (e) { message(e.message); } finally { button.disabled = false; } };
openDashboard().catch(e => { if (e.message !== 'Bitte anmelden.') message(e.message); });
