<?php
session_start();
include '../conexion.php'; 

header('Content-Type: application/json');

function json_response($success, $data = null, $error = null, $code = 200) {
    http_response_code($code);
    echo json_encode(['success' => $success, 'data' => $data, 'error' => $error]);
    exit;
}

$metodo = $_SERVER['REQUEST_METHOD'];
$accion = '';
$datos = [];
$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;


if ($metodo === 'GET' || $metodo === 'DELETE') {
    // Para 'listar', 'obtener' y 'eliminar'
    $accion = isset($_GET['accion']) ? $_GET['accion'] : '';
} elseif ($metodo === 'POST') {
    $datos = json_decode(file_get_contents('php://input'), true);
    $accion = $datos['accion'] ?? '';
}


try {
    switch ($accion) {
        // Categoría
        case 'listar_categorias':
            $stmt = $pdo->query("SELECT id_Categoria, Nombre FROM Categoria ORDER BY Nombre");
            json_response(true, $stmt->fetchAll(PDO::FETCH_ASSOC));
            break;

        case 'agregar_categoria':
            if (empty($datos['nombre'])) {
                json_response(false, null, 'El nombre de la categoría es obligatorio.', 400);
            }

            $sql = "INSERT INTO Categoria (Nombre, Descripcion) VALUES (?, ?)";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                $datos['nombre'],
                $datos['descripcion'] ?? null 
            ]);

            json_response(true, ['id_insertado' => $pdo->lastInsertId()]);
            break;

        case 'obtener_categoria':
            if ($id <= 0) json_response(false, null, 'ID no válido.', 400);
            $stmt = $pdo->prepare("SELECT * FROM Categoria WHERE id_Categoria = ?");
            $stmt->execute([$id]);
            $categoria = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$categoria) json_response(false, null, 'Categoría no encontrada.', 404);
            json_response(true, $categoria);
            break;

        case 'actualizar_categoria':
            if (empty($datos['nombre']) || empty($datos['id_Categoria'])) {
                json_response(false, null, 'Faltan datos (ID o nombre).', 400);
            }
            $sql = "UPDATE Categoria SET Nombre = ?, Descripcion = ? WHERE id_Categoria = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                $datos['nombre'],
                $datos['descripcion'] ?? null,
                $datos['id_Categoria']
            ]);
            json_response(true);
            break;

            
        // Proveedor
        case 'listar_proveedores':
            $stmt = $pdo->query("SELECT id_Proveedor, Nombre, Direccion, Contacto FROM Proveedor ORDER BY Nombre");
            json_response(true, $stmt->fetchAll(PDO::FETCH_ASSOC));
            break;

        case 'agregar_proveedor':
            if (empty($datos['Nombre'])) json_response(false, null, 'El nombre es obligatorio.', 400);
            
            $sql = "INSERT INTO Proveedor (Nombre, Direccion, Contacto) VALUES (?, ?, ?)";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$datos['Nombre'], $datos['Direccion'] ?? null, $datos['Contacto'] ?? null]);
            json_response(true, ['id_insertado' => $pdo->lastInsertId()]);
            break;

        case 'obtener_proveedor':
            if ($id <= 0) json_response(false, null, 'ID no válido.', 400);
            $stmt = $pdo->prepare("SELECT * FROM Proveedor WHERE id_Proveedor = ?");
            $stmt->execute([$id]);
            json_response(true, $stmt->fetch(PDO::FETCH_ASSOC));
            break;


        case 'actualizar_proveedor':
            if (empty($datos['Nombre']) || empty($datos['id_Proveedor'])) {
                json_response(false, null, 'Faltan datos obligatorios.', 400);
            }
            $sql = "UPDATE Proveedor SET Nombre = ?, Direccion = ?, Contacto = ? WHERE id_Proveedor = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                $datos['Nombre'], $datos['Direccion'] ?? null, $datos['Contacto'] ?? null, $datos['id_Proveedor']
            ]);
            json_response(true);
            break;

        case 'eliminar_proveedor':
            if ($id <= 0) json_response(false, null, 'ID no válido.', 400);
            $sql = "DELETE FROM Proveedor WHERE id_Proveedor = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$id]);
            json_response(true);
            break;

        case 'listar_productos_por_proveedor':
            if ($id <= 0) json_response(false, null, 'ID de proveedor no válido.', 400);
            $stmt = $pdo->prepare("SELECT Nombre, Stock_Actual AS Stock, Estado FROM Productos WHERE id_Proveedor = ?");
            $stmt->execute([$id]);
            json_response(true, $stmt->fetchAll(PDO::FETCH_ASSOC));
            break;



        // Productos 
        case 'listar_productos':
            $sql = "SELECT p.id_Producto, p.Nombre, p.Descripcion, 
                           p.Precio_Venta, p.Stock_Actual, 
                           p.Tipo_Venta, 
                           c.Nombre AS CategoriaNombre 
                    FROM Productos p
                    LEFT JOIN Categoria c ON p.id_Categoria = c.id_Categoria
                    ORDER BY p.Nombre";
            $stmt = $pdo->query($sql);
            json_response(true, $stmt->fetchAll(PDO::FETCH_ASSOC));
            break;

        case 'agregar_producto':
            $vencimiento = !empty($datos['Vencimiento']) ? $datos['Vencimiento'] : null;

            $sql = "INSERT INTO Productos (id_Categoria, id_Proveedor, Nombre, Descripcion, Tipo_Venta, Precio_Compra, Precio_Venta, Stock_Actual, Stock_Minimo, Vencimiento) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"; 
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                $datos['id_Categoria'], $datos['id_Proveedor'], $datos['Nombre'],
                $datos['Descripcion'] ?? null,
                $datos['Tipo_Venta'], 
                $datos['Precio_Compra'], $datos['Precio_Venta'], $datos['Stock_Actual'],
                $datos['Stock_Minimo'] ?? 0, 
                $vencimiento
            ]);
            json_response(true, ['id_insertado' => $pdo->lastInsertId()]);
            break;

        case 'obtener_producto':
            if ($id <= 0) json_response(false, null, 'ID no válido.', 400);
            $stmt = $pdo->prepare("SELECT * FROM Productos WHERE id_Producto = ?");
            $stmt->execute([$id]);
            json_response(true, $stmt->fetch(PDO::FETCH_ASSOC));
            break;

        case 'actualizar_producto':
            $vencimiento = !empty($datos['Vencimiento']) ? $datos['Vencimiento'] : null;
            $idProducto = $datos['id_Producto'];
            $precioVentaNuevo = $datos['Precio_Venta'];
            $precioCompraNuevo = $datos['Precio_Compra'];
            
            $pdo->beginTransaction(); 
            try {

                //  Obtenemos los precios antiguos ANTES de actualizar
                $stmtAntiguo = $pdo->prepare("SELECT Precio_Venta, Precio_Compra FROM Productos WHERE id_Producto = ?");
                $stmtAntiguo->execute([$idProducto]);
                $preciosAntiguos = $stmtAntiguo->fetch(PDO::FETCH_ASSOC);
                
                //  Actualizamos el producto (tu código original)
                $sql = "UPDATE Productos SET id_Categoria = ?, id_Proveedor = ?, Nombre = ?, Descripcion = ?, Tipo_Venta = ?, Precio_Compra = ?, Precio_Venta = ?, Stock_Actual = ?, Stock_Minimo = ?, Vencimiento = ? 
                        WHERE id_Producto = ?";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([
                    $datos['id_Categoria'], $datos['id_Proveedor'], $datos['Nombre'],
                    $datos['Descripcion'] ?? null, $datos['Tipo_Venta'],
                    $precioCompraNuevo, $precioVentaNuevo, // Precios nuevos
                    $datos['Stock_Actual'], $datos['Stock_Minimo'] ?? 0,
                    $vencimiento, $idProducto
                ]);

                // Guardamos el historial si el PRECIO DE VENTA cambió
                if ($preciosAntiguos && $preciosAntiguos['Precio_Venta'] != $precioVentaNuevo) {
                    $stmtHistorial = $pdo->prepare(
                        "INSERT INTO Historial_precios (id_Producto, Precio_Antiguo, Precio_Nuevo, Motivo) 
                         VALUES (?, ?, ?, ?)"
                    );
                    $stmtHistorial->execute([
                        $idProducto, 
                        $preciosAntiguos['Precio_Venta'], // Precio antiguo
                        $precioVentaNuevo, // Precio nuevo
                        "Actualización desde módulo de productos" // Motivo
                    ]);
                }
                

                $pdo->commit(); 
                json_response(true);

            } catch (Exception $e) {
                $pdo->rollBack(); 
                json_response(false, null, 'Error en transacción: ' . $e->getMessage(), 500);
            }
            break;

        case 'eliminar_producto':
            if ($id <= 0) json_response(false, null, 'ID no válido.', 400);
            $stmt = $pdo->prepare("DELETE FROM Productos WHERE id_Producto = ?");
            $stmt->execute([$id]);
            json_response(true);
            break;


        // Compras a proveedores

        case 'registrar_compra':
            if (empty($datos['id_Proveedor']) || empty($datos['productos'])) {
                 json_response(false, null, 'Faltan datos.', 400);
            }
            $pdo->beginTransaction();
            try {
                $sqlPedido = "INSERT INTO Pedido_Stock (id_Proveedor, Fecha) VALUES (?, ?)";
                $stmtPedido = $pdo->prepare($sqlPedido);
                $stmtPedido->execute([$datos['id_Proveedor'], $datos['Fecha']]);
                $id_PedidoStock = $pdo->lastInsertId();

                $sqlProdPedido = "INSERT INTO Prod_Pedido (id_PedidoStock, id_Producto, Cantidad, Precio_Compra) VALUES (?, ?, ?, ?)";
                $stmtProdPedido = $pdo->prepare($sqlProdPedido);
                
                $sqlStockUpdate = "UPDATE Productos SET Stock_Actual = Stock_Actual + ? WHERE id_Producto = ?";
                $stmtStockUpdate = $pdo->prepare($sqlStockUpdate);

                foreach ($datos['productos'] as $producto) {
                    $stmtProdPedido->execute([$id_PedidoStock, $producto['id_Producto'], $producto['cantidad'], $producto['precio']]);
                    $stmtStockUpdate->execute([$producto['cantidad'], $producto['id_Producto']]);
                }
                $pdo->commit();
                json_response(true, ['id_pedido' => $id_PedidoStock]);
            } catch (Exception $e) {
                $pdo->rollBack();
                json_response(false, null, 'Error en transacción: ' . $e->getMessage(), 500);
            }
            break;

        case 'listar_compras':
            $sql = "SELECT 
                        ps.id_PedidoStock,
                        pr.Nombre AS ProveedorNombre,
                        p.Nombre AS ProductoNombre,
                        p.Tipo_Venta, 
                        pp.Cantidad,
                        pp.Precio_Compra,
                        (pp.Cantidad * pp.Precio_Compra) AS MontoTotal,
                        ps.Fecha
                    FROM Prod_Pedido pp
                    JOIN Pedido_Stock ps ON pp.id_PedidoStock = ps.id_PedidoStock
                    JOIN Proveedor pr ON ps.id_Proveedor = pr.id_Proveedor
                    JOIN Productos p ON pp.id_Producto = p.id_Producto
                    ORDER BY ps.Fecha DESC, ps.id_PedidoStock DESC";
            
            $stmt = $pdo->query($sql);
            json_response(true, $stmt->fetchAll(PDO::FETCH_ASSOC));
            break;

        case 'listar_productos_para_compra':
            if ($id <= 0) json_response(false, null, 'ID de proveedor no válido.', 400);
            
            // Selecciona productos activos de un proveedor específico
            $stmt = $pdo->prepare("
                SELECT id_Producto, Nombre, Tipo_Venta 
                FROM Productos 
                WHERE id_Proveedor = ? AND Estado = 1 
                ORDER BY Nombre
            ");
            $stmt->execute([$id]);
            $productos = $stmt->fetchAll(PDO::FETCH_ASSOC);
            json_response(true, $productos);
            break;
        
        case 'obtener_detalle_compra':
            if ($id <= 0) json_response(false, null, 'ID no válido.', 400);
            
            $stmt = $pdo->prepare("SELECT id_PedidoStock, id_Proveedor, Fecha FROM Pedido_Stock WHERE id_PedidoStock = ?");
            $stmt->execute([$id]);
            $pedido = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$pedido) json_response(false, null, 'Pedido no encontrado.', 404);

            $stmt = $pdo->prepare("
                SELECT p.id_Producto, p.Nombre, p.Tipo_Venta AS tipoVenta, pp.Cantidad AS cantidad, pp.Precio_Compra AS precio 
                FROM Prod_Pedido pp
                JOIN Productos p ON pp.id_Producto = p.id_Producto
                WHERE pp.id_PedidoStock = ?
            ");
            $stmt->execute([$id]);
            $productos = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $pedido['productos'] = $productos;
            json_response(true, $pedido);
            break;

        case 'actualizar_compra':
            if (empty($datos['id_PedidoStock']) || empty($datos['id_Proveedor']) || empty($datos['productos'])) {
                json_response(false, null, 'Faltan datos.', 400);
            }
            $id_PedidoStock = $datos['id_PedidoStock'];
            $pdo->beginTransaction();
            try {
                $sqlPedido = "UPDATE Pedido_Stock SET id_Proveedor = ?, Fecha = ? WHERE id_PedidoStock = ?";
                $stmtPedido = $pdo->prepare($sqlPedido);
                $stmtPedido->execute([$datos['id_Proveedor'], $datos['Fecha'], $id_PedidoStock]);
                
                $pdo->prepare("DELETE FROM Prod_Pedido WHERE id_PedidoStock = ?")->execute([$id_PedidoStock]);

                $sqlProdPedido = "INSERT INTO Prod_Pedido (id_PedidoStock, id_Producto, Cantidad, Precio_Compra) VALUES (?, ?, ?, ?)";
                $stmtProdPedido = $pdo->prepare($sqlProdPedido);

                foreach ($datos['productos'] as $producto) {
                    $stmtProdPedido->execute([$id_PedidoStock, $producto['id_Producto'], $producto['cantidad'], $producto['precio']]);
                }

                $pdo->commit();
                json_response(true, ['id_pedido' => $id_PedidoStock]);
            } catch (Exception $e) {
                $pdo->rollBack();
                json_response(false, null, 'Error en transacción: ' . $e->getMessage(), 500);
            }
            break;

        case 'eliminar_compra':
            if ($id <= 0) json_response(false, null, 'ID no válido.', 400);
            $pdo->beginTransaction();
            try {
                $pdo->prepare("DELETE FROM Prod_Pedido WHERE id_PedidoStock = ?")->execute([$id]);
                $pdo->prepare("DELETE FROM Pedido_Stock WHERE id_PedidoStock = ?")->execute([$id]);
                $pdo->commit();
                json_response(true);
            } catch (Exception $e) {
                 $pdo->rollBack();
                json_response(false, null, 'Error en transacción: ' . $e->getMessage(), 500);
            }
            break;

        // Inventario y Alertas
        case 'obtener_dashboard_inventario':
            $datos = [];
            
            $stmt = $pdo->query("
                SELECT 
                    SUM(Stock_Actual) as totalStock,
                    COUNT(CASE WHEN Stock_Actual <= Stock_Minimo THEN 1 END) as criticos,
                    COUNT(CASE WHEN Vencimiento BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 15 DAY) THEN 1 END) as proximosVencer 
                FROM Productos
            ");
            $datos['resumen_cards'] = $stmt->fetch(PDO::FETCH_ASSOC);

            
            // Alerta 1: Crítico 
            $stmtCritico = $pdo->query("
                SELECT id_Producto, Nombre, Stock_Actual, Stock_Minimo 
                FROM Productos 
                WHERE Stock_Actual < Stock_Minimo 
                ORDER BY (Stock_Actual - Stock_Minimo) ASC 
                LIMIT 2
            ");

            // Alerta 2: Vencimiento (Vence en 15 días)
            $stmtVencer = $pdo->query("
                SELECT id_Producto, Nombre, Vencimiento 
                FROM Productos 
                WHERE Vencimiento BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 15 DAY) 
                ORDER BY Vencimiento ASC 
                LIMIT 1
            ");
            
            // Alerta 3: Óptimo 
            $stmtOptimo = $pdo->query("
                SELECT id_Producto, Nombre 
                FROM Productos 
                WHERE Stock_Actual = Stock_Minimo AND Stock_Actual > 0
                LIMIT 1
            ");
            
            $datos['alertas'] = [
                'stockCritico' => $stmtCritico->fetchAll(PDO::FETCH_ASSOC),
                'proximosVencer' => $stmtVencer->fetchAll(PDO::FETCH_ASSOC),
                'stockOptimo' => $stmtOptimo->fetchAll(PDO::FETCH_ASSOC)
            ];

            $stmtTabla = $pdo->query("
                SELECT p.id_Producto, p.Nombre, c.Nombre as Categoria, p.Stock_Actual, p.Stock_Minimo 
                FROM Productos p 
                LEFT JOIN Categoria c ON p.id_Categoria = c.id_Categoria 
                ORDER BY p.Stock_Actual ASC, p.Nombre ASC
            ");
            $datos['tabla_inventario'] = $stmtTabla->fetchAll(PDO::FETCH_ASSOC);

            json_response(true, $datos);
            break;

        // Ajuste de Inventario 
        case 'ajustar_inventario':
            if (!isset($datos['id_Producto']) || !isset($datos['nuevaCantidad']) || !isset($datos['stockAntiguo']) || empty($datos['motivo'])) {
                json_response(false, null, 'Faltan datos para el ajuste.', 400);
            }
            
            $idProducto = $datos['id_Producto'];
            $nuevaCantidad = $datos['nuevaCantidad'];
            $stockAntiguo = $datos['stockAntiguo'];
            $motivo = $datos['motivo'];
            
            // Calculamos la diferencia
            $cantidadAjustada = $nuevaCantidad - $stockAntiguo; 

            $pdo->beginTransaction();
            try {
                //  Actualizar el stock en la tabla Productos
                $stmtUpdate = $pdo->prepare("UPDATE Productos SET Stock_Actual = ? WHERE id_Producto = ?");
                $stmtUpdate->execute([$nuevaCantidad, $idProducto]);

                //  Registrar el movimiento en la tabla Ajustes_Inventario
                $stmtLog = $pdo->prepare("INSERT INTO Ajustes_Inventario (id_Producto, Cantidad_Ajustada, Motivo) VALUES (?, ?, ?)");
                $stmtLog->execute([$idProducto, $cantidadAjustada, $motivo]);

                $pdo->commit();
                json_response(true, ['mensaje' => 'Inventario ajustado correctamente.']);

            } catch (Exception $e) {
                $pdo->rollBack();
                json_response(false, null, 'Error en transacción: ' . $e->getMessage(), 500);
            }
            break;







        case 'buscar_producto':
            $term = isset($_GET['term']) ? $_GET['term'] : '';
            if (empty($term)) {
                json_response(false, [], 'Término de búsqueda vacío');
                break;
            }
            $stmt = $pdo->prepare("
                SELECT id_Producto, Nombre, Precio_Venta, Stock_Actual, Tipo_Venta 
                FROM Productos 
                WHERE Nombre LIKE ? AND Estado = 1 
                LIMIT 5
            ");
            $stmt->execute(["%$term%"]);
            json_response(true, $stmt->fetchAll(PDO::FETCH_ASSOC));
            break;

        case 'listar_ventas':
            @session_start();
            
            $sql = "SELECT v.id_Venta, u.Nombre AS Usuario, v.Fecha, v.Total, v.Metodo_Pago, v.Anulada 
                    FROM Venta v 
                    LEFT JOIN Usuario u ON v.id_Usuario = u.id_Usuario 
                    ORDER BY v.id_Venta DESC";
            $stmt = $pdo->query($sql);
            json_response(true, $stmt->fetchAll(PDO::FETCH_ASSOC));
            break;

        case 'registrar_venta':
            @session_start();
            $id_Usuario = $_SESSION['id_usuario'] ?? null; 
            if ($id_Usuario === null) {
                json_response(false, null, 'Error: Sesión no iniciada. No se pudo registrar la venta.', 401);
                break;
            }
            if (empty($datos['productos'])) {
                json_response(false, null, 'No hay productos en la venta.', 400);
            }

            $pdo->beginTransaction();
            try {
                // 1. Crear la Venta
                $sqlVenta = "INSERT INTO Venta (id_Usuario, Total, Metodo_Pago) VALUES (?, ?, ?)";
                $stmtVenta = $pdo->prepare($sqlVenta);
                $stmtVenta->execute([$id_Usuario, $datos['total'], $datos['metodo_pago']]);
                $id_Venta = $pdo->lastInsertId();

                // 2. Preparar consultas de productos
                $sqlProd = "INSERT INTO ProdVenta (id_Venta, id_Producto, Cantidad, Precio_Unitario, Subtotal) VALUES (?, ?, ?, ?, ?)";
                $stmtProd = $pdo->prepare($sqlProd);
                
                $sqlStock = "UPDATE Productos SET Stock_Actual = Stock_Actual - ? WHERE id_Producto = ?";
                $stmtStock = $pdo->prepare($sqlStock);

                // 3. Insertar cada producto y descontar stock
                foreach ($datos['productos'] as $prod) {
                    $stmtProd->execute([
                        $id_Venta,
                        $prod['id_Producto'],
                        $prod['cantidad'],
                        $prod['precio'],
                        $prod['subtotal']
                    ]);
                    $stmtStock->execute([$prod['cantidad'], $prod['id_Producto']]);
                }
                
                $pdo->commit();
                json_response(true, ['id_venta' => $id_Venta]);

            } catch (Exception $e) {
                $pdo->rollBack();
                json_response(false, null, 'Error en transacción: ' . $e->getMessage(), 500);
            }
            break;

        case 'anular_venta':
            if (empty($datos['id_Venta'])) {
                json_response(false, null, 'No se especificó el ID de la venta.', 400);
            }
            $id_Venta = $datos['id_Venta'];

            $pdo->beginTransaction();
            try {
                // 1. Marcar la venta como anulada
                $stmtAnular = $pdo->prepare("UPDATE Venta SET Anulada = 1 WHERE id_Venta = ?");
                $stmtAnular->execute([$id_Venta]);

                // 2. Obtener los productos que se vendieron
                $stmtProd = $pdo->prepare("SELECT id_Producto, Cantidad FROM ProdVenta WHERE id_Venta = ?");
                $stmtProd->execute([$id_Venta]);
                $productos = $stmtProd->fetchAll(PDO::FETCH_ASSOC);

                // 3. Preparar la consulta para devolver el stock
                $sqlStock = "UPDATE Productos SET Stock_Actual = Stock_Actual + ? WHERE id_Producto = ?";
                $stmtStock = $pdo->prepare($sqlStock);

                // 4. Devolver el stock de cada producto
                foreach ($productos as $prod) {
                    $stmtStock->execute([$prod['Cantidad'], $prod['id_Producto']]);
                }

                $pdo->commit();
                json_response(true);

            } catch (Exception $e) {
                $pdo->rollBack();
                json_response(false, null, 'Error en transacción: ' . $e->getMessage(), 500);
            }
            break;





            // Reportes
        case 'reporte_tendencia_mensual':
            $stmtTotal = $pdo->query("
                SELECT SUM(Total) as totalVentas 
                FROM Venta 
                WHERE Anulada = 0 AND Fecha >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)
            ");
            $total = $stmtTotal->fetch(PDO::FETCH_ASSOC)['totalVentas'] ?? 0;

            $stmtGrafico = $pdo->query("
                SELECT MONTH(Fecha) as mes, YEAR(Fecha) as anio, SUM(Total) as total 
                FROM Venta 
                WHERE Anulada = 0 AND Fecha >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH)
                GROUP BY YEAR(Fecha), MONTH(Fecha)
                ORDER BY anio ASC, mes ASC
            ");
            
            $datos = [
                'totalFormateado' => '$' . number_format($total, 0),
                'porcentajeFormateado' => '+15%', 
                'datosGrafico' => $stmtGrafico->fetchAll(PDO::FETCH_ASSOC)
            ];
            json_response(true, $datos);
            break;

        // Visualización de productos más vendidos (Dashboard)
        case 'reporte_mas_vendidos':
            $stmtTotal = $pdo->query("
                SELECT SUM(pv.Cantidad) as totalUnidades
                FROM ProdVenta pv
                JOIN Venta v ON pv.id_Venta = v.id_Venta
                WHERE v.Anulada = 0 
                  AND MONTH(v.Fecha) = MONTH(CURRENT_DATE()) 
                  AND YEAR(v.Fecha) = YEAR(CURRENT_DATE())
            ");
            $totalUnidades = $stmtTotal->fetch(PDO::FETCH_ASSOC)['totalUnidades'] ?? 0;
            
            $stmtGrafico = $pdo->query("
                SELECT p.Nombre, SUM(pv.Cantidad) as unidades
                FROM ProdVenta pv
                JOIN Productos p ON pv.id_Producto = p.id_Producto
                JOIN Venta v ON pv.id_Venta = v.id_Venta
                WHERE v.Anulada = 0 
                  AND MONTH(v.Fecha) = MONTH(CURRENT_DATE()) 
                  AND YEAR(v.Fecha) = YEAR(CURRENT_DATE())
                GROUP BY p.id_Producto, p.Nombre
                ORDER BY unidades DESC
                LIMIT 5
            ");
            
            $datos = [
                'totalFormateado' => number_format($totalUnidades, 0) . ' Unidades',
                'porcentajeFormateado' => '+8%', 
                'datosGrafico' => $stmtGrafico->fetchAll(PDO::FETCH_ASSOC)
            ];
            json_response(true, $datos);
            break;

        //   Consulta de Historial de Ventas por Producto (Filtrable)
        case 'reporte_historial_ventas':
            $fecha_inicio = $_GET['fecha_inicio'] ?? '2000-01-01';
            $fecha_fin = $_GET['fecha_fin'] ?? '2099-12-31';
            $id_categoria = isset($_GET['id_categoria']) ? (int)$_GET['id_categoria'] : 0;

            if (empty($fecha_inicio)) $fecha_inicio = '2000-01-01';
            if (empty($fecha_fin)) $fecha_fin = '2099-12-31';

            $sql = "SELECT 
                        v.Fecha, 
                        p.Nombre as Producto, 
                        pv.Cantidad,
                        pv.Subtotal
                    FROM ProdVenta pv
                    JOIN Venta v ON pv.id_Venta = v.id_Venta
                    JOIN Productos p ON pv.id_Producto = p.id_Producto
                    WHERE v.Anulada = 0 AND v.Fecha BETWEEN ? AND ?";
            
            $params = [$fecha_inicio, $fecha_fin];

            if ($id_categoria > 0) {
                $sql .= " AND p.id_Categoria = ?";
                $params[] = $id_categoria;
            }
            
            $sql .= " ORDER BY v.Fecha DESC, p.Nombre ASC";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            
            $resultado = [];
            foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
                $resultado[] = [
                    'Fecha' => date('Y-m-d', strtotime($row['Fecha'])),
                    'Producto' => $row['Producto'],
                    'CantidadVendida' => $row['Cantidad'],
                    'Ingresos' => '$' . number_format($row['Subtotal'], 0),
                    'Descuento' => '0%' 
                ];
            }
            json_response(true, $resultado);
            break;

        //  Reporte para la tabla "Rendimiento del Producto"
        case 'reporte_rendimiento_producto':
            $sql = "SELECT 
                        p.Nombre as Producto,
                        SUM(COALESCE(pv.Subtotal, 0)) as VentasTotales,
                        SUM(COALESCE(pv.Cantidad, 0)) as UnidadesVendidas,
                        AVG(COALESCE(pv.Precio_Unitario, 0)) as PrecioPromedio,
                        p.Stock_Actual as NivelStock
                    FROM Productos p
                    LEFT JOIN ProdVenta pv ON p.id_Producto = pv.id_Producto
                    LEFT JOIN Venta v ON pv.id_Venta = v.id_Venta AND v.Anulada = 0
                    GROUP BY p.id_Producto, p.Nombre, p.Stock_Actual
                    ORDER BY VentasTotales DESC";
            
            $stmt = $pdo->query($sql);
            
            $resultado = [];
            foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
                 $resultado[] = [
                    'Producto' => $row['Producto'],
                    'VentasTotales' => '$' . number_format($row['VentasTotales'], 0),
                    'UnidadesVendidas' => $row['UnidadesVendidas'],
                    'PrecioPromedio' => '$' . number_format($row['PrecioPromedio'], 2),
                    'NivelStock' => $row['NivelStock']
                 ];
            }
            json_response(true, $resultado);
            break;

        //  Visualización de productos de baja rotación (Consulta)
        case 'reporte_baja_rotacion':
            // Productos que no se han vendido en los últimos 6 meses
            $sql = "SELECT p.Nombre, p.Stock_Actual
                    FROM Productos p
                    WHERE p.id_Producto NOT IN (
                        SELECT DISTINCT pv.id_Producto 
                        FROM ProdVenta pv 
                        JOIN Venta v ON pv.id_Venta = v.id_Venta 
                        WHERE v.Fecha >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH)
                    )
                    ORDER BY p.Stock_Actual DESC";
            $stmt = $pdo->query($sql);
            json_response(true, $stmt->fetchAll(PDO::FETCH_ASSOC));
            break;

        //  Actualización de Precios de Productos por inflación
         
        case 'actualizar_precios_inflacion':
            if (!isset($datos['porcentaje']) || $datos['porcentaje'] <= 0) {
                 json_response(false, null, 'Porcentaje no válido.', 400);
            }
            $porcentaje = (float)$datos['porcentaje'] / 100; 
            $motivo = $datos['motivo'] ?? 'Ajuste por inflación';

            $pdo->beginTransaction();
            try {
                $stmt = $pdo->query("SELECT id_Producto, Precio_Venta FROM Productos");
                $productos = $stmt->fetchAll(PDO::FETCH_ASSOC);

                $stmtUpdate = $pdo->prepare("UPDATE Productos SET Precio_Venta = ? WHERE id_Producto = ?");
                
                $stmtHistorial = $pdo->prepare(
                    "INSERT INTO Historial_precios (id_Producto, Precio_Antiguo, Precio_Nuevo, Motivo) 
                     VALUES (?, ?, ?, ?)"
                );

                foreach ($productos as $prod) {
                    $precioAntiguo = $prod['Precio_Venta'];
                    $precioNuevo = $precioAntiguo * (1 + $porcentaje);
                    
                    $stmtUpdate->execute([$precioNuevo, $prod['id_Producto']]);
                    $stmtHistorial->execute([$prod['id_Producto'], $precioAntiguo, $precioNuevo, $motivo]);
                }

                $pdo->commit();
                json_response(true, ['mensaje' => count($productos) . ' productos actualizados.']);
            } catch (Exception $e) {
                $pdo->rollBack();
                json_response(false, null, 'Error en transacción: ' . $e->getMessage(), 500);
            }
            break;

        // Notificación por precios desactualizados (Consulta)
        case 'reporte_precios_desactualizados':
            // Productos cuyo precio no cambió en los últimos X meses (ej. 6 meses)
            $sql = "SELECT p.id_Producto, p.Nombre, p.Precio_Venta, MAX(hp.Fecha_Cambio) as UltimoCambio
                    FROM Productos p
                    LEFT JOIN Historial_precios hp ON p.id_Producto = hp.id_Producto
                    GROUP BY p.id_Producto, p.Nombre, p.Precio_Venta
                    HAVING (UltimoCambio IS NULL OR UltimoCambio < DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH))";
            
            $stmt = $pdo->query($sql);
            json_response(true, $stmt->fetchAll(PDO::FETCH_ASSOC));
            break;

        default:
            json_response(false, null, 'Acción no válida.', 404);
            break;
    }
} catch (\PDOException $e) {
    json_response(false, null, 'Error de base de datos: ' . $e->getMessage(), 500);
}
?>