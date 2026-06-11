/* ============================================
   STREETFOOD — CONFIG
   ============================================ */

var CATEGORIES = {
    'Бургеры':  '🍔',
    'Шаурма':   '🌯',
    'Пицца':    '🍕',
    'Шашлык':   '🍢',
    'Хот-доги': '🌭',
    'Гарниры':  '🍟',
    'Салаты':   '🥗',
    'Напитки':  '🥤',
    'Десерты':  '🍰',
    'Соусы':    '🫙',
};

var ADMIN_PASSWORD = '1234';

/* --- SUPABASE --- */
var SUPABASE_URL = 'https://nowltuixmifvzyqudaxa.supabase.co';
var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vd2x0dWl4bWlmdnp5cXVkYXhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwMDU3MDgsImV4cCI6MjA5NjU4MTcwOH0.fidGfLDMFibRMj_uQoiDN89pB6p2b8A5z6KBD6Sem0M';

var db = null;
try {
    db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('✅ Supabase подключён');
} catch (e) {
    console.error('❌ Ошибка подключения Supabase:', e);
}