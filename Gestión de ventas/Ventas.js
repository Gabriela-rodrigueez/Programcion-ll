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
    const inputBuscar = document.getElementById('input-buscar-producto');
    const searchResults = document.getElementById('search-results');
    const cartBody = document.getElementById('cart-body');
    const cartTotal = document.getElementById('cart-total');
    const metodoPago = document.getElementById('metodo-pago');
    const btnRegistrarVenta = document.getElementById('btn-registrar-venta');
    const tablaVentasBody = document.getElementById('tabla-ventas-body');
    const mensajeAnulacion = document.getElementById('mensaje-anulacion');

    // Asumimos que la API está en la carpeta de Productos
    const API_URL = '../Gestión de Productos/api_productos.php';

    let carrito = [];
    let productosCache = new Map(); // Para guardar productos ya buscados

    // --- Lógica de Búsqueda (RF22) ---
    inputBuscar.addEventListener('keyup', async (e) => {
        const termino = e.target.value;
        if (termino.length < 3) {
            searchResults.innerHTML = '';
            return;
        }

        try {
            const res = await fetch(`${API_URL}?accion=buscar_producto&term=${termino}`);
            const datos = await res.json();
            
            searchResults.innerHTML = ''; // Limpiar resultados
            if (datos.success && datos.data.length > 0) {
                datos.data.forEach(p => {
                    // Guardar en caché
                    productosCache.set(p.id_Producto.toString(), p); 
                    // Mostrar resultado
                    searchResults.innerHTML += `
                        <div class="p-3 border-b cursor-pointer" data-id="${p.id_Producto}">
                            <p class="font-bold">${p.Nombre}</p>
                            <p class="text-sm text-gray-600">Stock: ${p.Stock_Actual} | Precio: ${formatMoneda(p.Precio_Venta)}</p>
                        </div>
                    `;
                });
            } else {
                searchResults.innerHTML = '<div class="p-3 text-gray-500">No se encontraron productos.</div>';
            }
        } catch (error) {
            console.error('Error buscando producto:', error);
        }
    });

    // --- Lógica de Carrito (RF15) ---
    searchResults.addEventListener('click', (e) => {
        const itemDiv = e.target.closest('div[data-id]');
        if (!itemDiv) return;

        const id = itemDiv.dataset.id;
        const producto = productosCache.get(id);
        
        // Limpiar búsqueda
        searchResults.innerHTML = '';
        inputBuscar.value = '';

        agregarAlCarrito(producto);
    });

    async function agregarAlCarrito(producto) {
        let cantidad = 1;

        // 1. Verificar tipo de venta
        if (producto.Tipo_Venta === 'peso') {
            const peso = prompt(`Producto por peso (Stock: ${producto.Stock_Actual} Kg)\nIngrese el peso (ej: 0.750):`);
            if (peso === null || isNaN(parseFloat(peso)) || parseFloat(peso) <= 0) return;
            cantidad = parseFloat(peso);
        } else {
            const cant = prompt(`Producto por unidad (Stock: ${producto.Stock_Actual})\nIngrese la cantidad:`, "1");
            if (cant === null || isNaN(parseInt(cant)) || parseInt(cant) <= 0) return;
            cantidad = parseInt(cant);
        }

        // 2. Verificar Stock
        if (cantidad > producto.Stock_Actual) {
            alert(`Error: Stock insuficiente. Solo quedan ${producto.Stock_Actual} disponibles.`);
            return;
        }
        
        // 3. Añadir al carrito
        const item = {
            id_Producto: producto.id_Producto,
            nombre: producto.Nombre,
            cantidad: cantidad,
            precio: parseFloat(producto.Precio_Venta),
            subtotal: cantidad * parseFloat(producto.Precio_Venta)
        };
        carrito.push(item);
        renderCarrito();
    }

    function renderCarrito() {
        cartBody.innerHTML = '';
        let total = 0;

        if (carrito.length === 0) {
            cartBody.innerHTML = '<tr><td colspan="5" class="h-[72px] px-4 py-2 text-center text-gray-500">El carrito está vacío</td></tr>';
        } else {
            carrito.forEach((item, index) => {
                total += item.subtotal;
                cartBody.innerHTML += `
                    <tr class="border-t">
                        <td class="px-4 py-2">${item.nombre}</td>
                        <td class="px-4 py-2">${item.cantidad}</td>
                        <td class="px-4 py-2">${formatMoneda(item.precio)}</td>
                        <td class="px-4 py-2">${formatMoneda(item.subtotal)}</td>
                        <td class="px-4 py-2">
                            <button class="text-red-600 btn-quitar-item" data-index="${index}">X</button>
                        </td>
                    </tr>
                `;
            });
        }
        cartTotal.textContent = `Total: ${formatMoneda(total)}`;
    }

    cartBody.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-quitar-item')) {
            const index = e.target.dataset.index;
            carrito.splice(index, 1);
            renderCarrito();
        }
    });

    // --- Registrar Venta (RF15, RF17) ---
    btnRegistrarVenta.addEventListener('click', async () => {
        if (carrito.length === 0) {
            alert('El carrito está vacío.');
            return;
        }

        const datosVenta = {
            accion: 'registrar_venta',
            metodo_pago: metodoPago.value,
            total: carrito.reduce((acc, item) => acc + item.subtotal, 0),
            productos: carrito
        };

        try {
            const res = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datosVenta)
            });
            const datos = await res.json();
            
            if (datos.success) {
                alert('¡Venta registrada con éxito!');
                carrito = [];
                renderCarrito();
                cargarHistorialVentas(); // Recargar el historial
            } else {
                alert('Error al registrar la venta: ' + datos.error);
            }
        } catch (error) {
            console.error('Error al registrar venta:', error);
        }
    });

    // --- Historial y Anulación (RF16) ---
    async function cargarHistorialVentas() {
        try {
            const res = await fetch(`${API_URL}?accion=listar_ventas`);
            const datos = await res.json();

            tablaVentasBody.innerHTML = '';
            if (datos.success && datos.data.length > 0) {
                datos.data.forEach(venta => {
                    tablaVentasBody.innerHTML += `
                        <tr class="border-t ${venta.Anulada == 1 ? 'bg-red-100 line-through' : ''}">
                            <td class="px-4 py-2">#${venta.id_Venta}</td>
                            <td class="px-4 py-2">${venta.Usuario}</td>
                            <td class="px-4 py-2">${venta.Fecha}</td>
                            <td class="px-4 py-2">${formatMoneda(venta.Total)}</td>
                            <td class="px-4 py-2">${venta.Metodo_Pago}</td>
                            <td class="px-4 py-2">${venta.Anulada == 1 ? 'Anulada' : 'Completada'}</td>
                            <td class="px-4 py-2">
                                ${venta.Anulada == 0 ? 
                                    `<button class="text-red-600 font-bold btn-anular" data-id="${venta.id_Venta}">Anular</button>` : 
                                    '---'
                                }
                            </td>
                        </tr>
                    `;
                });
            } else {
                tablaVentasBody.innerHTML = '<tr><td colspan="7" class="h-[72px] px-4 py-2 text-center text-gray-500">No hay ventas registradas.</td></tr>';
            }
        } catch (error) {
            console.error('Error cargando historial:', error);
        }
    }

    tablaVentasBody.addEventListener('click', async (e) => {
        if (e.target.classList.contains('btn-anular')) {
            const idVenta = e.target.dataset.id;
            if (!confirm(`¿Estás seguro de que deseas anular la Venta #${idVenta}? Esta acción devolverá los productos al stock.`)) {
                return;
            }

            try {
                const res = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        accion: 'anular_venta',
                        id_Venta: idVenta
                    })
                });
                const datos = await res.json();
                
                if (datos.success) {
                    mensajeAnulacion.textContent = `Venta #${idVenta} anulada con éxito. Stock revertido.`;
                    mensajeAnulacion.className = 'success';
                    cargarHistorialVentas(); // Recargar
                } else {
                    alert('Error al anular la venta: ' + datos.error);
                }
            } catch (error) {
                console.error('Error al anular:', error);
            }
        }
    });

    cargarHistorialVentas();
});