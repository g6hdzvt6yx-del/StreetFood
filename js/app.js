/* ============================================
   STREETFOOD — APP.JS
   ============================================ */

var currentPage = 'home';
var currentCategory = 'all';
var deliveryType = 'delivery';
var cart = JSON.parse(localStorage.getItem('sf_cart') || '[]');

// --- НАВИГАЦИЯ ---
function navigateTo(page) {
    document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
    var el = document.getElementById('page-' + page);
    if (el) el.classList.add('active');
    currentPage = page;
    window.scrollTo(0, 0);

    if (page === 'home') renderMenu();
    if (page === 'cart') renderCart();
    if (page === 'checkout') renderCheckout();
}

// --- МЕНЮ ---
async function renderMenu() {
    var items = await fetchMenu();

    // Фильтры
    var catSet = {};
    items.forEach(function(item) { if (item.category) catSet[item.category] = true; });
    var cats = ['all'].concat(Object.keys(catSet));

    var filtersEl = document.getElementById('menu-filters');
    filtersEl.innerHTML = cats.map(function(c) {
        return '<button class="filter-btn ' + (currentCategory === c ? 'active' : '') + '" ' +
            'onclick="filterCategory(\'' + c + '\')">' +
            (c === 'all' ? '🏷️ Все' : (CATEGORIES[c] || '📦') + ' ' + c) +
        '</button>';
    }).join('');

    // Блюда
    var filtered = currentCategory === 'all'
        ? items
        : items.filter(function(i) { return i.category === currentCategory; });

    var grid = document.getElementById('menu-grid');

    if (filtered.length === 0) {
        grid.innerHTML = '<div class="empty-state"><span class="empty-icon">🍽️</span><p>Меню обновляется</p></div>';
        return;
    }

    grid.innerHTML = filtered.map(function(item) {
        var inCart = cart.find(function(c) { return c.id === item.id; });
        return '<div class="menu-card">' +
            '<div class="menu-card-top">' +
                '<span class="menu-emoji">' + (item.emoji || '🍽️') + '</span>' +
                '<span class="menu-category-tag">' + (item.category || '') + '</span>' +
            '</div>' +
            '<div class="menu-name">' + item.name + '</div>' +
            (item.description ? '<div class="menu-desc">' + item.description + '</div>' : '') +
            (item.weight ? '<div class="menu-weight">' + item.weight + '</div>' : '') +
            '<div class="menu-bottom">' +
                '<span class="menu-price">' + item.price + ' ₽</span>' +
                '<button class="add-btn ' + (inCart ? 'added' : '') + '" onclick="addToCart(' + item.id + ')">' +
                    (inCart ? '✓ ' + inCart.quantity + ' шт' : 'В корзину') +
                '</button>' +
            '</div>' +
        '</div>';
    }).join('');
}

function filterCategory(cat) {
    currentCategory = cat;
    renderMenu();
}

async function fetchMenu() {
    if (!db) return [];
    try {
        var result = await db.from('sf_menu').select('*').eq('active', true).order('sort_order').order('name');
        if (result.error) throw result.error;
        return result.data || [];
    } catch (e) {
        console.error('Ошибка загрузки меню:', e);
        return [];
    }
}

// --- КОРЗИНА ---
function addToCart(itemId) {
    var existing = cart.find(function(c) { return c.id === itemId; });
    if (existing) {
        existing.quantity += 1;
        saveCart();
        if (currentPage === 'home') renderMenu();
        showToast('Добавлено +1', 'success');
    } else {
        fetchItemById(itemId).then(function(item) {
            if (item) {
                cart.push({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    emoji: item.emoji || '🍽️',
                    quantity: 1
                });
                saveCart();
                if (currentPage === 'home') renderMenu();
                showToast('Добавлено в корзину', 'success');
            }
        });
    }
}

async function fetchItemById(id) {
    if (!db) return null;
    try {
        var result = await db.from('sf_menu').select('*').eq('id', id).single();
        if (result.error) throw result.error;
        return result.data;
    } catch (e) {
        return null;
    }
}

function updateQuantity(id, delta) {
    var item = cart.find(function(c) { return c.id === id; });
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) {
        cart = cart.filter(function(c) { return c.id !== id; });
    }
    saveCart();
    renderCart();
}

function removeFromCart(id) {
    cart = cart.filter(function(c) { return c.id !== id; });
    saveCart();
    renderCart();
}

function saveCart() {
    localStorage.setItem('sf_cart', JSON.stringify(cart));
    updateCartBadge();
}

