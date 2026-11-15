-- ============================================================
-- DU LIEU MAU DE THU ADMIN – KHONG DUNG CHO TIEM THAT
-- Chay trong Supabase > SQL Editor, SAU cac migration 0001–0005 va seed.sql.
--
-- Tao:
--   - ~70 don mau: 30 ngay truoc -> 3 ngay toi, du moi trang thai (cho xac nhan, dang lam,
--     san sang, da giao, huy, tu choi), tien mat / chuyen khoan, da / chua nhan tien.
--   - 10 cau hoi khach o Hop thu.
-- Gia lay tu bang products / product_variants HIEN TAI (khong ghi cung gia).
-- Ten khach la ten gia, SDT dang 0900 000 xxx (so gia), ghi chu co chu "(đơn mẫu)".
-- Nhan dien: don co idempotency_key bat dau bang 'sample-', cau hoi co SDT bat dau bang '0900000'.
-- Chay lai nhieu lan khong sao: lan sau se XOA du lieu mau cu roi tao lai (ngay theo hom nay).
-- Xoa het du lieu mau: chay file xoa-du-lieu-mau.sql.
-- ============================================================

do $$
declare
  v_today   date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
  v_names   text[] := array['Nguyễn Thu Hà','Trần Minh Khoa','Lê Ngọc Anh','Phạm Gia Huy','Võ Thanh Trúc','Đặng Quốc Bảo',
                            'Bùi Mai Linh','Huỳnh Tấn Phát','Ngô Bảo Châu','Đỗ Khánh Vy','Phan Hoàng Nam','Lý Thảo My',
                            'Trương Đức Anh','Hồ Thị Kim','Dương Nhật Minh','Mai Phương Thảo'];
  v_notes   text[] := array['', '', '', 'Viết chữ "Happy Birthday" giúp mình', 'Ít ngọt', 'Gói hộp quà', 'Lấy thêm nến', 'Gọi trước khi làm'];
  v_slots   text[];
  v_prod    record;
  v_order   uuid;
  v_code    text;
  v_n       int := 0;
  v_day     int;
  v_per_day int;
  v_k       int;
  v_lines   int;
  v_l       int;
  v_qty     int;
  v_total   int;
  v_date    date;
  v_status  text;
  v_pay     text;
  v_pstat   text;
  v_snote   text;
  v_created timestamptz;
  v_paid    timestamptz;
  v_r       float;
