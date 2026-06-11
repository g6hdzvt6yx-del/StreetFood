/* ============================================
   STREETFOOD — ADMIN.JS
   ============================================ */

var isAdmin = false;
var editingId = null;

function adminLogin() {
    var pwd = document.getElementById('admin-password').value;
    if (pwd === ADMIN_PASSWORD) {
        isAdmin = true;
        document.getElementById('admin-login').classList.remove('active');
        document.getElementById('admin-panel').classList.add('active');
        initAdmin();
    } else {
        showToast('Неверный пароль', 'error');
    }
}

async function initAdmin() {
    populateCategoryFilter();
    await loadOrders();
    await loadMenu();
}

function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
    document.querySelectorAll('.tab-content').forEach(function(c) { c.classList.remove('active'); });
    document.querySelector('[data-tab="' + tab + '"]').classList.add('active');
    document.getElementById('tab-' + tab).classList.add('active');
}

// --- ЗАКАЗЫ ---
async function loadOrders() {
    var filter = document.getElementById('order-filter').value;
    var list = document.getElementById('orders-list');
    list.innerHTML = '<div class="loading"><div class="spinner"></div>Загрузка...</div>';
    if (!db) { list.innerHTML = '<div class="empty-state"><p>Нет подключения</p></div>'; return; }

    try {
        var query = db.from('sf_orders').select('*, sf_order_items(*)').order('created_at', { ascending: false });
        if (filter !== 'all') query = query.eq('status', filter);

        var result = await query;
        if (result.error) throw result.error;
        var data = result.data;

        document.getElementById('orders-count').textContent = data.length;

        if (data.length === 0) {
            list.innerHTML = '<div class="empty-state"><span class="empty-icon">📋</span><p>Заказов нет</p></div>';
            return;
        }

        list.innerHTML = data.map(function(order) {
            var date = new Date(order.created_at).toLocaleString('ru-RU');
            var items = order.sf_order_items || [];
            var statuses = ['Новый','Готовится','В пути','Доставлен','Самовывоз','Отменён'];
            var typeIcon = order.delivery_type === 'pickup' ? '🏠 Самовывоз' : '🚗 Доставка';
            var payIcon = order.payment_method === 'card' ? '💳 Карта' : '💵 Наличные';

            return '<div class="order-card">' +
                '<div class="order-header">' +
                    '<div class="order-customer">' +
                        '<h4>' + order.customer_name + '</h4>' +
                        '<p>📞 ' + order.customer_phone + ' · ' + typeIcon + ' · ' + payIcon + '</p>' +
                    '</div>' +
                    '<div class="order-status">' +
                        '<select onchange="updateOrderStatus(' + order.id + ', this.value)">' +
                            statuses.map(function(s) {
                                return '<option value="' + s + '"' + (order.status === s ? ' selected' : '') + '>' + s + '</option>';
                            }).join('') +
                        '</select>' +
                    '</div>' +
                '</div>' +
                (order.customer_address && order.customer_address !== 'Самовывоз' ? '<div class="order-address">📍 ' + order.customer_address + '</div>' : '') +
                (order.customer_notes ? '<div class="order-notes">💬 ' + order.customer_notes + '</div>' : '') +
                '<div class="order-items-block">' +
                    items.map(function(i) {
                        return '<p>' + i.item_name + ' × ' + i.quantity + ' = ' + (i.price * i.quantity) + ' ₽</p>';
                    }).join('') +
                '</div>' +
                '<div style="display:flex; justify-content:space-between; align-items:center;">' +
                    '<span class="order-total">Итого: ' + order.total_amount + ' ₽</span>' +
                    '<span class="order-meta">' + date + '</span>' +
                '</div>' +
            '</div>';
        }).join('');
    } catch (e) {
        console.error('Ошибка:', e);
        list.innerHTML = '<div class="empty-state"><p>Ошибка загрузки</p></div>';
    }
}

async function updateOrderStatus(id, status) {
    if (!db) return;
    try {
        var result = await db.from('sf_orders').update({ status: status }).eq('id', id);
        if (result.error) throw result.error;
        showToast('Статус обновлён', 'success');
    } catch (e) {
        showToast('Ошибка: ' + e.message, 'error');
    }
}

