-- ============================================
-- STREETFOOD — SUPABASE SETUP
-- Вставьте в SQL Editor и нажмите Run
-- ============================================

-- 1. МЕНЮ
CREATE TABLE sf_menu (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    price INT NOT NULL,
    emoji VARCHAR(10) DEFAULT '🍽️',
    description TEXT,
    weight VARCHAR(50),
    active BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ЗАКАЗЫ
CREATE TABLE sf_orders (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(30) NOT NULL,
    customer_address TEXT,
    customer_notes TEXT,
    delivery_type VARCHAR(20) DEFAULT 'delivery',
    payment_method VARCHAR(20) DEFAULT 'cash',
    total_amount INT NOT NULL,
    status VARCHAR(50) DEFAULT 'Новый',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ПОЗИЦИИ ЗАКАЗА
CREATE TABLE sf_order_items (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    order_id BIGINT NOT NULL REFERENCES sf_orders(id) ON DELETE CASCADE,
    item_id BIGINT REFERENCES sf_menu(id),
    item_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    price INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ИНДЕКСЫ
CREATE INDEX idx_sf_menu_category ON sf_menu(category);
CREATE INDEX idx_sf_menu_active ON sf_menu(active);
CREATE INDEX idx_sf_orders_status ON sf_orders(status);
CREATE INDEX idx_sf_orders_date ON sf_orders(created_at DESC);
CREATE INDEX idx_sf_order_items_order ON sf_order_items(order_id);

-- RLS
ALTER TABLE sf_menu ENABLE ROW LEVEL SECURITY;
ALTER TABLE sf_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sf_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sf_menu: read" ON sf_menu FOR SELECT USING (true);
CREATE POLICY "sf_menu: insert" ON sf_menu FOR INSERT WITH CHECK (true);
CREATE POLICY "sf_menu: update" ON sf_menu FOR UPDATE USING (true);
CREATE POLICY "sf_menu: delete" ON sf_menu FOR DELETE USING (true);

CREATE POLICY "sf_orders: read" ON sf_orders FOR SELECT USING (true);
CREATE POLICY "sf_orders: insert" ON sf_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "sf_orders: update" ON sf_orders FOR UPDATE USING (true);

CREATE POLICY "sf_order_items: read" ON sf_order_items FOR SELECT USING (true);
CREATE POLICY "sf_order_items: insert" ON sf_order_items FOR INSERT WITH CHECK (true);

-- РАЗРЕШЕНИЯ
GRANT SELECT, INSERT, UPDATE, DELETE ON sf_menu TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON sf_orders TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON sf_order_items TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON sf_menu TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON sf_orders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON sf_order_items TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================
-- НАЧАЛЬНОЕ МЕНЮ
-- ============================================

INSERT INTO sf_menu (name, category, price, emoji, description, weight, sort_order) VALUES
-- Бургеры
('Классик Бургер',       'Бургеры', 250, '🍔', 'Котлета из говядины, салат, помидор, соус',         '350 г', 1),
('Чизбургер',            'Бургеры', 280, '🍔', 'Говяжья котлета, двойной сыр, маринованные огурцы', '380 г', 1),
('Двойной Бургер',       'Бургеры', 350, '🍔', 'Две котлеты, сыр, бекон, фирменный соус',          '450 г', 1),
('Чикен Бургер',         'Бургеры', 270, '🍔', 'Куриное филе в панировке, соус, овощи',             '350 г', 1),

-- Шаурма
('Шаурма классическая',  'Шаурма', 200, '🌯', 'Курица, овощи, соус, лаваш',                       '350 г', 2),
('Шаурма большая',       'Шаурма', 280, '🌯', 'Двойная порция курицы, овощи, два соуса',           '500 г', 2),
('Шаурма с говядиной',   'Шаурма', 300, '🌯', 'Говядина, свежие овощи, чесночный соус',            '400 г', 2),

-- Пицца
('Маргарита',            'Пицца',  350, '🍕', 'Томатный соус, моцарелла, базилик',                 '450 г', 3),
('Пепперони',            'Пицца',  400, '🍕', 'Пепперони, моцарелла, томатный соус',               '480 г', 3),
('Мясная',               'Пицца',  450, '🍕', 'Говядина, курица, колбаски, сыр, томат',            '550 г', 3),

-- Шашлык
('Шашлык из курицы',     'Шашлык', 300, '🍢', 'Маринованное филе, лук, лаваш',                    '300 г', 4),
('Шашлык из баранины',   'Шашлык', 450, '🍢', 'Мякоть баранины, маринад, лаваш, лук',             '300 г', 4),
('Люля-кебаб',           'Шашлык', 280, '🍢', 'Рубленая говядина со специями, лаваш',              '250 г', 4),

-- Хот-доги
('Хот-дог классический', 'Хот-доги', 150, '🌭', 'Сосиска, булка, кетчуп, горчица',                '200 г', 5),
('Хот-дог двойной',      'Хот-доги', 220, '🌭', 'Две сосиски, сыр, халапеньо, соус',              '300 г', 5),

-- Гарниры
('Картошка фри',         'Гарниры', 120, '🍟', 'Хрустящая, с солью',                               '200 г', 6),
('Картошка фри большая', 'Гарниры', 170, '🍟', 'Большая порция с соусом',                          '350 г', 6),
('Луковые кольца',       'Гарниры', 150, '🧅', 'В хрустящей панировке',                             '200 г', 6),
('Наггетсы 6 шт',        'Гарниры', 180, '🍗', 'Куриные наггетсы с соусом',                        '200 г', 6),
('Наггетсы 9 шт',        'Гарниры', 250, '🍗', 'Куриные наггетсы с двумя соусами',                 '300 г', 6),

-- Салаты
('Цезарь с курицей',     'Салаты',  250, '🥗', 'Курица, романо, пармезан, гренки, соус',           '280 г', 7),
('Овощной микс',         'Салаты',  180, '🥗', 'Свежие сезонные овощи, масло',                      '250 г', 7),

-- Напитки
('Кока-Кола 0.5',        'Напитки', 80,  '🥤', NULL,                                                '0.5 л', 8),
('Спрайт 0.5',           'Напитки', 80,  '🥤', NULL,                                                '0.5 л', 8),
('Фанта 0.5',            'Напитки', 80,  '🥤', NULL,                                                '0.5 л', 8),
('Вода 0.5',             'Напитки', 50,  '💧', NULL,                                                '0.5 л', 8),
('Чай',                  'Напитки', 60,  '🍵', NULL,                                                '0.3 л', 8),
('Айран',                'Напитки', 70,  '🥛', NULL,                                                '0.3 л', 8),

-- Соусы
('Кетчуп',               'Соусы',  30,  '🫙', NULL,                                                '50 г', 9),
('Чесночный',            'Соусы',  30,  '🫙', NULL,                                                '50 г', 9),
('Сырный',               'Соусы',  40,  '🫙', NULL,                                                '50 г', 9),
('Острый',               'Соусы',  30,  '🫙', NULL,                                                '50 г', 9);

-- ============================================
-- ГОТОВО! ✅
-- ============================================