begin
  if not exists (select 1 from products where is_active and deleted_at is null) then
    raise exception 'Chưa có món nào – hãy chạy supabase/seed.sql trước.';
  end if;
  select array_agg(id order by sort_order) into v_slots from pickup_slots where is_active;
  if v_slots is null then
    raise exception 'Chưa có khung giờ nhận – hãy chạy supabase/seed.sql trước.';
  end if;

  -- Xoa du lieu mau cu
  delete from payments where order_id in (select id from orders where idempotency_key like 'sample-%');
  delete from orders where idempotency_key like 'sample-%';
  delete from inquiries where phone like '0900000%';

  perform setseed(0.2026);

  for v_day in -30..3 loop
    v_date := v_today + v_day;
    v_per_day := case
      when v_day = 0 then 9                                   -- hom nay nhieu don de thu Tong quan
      when v_day > 0 then 3 + floor(random() * 3)::int        -- don dat truoc
      when extract(isodow from v_date) in (6, 7) then 2 + floor(random() * 3)::int
      else floor(random() * 3)::int
    end;

    for v_k in 1..v_per_day loop
      v_n := v_n + 1;
      v_r := random();
      v_pay := case when random() < 0.6 then 'cod' else 'transfer' end;
      v_snote := null;

      -- Trang thai theo ngay nhan
      if v_day < 0 then
        v_status := case when v_r < 0.84 then 'completed' when v_r < 0.94 then 'cancelled' else 'rejected' end;
      elsif v_day = 0 then
        v_status := (array['pending_confirmation','pending_confirmation','confirmed','preparing','preparing','ready','ready','completed','cancelled'])[v_k];
      else
        v_status := case when v_r < 0.5 then 'pending_confirmation' else 'confirmed' end;
      end if;
      if v_status = 'cancelled' then v_snote := 'Khách báo bận, hẹn đặt lại hôm khác'; end if;
      if v_status = 'rejected'  then v_snote := 'Khung giờ này tiệm đã kín bánh'; end if;

      -- Thanh toan
      if v_status = 'completed' then
        v_pstat := 'paid';
      elsif v_pay = 'transfer' and v_status in ('confirmed','preparing','ready') then
        v_pstat := (array['paid','pending_verification','unpaid'])[1 + floor(random() * 3)::int];
      else
        v_pstat := 'unpaid';
      end if;

      -- Thoi diem dat: 0–2 ngay truoc ngay nhan, khong vuot qua bay gio
      v_created := least(now() - interval '5 minutes',
        ((v_date - floor(random() * 3)::int)::timestamp + interval '7 hours 30 minutes'
          + (random() * interval '13 hours')) at time zone 'Asia/Ho_Chi_Minh');
      v_paid := case when v_pstat = 'paid' then least(now(), v_created + interval '3 hours') else null end;

      v_code := 'YUB-' || to_char(v_date, 'DDMM') || '-9' || lpad(v_n::text, 3, '0');

      insert into orders (code, customer_name, customer_phone, pickup_date, pickup_slot_id, note, status, payment_method,
                          payment_status, total_vnd, idempotency_key, status_note, confirmed_at, paid_at, created_at, updated_at)
      values (v_code,
              v_names[1 + floor(random() * array_length(v_names, 1))::int],
              '0900000' || lpad((1 + floor(random() * 999))::int::text, 3, '0'),
              v_date,
              v_slots[1 + floor(random() * array_length(v_slots, 1))::int],
              trim(v_notes[1 + floor(random() * array_length(v_notes, 1))::int] || ' (đơn mẫu)'),
              v_status, v_pay, v_pstat, 0, 'sample-' || v_n, v_snote,
              case when v_status in ('confirmed','preparing','ready','completed') then v_created + interval '20 minutes' end,
              v_paid, v_created, v_created)
      returning id into v_order;

      -- 1–3 mon, gia lay tu thuc don hien tai
      v_lines := 1 + floor(random() * 3)::int;
      for v_prod in
        select p.id, p.name,
               coalesce(v.price_vnd, p.price_vnd) as price,
               v.id as variant_id, v.label as variant_label
        from products p
        left join lateral (
          select pv.id, pv.label, pv.price_vnd from product_variants pv
          where pv.product_id = p.id and pv.is_active
          order by random() limit 1
        ) v on true
        where p.is_active and p.deleted_at is null
        order by random()
        limit v_lines
      loop
        v_qty := case when random() < 0.7 then 1 else 2 + floor(random() * 3)::int end;
        insert into order_items (order_id, product_id, name_snapshot, unit_price_vnd, qty, line_total_vnd, variant_id, variant_label)
        values (v_order, v_prod.id,
                case when v_prod.variant_label is not null then v_prod.name || ' – ' || v_prod.variant_label else v_prod.name end,
                v_prod.price, v_qty, v_prod.price * v_qty, v_prod.variant_id, v_prod.variant_label);
      end loop;

      select coalesce(sum(line_total_vnd), 0) into v_total from order_items where order_id = v_order;
      update orders set total_vnd = v_total, updated_at = coalesce(v_paid, v_created) where id = v_order;
    end loop;
  end loop;

  -- Cau hoi khach (Hop thu)
  insert into inquiries (name, phone, message, status, created_at) values
    ('Ngọc Trâm',  '0900000101', 'Tiệm có nhận đặt bánh kem 20cm cho sinh nhật cuối tuần không ạ?', 'new', now() - interval '35 minutes'),
    ('Minh Quân',  '0900000102', 'Cho mình hỏi croissant bơ mấy giờ thì có mẻ mới?', 'new', now() - interval '2 hours'),
    ('Thảo Vy',    '0900000103', 'Mình muốn đặt 30 hộp tart cho sự kiện công ty, tiệm báo giá giúp mình nhé.', 'new', now() - interval '5 hours'),
    ('Gia Bảo',    '0900000104', 'Bánh có loại ít đường cho người lớn tuổi không ạ?', 'new', now() - interval '1 day'),
    ('Khánh Linh', '0900000105', 'Tiệm có chỗ đậu xe máy không?', 'answered', now() - interval '1 day 3 hours'),
    ('Hữu Phước',  '0900000106', 'Đồ uống có size L cho trà đào không?', 'answered', now() - interval '2 days'),
    ('Bích Ngọc',  '0900000107', 'Mình chuyển khoản rồi, tiệm kiểm tra giúp đơn của mình nhé.', 'answered', now() - interval '3 days'),
    ('Đức Thịnh',  '0900000108', 'Tiệm mở cửa ngày lễ không ạ?', 'archived', now() - interval '6 days'),
    ('Yến Nhi',    '0900000109', 'Bánh cuộn để tủ lạnh được mấy ngày?', 'archived', now() - interval '9 days'),
    ('Tuấn Kiệt',  '0900000110', 'Có giao hàng tận nơi không ạ?', 'archived', now() - interval '12 days');

  raise notice 'Đã tạo % đơn mẫu và 10 câu hỏi mẫu.', v_n;
end $$;

-- Kiem tra nhanh
select status, payment_method, payment_status, count(*) as so_don, sum(total_vnd) as tong_tien
from orders where idempotency_key like 'sample-%'
group by 1, 2, 3 order by 1, 2, 3;
