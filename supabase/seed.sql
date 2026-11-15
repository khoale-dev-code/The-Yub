-- Seed The Yub (GIA MAU – chu tiem cap nhat gia chinh thuc trong Admin truoc khi live).
-- Chay SAU cac file trong supabase/migrations. Chay lai nhieu lan khong ghi de du lieu da sua trong Admin.

insert into categories (slug, name, sort_order) values
  ('croissant', 'Croissant', 1),
  ('tart', 'Tart', 2),
  ('cake', 'Bánh kem & bánh ngọt', 3),
  ('cookie', 'Cookie', 4),
  ('combo', 'Combo', 5)
on conflict (slug) do nothing;

insert into pickup_slots (id, label, sort_order) values
  ('s1', '08:00 – 10:00', 1),
  ('s2', '10:00 – 12:00', 2),
  ('s3', '12:00 – 14:30', 3),
  ('s4', '14:30 – 16:00', 4),
  ('s5', '16:00 – 18:00', 5),
  ('s6', '18:00 – 19:00', 6)
on conflict (id) do update set label = excluded.label, sort_order = excluded.sort_order;

-- Dia chi, ban do, tai khoan ngan hang: CHO XAC NHAN – chu tiem nhap trong Admin > Cai dat
insert into store_settings (key, value) values
  ('store_info', jsonb_build_object(
    'address', null,
    'map_url', null,
    'map_embed_url', null,
    'bank_name', null,
    'bank_account_no', null,
    'bank_account_name', null,
    'ordering_enabled', true,
    'ordering_paused_message', null
  ))
on conflict (key) do nothing;

