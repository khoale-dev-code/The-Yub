-- Xoa toan bo du lieu mau tao boi du-lieu-mau.sql (khong dung toi don / cau hoi that).
delete from payments where order_id in (select id from orders where idempotency_key like 'sample-%');
delete from orders where idempotency_key like 'sample-%';          -- order_items tu xoa theo (on delete cascade)
delete from inquiries where phone like '0900000%';
select 'Đã xoá dữ liệu mẫu' as ket_qua;
