SELECT COUNT(*) AS produtos_teste FROM products WHERE name LIKE 'Produto Teste E2E%';
SELECT COUNT(*) AS pedidos_teste FROM orders WHERE order_number LIKE 'PED-MSG%';
SELECT COUNT(*) AS payments_teste FROM payments WHERE order_id IN (SELECT id FROM orders WHERE order_number LIKE 'PED-MSG%');