insert into products (category_id, slug, name, description, tagline, price_vnd, compare_at_vnd, status, image_path, image_position, gallery, details, sort_order)
select c.id, p.slug, p.name, p.description, p.tagline, p.price_vnd, p.compare_at_vnd, p.status, p.image_path, p.image_position, p.gallery::text[], p.details::jsonb, p.sort_order
from (values
  ('croissant', 'croissant-bo', 'Croissant bơ', 'Vỏ giòn nhiều lớp, thơm bơ.', null, 35000, null, 'ready', 'cubeStack', 'center 35%', '{}', null, 10),
  ('croissant', 'croissant-so-co-la', 'Croissant sô-cô-la', 'Vỏ bơ giòn tách lớp, ruột mềm, bên trong là hai thanh sô-cô-la đen tan chảy khi bánh còn ấm.', 'Sô-cô-la đen chảy bên trong.', 42000, null, 'oven', 'choco', 'center 45%', '{choco,crossSection,croissantCoffee,cubeStack}', '{"highlights":[{"title":"Vỏ giòn tách lớp","text":"Bẻ ra nghe giòn, ruột mềm.","image":"crossSection"},{"title":"Sô-cô-la tan chảy","text":"Hai thanh sô-cô-la đen bên trong.","image":"choco"},{"title":"Ngon nhất khi ấm","text":"Ăn trong 2 giờ đầu sau khi ra lò.","image":"croissantCoffee"}],"ingredients":"Bột mì, bơ lạt, sữa tươi, trứng, đường, men, muối và sô-cô-la đen.","allergens":"Có gluten, sữa, trứng; làm chung bếp với các loại hạt."}', 20),
  ('croissant', 'croissant-hanh-nhan', 'Croissant hạnh nhân', 'Kem hạnh nhân, lát hạnh nhân rang.', null, 45000, null, 'ready', 'crossSection', 'center 30%', '{}', null, 30),
  ('croissant', 'croissant-mam-xoi', 'Croissant mâm xôi', 'Nhân sốt mâm xôi chua nhẹ.', null, 45000, null, 'oven', 'raspberry', 'center 40%', '{}', null, 40),
  ('croissant', 'croissant-4-vi', 'Croissant 4 vị', 'Bơ, hạnh nhân, phô mai mâm xôi, sô-cô-la.', null, 160000, null, 'pre', 'crossSection', 'center 45%', '{}', null, 50),
  ('tart', 'tart-trung', 'Tart trứng', 'Vỏ ngàn lớp, nhân trứng sữa.', null, 25000, null, 'ready', 'eggTarts', null, '{}', null, 60),
  ('tart', 'tart-trai-cay', 'Tart trái cây', 'Dâu, việt quất, xoài tươi.', null, 39000, null, 'ready', 'fruitEggTarts', null, '{}', null, 70),
  ('tart', 'tart-kem-mua', 'Tart kem mùa', 'Chanh, cherry, pistachio.', null, 59000, null, 'ready', 'fourDesserts', 'center 40%', '{}', null, 80),
  ('tart', 'hop-tart-4-vi', 'Hộp tart 4 vị', 'Tart trái cây mọng, gói hộp sẵn.', null, 180000, null, 'pre', 'berryTartBox', 'center 45%', '{}', null, 90),
  ('tart', 'hop-tart-7-vi', 'Hộp tart 7 vị', 'Matcha, chanh, dâu, việt quất…', null, 230000, null, 'pre', 'tartRack', 'center 45%', '{}', null, 100),
  ('cake', 'banh-kem-dau', 'Bánh kem dâu', 'Nhiều tầng cốt, kem sữa, dâu tươi.', null, 55000, null, 'ready', 'strawberryCake', 'center 70%', '{}', null, 110),
  ('cake', 'banh-kem-trai-cay-16cm', 'Bánh kem trái cây 16cm', 'Kem tươi, dâu, mâm xôi, việt quất.', null, 420000, null, 'pre', 'redBoxCake', 'center 55%', '{}', null, 120),
  ('cake', 'bong-lan-chanh', 'Bông lan chanh', 'Cốt mềm, kem chanh thơm mát.', null, 55000, null, 'pre', 'lemonCake', 'center 65%', '{}', null, 130),
  ('cake', 'cheesecake-viet-quat', 'Cheesecake việt quất', 'Béo mịn, phủ sô-cô-la trắng.', null, 45000, null, 'out', 'blueberryCheesecake', 'center 75%', '{}', null, 140),
  ('cake', 'banh-cuon-kem', 'Bánh cuộn kem', 'Cốt mềm, kem sữa nhẹ.', null, 39000, null, 'ready', 'rollCake', 'center 55%', '{}', null, 150),
  ('cookie', 'cookie-hop-6-vi', 'Cookie hộp 6 vị', 'Sô-cô-la, matcha, hạt dẻ…', null, 150000, null, 'ready', 'cookies', 'center 55%', '{}', null, 160),
  ('combo', 'combo-croissant-cacao', 'Croissant & cacao nóng', 'Croissant bơ vừa ra lò, tách cacao đậm và ly kem tươi rắc bột cacao.', null, 75000, 80000, 'ready', 'croissantCocoa', 'center 45%', '{}', null, 170),
  ('combo', 'combo-banh-cuon-latte', 'Bánh cuộn & latte đá', 'Hai lát bánh cuộn kem sữa, vài trái dâu tươi và ly latte đá mát lạnh.', null, 79000, 85000, 'ready', 'rollCake', 'center 45%', '{}', null, 180),
  ('combo', 'combo-pancake-americano', 'Pancake & americano', 'Chồng pancake mềm, kem sữa chua và việt quất, cùng ly americano đá.', null, 85000, 94000, 'ready', 'pancake', 'center 55%', '{}', null, 190)
) as p(category_slug, slug, name, description, tagline, price_vnd, compare_at_vnd, status, image_path, image_position, gallery, details, sort_order)
join categories c on c.slug = p.category_slug
on conflict (slug) do nothing;