function updateCartBadge() {
    var badge = document.getElementById('cart-count');
    var total = cart.reduce(function(s, i) { return s + i.quantity; }, 0);
    if (total > 0) {
        badge.textContent = total;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

function getCartTotal() {
    return cart.reduce(function(s, i) { return s + i.price * i.quantity; }, 0);
}

function renderCart() {
    var emptyEl = document.getElementById('cart-empty');
    var contentEl = document.getElementById('cart-content');

    if (cart.length === 0) {
        emptyEl.style.display = 'block';
        contentEl.style.display = 'none';
        return;
    }
    emptyEl.style.display = 'none';
    contentEl.style.display = 'block';

    document.getElementById('cart-items').innerHTML = cart.map(function(item) {
        return '<div class="cart-item">' +
            '<span class="cart-item-emoji">' + item.emoji + '</span>' +
            '<div class="cart-item-info">' +
                '<div class="cart-item-name">' + item.name + '</div>' +
                '<div class="cart-item-price">' + item.price + ' ₽</div>' +
            '</div>' +
            '<div class="cart-item-controls">' +
                '<button class="qty-btn" onclick="updateQuantity(' + item.id + ', -1)">−</button>' +
                '<span class="qty-value">' + item.quantity + '</span>' +
                '<button class="qty-btn" onclick="updateQuantity(' + item.id + ', +1)">+</button>' +
            '</div>' +
            '<span class="cart-item-total">' + (item.price * item.quantity) + ' ₽</span>' +
            '<button class="cart-item-remove" onclick="removeFromCart(' + item.id + ')" title="Удалить">✕</button>' +
        '</div>';
    }).join('');

    var total = getCartTotal();
    document.getElementById('cart-subtotal').textContent = total + ' ₽';
    document.getElementById('cart-total').textContent = total + ' ₽';
}

// --- ДОСТАВКА / САМОВЫВОЗ ---
function setDeliveryType(type) {
    deliveryType = type;
    document.getElementById('btn-delivery').classList.toggle('active', type === 'delivery');
    document.getElementById('btn-pickup').classList.toggle('active', type === 'pickup');
    document.getElementById('address-block').style.display = type === 'delivery' ? 'block' : 'none';
}

// --- ОФОРМЛЕНИЕ ---
function renderCheckout() {
    document.getElementById('checkout-total').textContent = getCartTotal() + ' ₽';
}

async function submitOrder() {
    var name = document.getElementById('inp-name').value.trim();
    var phone = document.getElementById('inp-phone').value.trim();
    var address = deliveryType === 'delivery' ? document.getElementById('inp-address').value.trim() : 'Самовывоз';
    var notes = document.getElementById('inp-notes').value.trim();
    var payment = document.querySelector('input[name="payment"]:checked').value;

    if (!name || !phone) {
        showToast('Заполните имя и телефон', 'error');
        return;
    }
    if (deliveryType === 'delivery' && !address) {
        showToast('Укажите адрес доставки', 'error');
        return;
    }
    if (!db) {
        showToast('Ошибка подключения', 'error');
        return;
    }

    var btn = document.getElementById('btn-submit');
    btn.disabled = true;
    btn.textContent = 'Отправляем...';

    try {
        var orderResult = await db.from('sf_orders').insert([{
            customer_name: name,
            customer_phone: phone,
            customer_address: address,
            customer_notes: notes || null,
            delivery_type: deliveryType,
            payment_method: payment,
            total_amount: getCartTotal(),
            status: 'Новый'
        }]).select().single();

        if (orderResult.error) throw orderResult.error;
        var order = orderResult.data;

        var items = cart.map(function(item) {
            return {
                order_id: order.id,
                item_id: item.id,
                item_name: item.name,
                quantity: item.quantity,
                price: item.price
            };
        });

        var itemsResult = await db.from('sf_order_items').insert(items);
        if (itemsResult.error) throw itemsResult.error;

        cart = [];
        saveCart();
        document.getElementById('inp-name').value = '';
        document.getElementById('inp-phone').value = '';
        document.getElementById('inp-address').value = '';
        document.getElementById('inp-notes').value = '';
        document.getElementById('order-number').textContent = 'Заказ #' + order.id;
        navigateTo('success');

    } catch (e) {
        console.error('Ошибка:', e);
        showToast('Ошибка: ' + e.message, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Отправить заказ';
    }
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

// --- СТАРТ ---
document.addEventListener('DOMContentLoaded', function() {
    updateCartBadge();
    renderMenu();
});