// --- МЕНЮ ---
async function loadMenu() {
    var filter = document.getElementById('menu-filter').value;
    var list = document.getElementById('menu-list');
    list.innerHTML = '<div class="loading"><div class="spinner"></div>Загрузка...</div>';
    if (!db) { list.innerHTML = '<div class="empty-state"><p>Нет подключения</p></div>'; return; }

    try {
        var query = db.from('sf_menu').select('*').order('sort_order').order('category').order('name');
        if (filter !== 'all') query = query.eq('category', filter);

        var result = await query;
        if (result.error) throw result.error;
        var data = result.data;

        document.getElementById('menu-count').textContent = data.length;

        if (data.length === 0) {
            list.innerHTML = '<div class="empty-state"><span class="empty-icon">🍽️</span><p>Меню пусто</p></div>';
            return;
        }

        list.innerHTML = data.map(function(item) {
            return '<div class="product-admin-card">' +
                '<span class="pa-emoji">' + (item.emoji || '🍽️') + '</span>' +
                '<div class="pa-info">' +
                    '<div class="pa-name">' + item.name + '</div>' +
                    '<div class="pa-meta">' + (item.category || '') + (item.weight ? ' · ' + item.weight : '') + (!item.active ? ' · ⛔ Скрыт' : '') + '</div>' +
                '</div>' +
                '<span class="pa-price">' + item.price + ' ₽</span>' +
                '<div class="pa-actions">' +
                    '<button class="edit-btn" onclick="editItem(' + item.id + ')">✏️</button>' +
                    '<button class="del-btn" onclick="deleteItem(' + item.id + ', \'' + item.name.replace(/'/g, "\\'") + '\')">🗑️</button>' +
                '</div>' +
            '</div>';
        }).join('');
    } catch (e) {
        console.error('Ошибка:', e);
        list.innerHTML = '<div class="empty-state"><p>Ошибка загрузки</p></div>';
    }
}

function showAddForm() {
    editingId = null;
    document.getElementById('form-title').textContent = 'Новое блюдо';
    document.getElementById('edit-id').value = '';
    document.getElementById('f-name').value = '';
    document.getElementById('f-price').value = '';
    document.getElementById('f-emoji').value = '';
    document.getElementById('f-desc').value = '';
    document.getElementById('f-weight').value = '';
    document.getElementById('f-category').value = 'Бургеры';
    document.getElementById('add-form').style.display = 'block';
    document.getElementById('f-name').focus();
}

function hideAddForm() {
    document.getElementById('add-form').style.display = 'none';
    editingId = null;
}

async function editItem(id) {
    if (!db) return;
    try {
        var result = await db.from('sf_menu').select('*').eq('id', id).single();
        if (result.error) throw result.error;
        var d = result.data;

        editingId = id;
        document.getElementById('form-title').textContent = 'Редактировать';
        document.getElementById('edit-id').value = id;
        document.getElementById('f-category').value = d.category || 'Другое';
        document.getElementById('f-name').value = d.name;
        document.getElementById('f-price').value = d.price;
        document.getElementById('f-emoji').value = d.emoji || '';
        document.getElementById('f-desc').value = d.description || '';
        document.getElementById('f-weight').value = d.weight || '';
        document.getElementById('add-form').style.display = 'block';
        document.getElementById('f-name').focus();
    } catch (e) {
        showToast('Ошибка: ' + e.message, 'error');
    }
}

async function saveItem() {
    var category = document.getElementById('f-category').value;
    var name = document.getElementById('f-name').value.trim();
    var price = parseInt(document.getElementById('f-price').value);
    var emoji = document.getElementById('f-emoji').value.trim();
    var desc = document.getElementById('f-desc').value.trim();
    var weight = document.getElementById('f-weight').value.trim();

    if (!name || !price) {
        showToast('Заполните название и цену', 'error');
        return;
    }
    if (!db) return;

    var itemData = {
        category: category,
        name: name,
        price: price,
        emoji: emoji || CATEGORIES[category] || '🍽️',
        description: desc || null,
        weight: weight || null,
        active: true,
        sort_order: 0
    };

    try {
        if (editingId) {
            var result = await db.from('sf_menu').update(itemData).eq('id', editingId);
            if (result.error) throw result.error;
            showToast('Обновлено', 'success');
        } else {
            var result = await db.from('sf_menu').insert([itemData]);
            if (result.error) throw result.error;
            showToast('Добавлено', 'success');
        }
        hideAddForm();
        await loadMenu();
    } catch (e) {
        showToast('Ошибка: ' + e.message, 'error');
    }
}

async function deleteItem(id, name) {
    if (!confirm('Удалить "' + name + '"?')) return;
    if (!db) return;
    try {
        var result = await db.from('sf_menu').delete().eq('id', id);
        if (result.error) throw result.error;
        showToast('Удалено', 'success');
        await loadMenu();
    } catch (e) {
        showToast('Ошибка: ' + e.message, 'error');
    }
}

function populateCategoryFilter() {
    var options = Object.keys(CATEGORIES).map(function(c) {
        return '<option value="' + c + '">' + CATEGORIES[c] + ' ' + c + '</option>';
    }).join('');
    document.getElementById('menu-filter').innerHTML = '<option value="all">Все категории</option>' + options;
}

// --- TOAST ---
var toastTimer;
function showToast(msg, type) {
    var el = document.getElementById('toast');
    el.textContent = msg;
    el.className = 'toast' + (type ? ' ' + type : '');
    el.style.display = 'block';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function() { el.style.display = 'none'; }, 2500);
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('admin-password').focus();
});