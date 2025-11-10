/**
 * Formatea un número como moneda local (ej: $ 8.000,00)
 */
function formatMoneda(numero) {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(numero)
      .replace('ARS', '$'); 
}

document.addEventListener('DOMContentLoaded', () => {
    // --- Selectores del DOM ---
    const formNuevaCompra = document.getElementById('form-nueva-compra');
    const selectProveedor = document.getElementById('select-proveedor');
    const inputFecha = document.getElementById('input-fecha');
    const formAgregarProducto = document.getElementById('form-agregar-producto');
    
    // --- Selectores de formulario ---
    const labelCantidad = document.getElementById('label-cantidad') || document.getElementById('label-cantidad-peso');
    const inputCantidad = document.getElementById('input-cantidad') || document.getElementById('input-cantidad-peso');
    const campoPeso = document.getElementById('campo-peso');
    const inputPesoUnitario = document.getElementById('input-peso-unitario');
    
    const selectProducto = document.getElementById('select-producto');
    const inputPrecio = document.getElementById('input-precio');
    const tablaProductosAnadidosBody = document.getElementById('tabla-productos-anadidos-body');
    const textoTotal = document.getElementById('texto-total');
    const btnRegistrarCompra = document.getElementById('btn-registrar-compra');
    const tablaComprasBody = document.getElementById('tabla-compras-body');
    
    let idPedidoEditando = null;
    const API_URL = '../Gestión de Productos/api_productos.php';
    let carrito = [];
    let productos = []; 

    // --- cargarSelects() ---
    async function cargarSelects() {
        try {
            const resProv = await fetch(`${API_URL}?accion=listar_proveedores`);
            const datosProv = await resProv.json();
            if (datosProv.success) {
                selectProveedor.innerHTML = '<option value="" disabled selected>Seleccione proveedor</option>';
                datosProv.data.forEach(p => {
                    selectProveedor.innerHTML += `<option value="${p.id_Proveedor}">${p.Nombre}</option>`;
                });
            }
            selectProducto.innerHTML = '<option value="" disabled selected>Seleccione un proveedor primero</option>';
            selectProducto.disabled = true;
        } catch (error) {
            console.error('Error cargando selects:', error);
            selectProveedor.innerHTML = '<option value="">Error al cargar</option>';
        }
    }

    // --- cargarProductosPorProveedor() ---
    async function cargarProductosPorProveedor(idProveedor) {
        if (!idProveedor) {
            selectProducto.innerHTML = '<option value="" disabled selected>Seleccione un proveedor primero</option>';
            selectProducto.disabled = true;
            productos = [];
            return;
        }
        try {
            selectProducto.innerHTML = '<option value="">Cargando productos...</option>';
            selectProducto.disabled = true;
            const resProd = await fetch(`${API_URL}?accion=listar_productos_para_compra&id=${idProveedor}`);
            const datosProd = await resProd.json();
            if (datosProd.success) {
                productos = datosProd.data; 
                selectProducto.innerHTML = '<option value="" disabled selected>Seleccione producto</option>';
                if (productos.length === 0) {
                     selectProducto.innerHTML = '<option value="" disabled>Este proveedor no tiene productos</option>';
                } else {
                    datosProd.data.forEach(p => {
                        selectProducto.innerHTML += `<option value="${p.id_Producto}">${p.Nombre}</option>`;
                    });
                }
                selectProducto.disabled = false;
            }
        } catch (error) {
            console.error('Error cargando productos:', error);
        }
    }

    /**
     * Dibuja la tabla del carrito de compras (¡CORREGIDO!)
     */
    function renderCarrito() {
        tablaProductosAnadidosBody.innerHTML = '';
        let total = 0;
        if (carrito.length === 0) {
            tablaProductosAnadidosBody.innerHTML = '<tr><td colspan="4" class="h-[72px] px-4 py-2 text-center text-gray-500">Aún no hay productos</td></tr>';
            textoTotal.textContent = 'Total: $0.00';
            return;
        }
        carrito.forEach((item, index) => {
            const subtotal = item.cantidad * item.precio;
            total += subtotal;
            const unidadTexto = item.tipoVenta === 'peso' ? 'Kg' : 'U.';
            
            // --- ¡AQUÍ ESTÁ LA CORRECCIÓN! ---
            tablaProductosAnadidosBody.innerHTML += `
                <tr class="border-t border-t-[#dbe0e6]">
                    <td class="h-[72px] px-4 py-2">${item.nombre}</td>
                    <td class="h-[72px] px-4 py-2">${item.cantidad} ${unidadTexto}</td>
                    <td class="h-[72px] px-4 py-2">${formatMoneda(subtotal)}</td>
                </tr>
            `;
        });
        textoTotal.textContent = `Total: ${formatMoneda(total)}`;
    }

    // --- cargarHistorialCompras() ---
    async function cargarHistorialCompras() {
        try {
            const res = await fetch(`${API_URL}?accion=listar_compras`);
            const datos = await res.json();
            tablaComprasBody.innerHTML = '';
            if (datos.success && datos.data.length > 0) {
                datos.data.forEach(compra => {
                    const unidadTexto = compra.Tipo_Venta === 'peso' ? 'Kg' : 'U.';
                    const cantidad = parseFloat(compra.Cantidad);
                    const precio = parseFloat(compra.Precio_Compra);
                    const montoTotal = parseFloat(compra.MontoTotal); 
                    tablaComprasBody.innerHTML += `
                        <tr class="border-t border-t-[#dbe0e6]">
                            <td class="h-[72px] px-4 py-2 font-bold text-[#111418]">#${compra.id_PedidoStock}</td>
                            <td class="h-[72px] px-4 py-2">${compra.ProveedorNombre}</td>
                            <td class="h-[72px] px-4 py-2">${compra.ProductoNombre}</td>
                            <td class="h-[72px] px-4 py-2">${cantidad} ${unidadTexto}</td>
                            <td class="h-[72px] px-4 py-2">${formatMoneda(precio)}</td>
                            <td class="h-[72px] px-4 py-2 font-medium text-[#111418]">${formatMoneda(montoTotal)}</td>
                            <td class="h-[72px] px-4 py-2">${compra.Fecha}</td>
                            <td class="h-[72px] px-4 py-2 text-sm font-bold">
                                <a href="#" class="text-blue-600 hover:underline btn-editar-compra" data-id="${compra.id_PedidoStock}">Editar</a> | 
                                <a href="#" class="text-red-600 hover:underline btn-eliminar-compra" data-id="${compra.id_PedidoStock}">Eliminar</a>
                            </td>
                        </tr>
                    `;
                });
            } else {
                tablaComprasBody.innerHTML = '<tr><td colspan="8" class="h-[72px] px-4 py-2 text-center text-gray-500">No hay compras registradas.</td></tr>';
            }
        } catch (error) {
            console.error('Error cargando historial:', error);
        }
    }

    // --- resetFormularioPrincipal() ---
    function resetFormularioPrincipal() {
        formNuevaCompra.reset();
        formAgregarProducto.reset();
        carrito = [];
        renderCarrito();
        idPedidoEditando = null;
        btnRegistrarCompra.querySelector('span').textContent = 'Registrar Compra';
        selectProducto.innerHTML = '<option value="" disabled selected>Seleccione un proveedor primero</option>';
        selectProducto.disabled = true;
        
        if (campoPeso) campoPeso.classList.add('hidden');
        if (inputPesoUnitario) inputPesoUnitario.value = '';
        if (labelCantidad) labelCantidad.textContent = 'Cantidad (Unidades)';
    }

    // --- Event Listeners ---
    selectProveedor.addEventListener('change', () => {
        const idProveedorSeleccionado = selectProveedor.value;
        cargarProductosPorProveedor(idProveedorSeleccionado);
    });

    selectProducto.addEventListener('change', () => {
        const idSeleccionado = selectProducto.value;
        const producto = productos.find(p => p.id_Producto == idSeleccionado);
        
        if (inputCantidad) inputCantidad.value = '';
        if (inputPesoUnitario) inputPesoUnitario.value = '';

        if (producto && labelCantidad && campoPeso) {
            if (producto.Tipo_Venta === 'peso') {
                labelCantidad.textContent = 'Cantidad (Piezas)';
                inputCantidad.placeholder = 'Ingrese cant. de piezas (ej: 2)';
                inputCantidad.step = '1';
                campoPeso.classList.remove('hidden'); 
            } else {
                labelCantidad.textContent = 'Cantidad (Unidades)';
                inputCantidad.placeholder = 'Ingrese cantidad (ej: 5)';
                inputCantidad.step = '1';
                campoPeso.classList.add('hidden'); 
            }
        }
    });

    formAgregarProducto.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = selectProducto.value;
        const producto = productos.find(p => p.id_Producto == id);
        
        const precioString = inputPrecio.value.replace(/\./g, '');
        const precioLimpio = precioString.replace(',', '.');
        const precio = parseFloat(precioLimpio);

        let cantidadPiezas = parseInt(inputCantidad.value);
        let cantidadTotal;

        if (isNaN(cantidadPiezas) || cantidadPiezas <= 0) {
            cantidadPiezas = 1;
        }

        if (producto.Tipo_Venta === 'peso') {
            const pesoUnitario = parseFloat(inputPesoUnitario.value);
            if (!pesoUnitario || pesoUnitario <= 0) {
                alert('Por favor, ingrese un peso por pieza válido.');
                return;
            }
            cantidadTotal = cantidadPiezas * pesoUnitario;
        } else {
            cantidadTotal = cantidadPiezas;
        }
        
        if (!producto || !cantidadTotal || !precio || cantidadTotal <= 0 || precio <= 0) {
            alert('Por favor, complete todos los campos del producto con valores válidos.');
            return;
        }

        const itemExistente = carrito.find(item => item.id_Producto === id);
        
        if (itemExistente) {
            itemExistente.cantidad += cantidadTotal;
        } else {
            carrito.push({
                id_Producto: id,
                nombre: producto.Nombre,
                cantidad: cantidadTotal, 
                precio: precio, 
                tipoVenta: producto.Tipo_Venta 
            });
        }
        
        renderCarrito();
        formAgregarProducto.reset();
        labelCantidad.textContent = 'Cantidad (Unidades)';
        if(campoPeso) campoPeso.classList.add('hidden');
    });

    // --- ¡ESTA FUNCIÓN ES LA QUE HACE QUE LA 'X' FUNCIONE! ---
    tablaProductosAnadidosBody.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-eliminar-item')) {
            const index = e.target.dataset.index;
            carrito.splice(index, 1); 
            renderCarrito();
        }
    });

    // Registrar la compra final (sin cambios)
    btnRegistrarCompra.addEventListener('click', async () => {
        const formData = new FormData(formNuevaCompra);
        const id_Proveedor = formData.get('id_Proveedor');
        const fecha = formData.get('Fecha');
        if (!id_Proveedor || !fecha) {
            alert('Debe seleccionar un proveedor y una fecha.'); return;
        }
        if (carrito.length === 0) {
            alert('Debe añadir al menos un producto a la compra.'); return;
        }
        const esEdicion = idPedidoEditando !== null;
        const accion = esEdicion ? 'actualizar_compra' : 'registrar_compra';
        const datosCompra = {
            accion: accion,
            id_Proveedor: id_Proveedor,
            Fecha: fecha,
            productos: carrito,
            id_PedidoStock: idPedidoEditando
        };
        try {
            const res = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datosCompra)
            });
            const datos = await res.json();
            if (datos.success) {
                alert(esEdicion ? '¡Compra actualizada con éxito!' : '¡Compra registrada con éxito!');
                resetFormularioPrincipal();
                cargarHistorialCompras(); 
            } else {
                alert('Error al registrar la compra: ' + datos.error);
            }
        } catch (error) {
            console.error('Error de red:', error);
        }
    });

    // Historial de compras (Editar/Eliminar) (sin cambios)
    tablaComprasBody.addEventListener('click', async (e) => {
        e.preventDefault();
        const id = e.target.dataset.id;
        if (!id) return;
        if (e.target.classList.contains('btn-eliminar-compra')) {
            if (confirm(`¿Estás seguro de que deseas eliminar el Pedido #${id}?`)) {
                try {
                    const res = await fetch(`${API_URL}?accion=eliminar_compra&id=${id}`, { method: 'DELETE' });
                    const datos = await res.json();
                    if (datos.success) {
                        alert('Pedido eliminado.');
                        cargarHistorialCompras();
                    } else {
                        alert('Error: ' + datos.error);
                    }
                } catch (error) { console.error('Error al eliminar:', error); }
            }
        }
        if (e.target.classList.contains('btn-editar-compra')) {
            try {
                const res = await fetch(`${API_URL}?accion=obtener_detalle_compra&id=${id}`);
                const datos = await res.json();
                if (datos.success) {
                    const pedido = datos.data;
                    selectProveedor.value = pedido.id_Proveedor;
                    inputFecha.value = pedido.Fecha;
                    carrito = pedido.productos.map(p => ({
                        id_Producto: p.id_Producto,
                        nombre: p.Nombre,
                        cantidad: parseFloat(p.cantidad),
                        precio: parseFloat(p.precio),
                        tipoVenta: p.tipoVenta
                    }));
                    renderCarrito();
                    await cargarProductosPorProveedor(pedido.id_Proveedor); 
                    idPedidoEditando = id;
                    btnRegistrarCompra.querySelector('span').textContent = 'Actualizar Compra';
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                } else {
                    alert('Error al cargar el pedido: ' + datos.error);
                }
            } catch (error) { console.error('Error al obtener detalle:', error); }
        }
    });

    // --- Carga Inicial ---
    cargarSelects();
    cargarHistorialCompras();
});