insert into product_variants (product_id, id, label, price_vnd, sort_order)
select pr.id, v.id, v.label, v.price_vnd, v.sort_order
from (values
  ('croissant-so-co-la', 'one', '1 cái', 42000, 1),
  ('croissant-so-co-la', 'box4', 'Hộp 4 cái', 160000, 2),
  ('croissant-so-co-la', 'box6', 'Hộp 6 cái', 235000, 3)
) as v(slug, id, label, price_vnd, sort_order)
join products pr on pr.slug = v.slug
on conflict (product_id, id) do nothing;

-- Do uong (can migration 0004). GIA MAU – chu tiem sua trong Admin > Do uong.
insert into drinks (id, name, description, drink_group, temps, price_m_vnd, price_l_vnd, sort_order) values
  ('d-cafe-den', 'Cà phê đen', 'Đậm vị, hậu đắng nhẹ.', 'coffee', '{hot,ice}', 25000, 31000, 10),
  ('d-cafe-sua', 'Cà phê sữa', 'Sữa đặc, ngọt dịu.', 'coffee', '{hot,ice}', 29000, 35000, 20),
  ('d-bac-xiu', 'Bạc xỉu', 'Nhiều sữa, ít cà phê.', 'coffee', '{hot,ice}', 32000, 38000, 30),
  ('d-cafe-muoi', 'Cà phê muối', 'Lớp kem muối béo, mằn mặn.', 'coffee', '{ice}', 35000, 41000, 40),
  ('d-cafe-cot-dua', 'Cà phê cốt dừa', 'Cốt dừa béo, xay cùng đá.', 'coffee', '{ice}', 39000, 45000, 50),
  ('d-americano', 'Americano', 'Espresso pha loãng, thanh nhẹ.', 'coffee', '{hot,ice}', 39000, 45000, 60),
  ('d-latte', 'Latte', 'Espresso và sữa tươi.', 'coffee', '{hot,ice}', 45000, 51000, 70),
  ('d-cappuccino', 'Cappuccino', 'Bọt sữa dày, rắc cacao.', 'coffee', '{hot}', 45000, null, 80),
  ('d-tra-dao-cam-sa', 'Trà đào cam sả', 'Trà đen, đào ngâm, cam và sả.', 'tea', '{ice}', 42000, 48000, 90),
  ('d-tra-vai', 'Trà vải', 'Thơm vải, chua ngọt nhẹ.', 'tea', '{ice}', 39000, 45000, 100),
  ('d-tra-oi-hong', 'Trà ổi hồng', 'Ổi hồng thơm, vị thanh.', 'tea', '{ice}', 39000, 45000, 110),
  ('d-tra-chanh-day', 'Trà chanh dây', 'Chua thanh, mát lạnh.', 'tea', '{ice}', 35000, 41000, 120),
  ('d-tra-sen-vang', 'Trà sen vàng', 'Trà ô long, hạt sen, kem sữa.', 'tea', '{ice}', 45000, 51000, 130),
  ('d-tra-nong', 'Trà nóng – ấm nhỏ', 'Một ấm nhỏ cho buổi chiều.', 'tea', '{hot}', 30000, null, 140),
  ('d-matcha-latte', 'Matcha latte', 'Matcha và sữa tươi.', 'other', '{hot,ice}', 49000, 55000, 150),
  ('d-cacao-nong-kem', 'Cacao nóng kem', 'Cacao đậm, kem tươi đánh bông.', 'other', '{hot}', 45000, null, 160),
  ('d-cacao-sua-da', 'Cacao sữa đá', 'Đậm cacao, béo nhẹ.', 'other', '{ice}', 39000, 45000, 170),
  ('d-sua-tuoi', 'Sữa tươi', 'Hợp cùng bánh ngọt.', 'other', '{hot,ice}', 29000, 35000, 180),
  ('d-nuoc-cam', 'Nước cam', 'Vắt khi bạn gọi.', 'juice', '{ice}', 39000, 45000, 190),
  ('d-sinh-to-dau', 'Sinh tố dâu', 'Dâu tươi xay cùng sữa chua.', 'juice', '{ice}', 45000, 51000, 200)
on conflict (id) do nothing;
