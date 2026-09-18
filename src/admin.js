const $ = s => document.querySelector(s);
let ordersCursor = null;
let codesCursor = null;
let selectedId = null;
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
  if (!more) $('#orders').replaceChildren();
  for (const order of result.orders) {
    const row = document.createElement('tr');
    cell(row, date(order.created)); cell(row, order.plate); cell(row, order.customer.name); cell(row, money(order.amount)); cell(row, order.status);
    const button = document.createElement('button'); button.className = 'btn btn-light small'; button.textContent = 'Ansehen'; button.setAttribute('aria-label', `Bestellung ${order.plate} ansehen`); button.onclick = () => detail(order.id).catch(e => message(e.message)); cell(row, '').replaceChildren(button); $('#orders').append(row);
  }
  ordersCursor = result.nextCursor; $('#more-orders').hidden = !ordersCursor; $('#orders-empty').hidden = Boolean($('#orders').children.length);
}
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
