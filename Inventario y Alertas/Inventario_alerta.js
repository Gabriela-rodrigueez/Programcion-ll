document.addEventListener('DOMContentLoaded', () => {
    
    // --- Selectores del DOM ---
    const cardStockTotal = document.getElementById('card-stock-total');
    const cardStockCritico = document.getElementById('card-stock-critico');
    const cardStockVencimiento = document.getElementById('card-stock-vencimiento');
    const listaAlertas = document.getElementById('lista-alertas-prioritarias');
    const tablaInventarioBody = document.getElementById('tabla-inventario-body');
    
    const API_URL = '../Gestión de Productos/api_productos.php';

    window.addEventListener('load', () => {
        const params = new URLSearchParams(window.location.search);
        const idParaEditar = params.get('editar_id');
        
        if (idParaEditar) {
            setTimeout(() => {
                const botonEditar = document.querySelector(`.btn-editar[data-id="${idParaEditar}"]`);
                if (botonEditar) {
                    botonEditar.click(); 
                } else {
                    console.error('No se encontró el producto para editar en la tabla.');
                }
            }, 1000); 
        }
    });

    //  para cargar todos los datos del dashboard
    async function cargarDashboard() {
        try {
            const respuesta = await fetch(`${API_URL}?accion=obtener_dashboard_inventario`);
            if (!respuesta.ok) {
                throw new Error('Error en la respuesta de la API');
            }
            const datos = await respuesta.json();

            if (datos.success) {
                // 1. Rellenar las Tarjetas
                cardStockTotal.textContent = datos.data.resumen_cards.totalStock || '0';
                cardStockCritico.textContent = datos.data.resumen_cards.criticos || '0';
                cardStockVencimiento.textContent = datos.data.resumen_cards.proximosVencer || '0';

                // 2. Rellenar Alertas Prioritarias
                renderAlertas(datos.data.alertas);

                // 3. Rellenar Tabla de Inventario
                renderTablaInventario(datos.data.tabla_inventario);
            } else {
                throw new Error(datos.error || 'Error al obtener datos');
            }
        } catch (error) {
            console.error('Error al cargar el dashboard:', error);
            listaAlertas.innerHTML = `<p class="text-red-500">No se pudieron cargar los datos del inventario.</p>`;
            tablaInventarioBody.innerHTML = `<tr><td colspan="6" class="h-[72px] px-4 py-2 text-center text-red-500">Error al cargar inventario.</td></tr>`;
        }
    }

    /**
     * Dibuja la lista de alertas (¡MODIFICADA!)
     */
    function renderAlertas(alertas) {
        listaAlertas.innerHTML = '';
        
        // Alerta de Stock Crítico (Stock < Mínimo)
        alertas.stockCritico.forEach(item => {
            let textoStock = item.Stock_Actual <= 0 ? 'agotado (0 unidades)' : `con stock bajo (${item.Stock_Actual} / ${item.Stock_Minimo})`;
            listaAlertas.innerHTML += `
                <div class="flex items-start gap-4 rounded-xl bg-[var(--card-background)] p-4 shadow-[var(--shadow-subtle)] border-l-4 border-[var(--alert-critical)]">
                    <span class="material-symbols-outlined text-[var(--alert-critical)] text-2xl mt-0.5">warning</span>
                    <div class="flex flex-col flex-1">
                        <p class="text-[var(--primary-text)] text-base font-bold leading-tight">Crítico: Stock Agotado</p>
                        <p class="text-[var(--secondary-text)] text-sm font-normal leading-normal">"${item.Nombre}" está ${textoStock}.</p>
                    </div>
                    <button class="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-8 px-4 flex-row-reverse bg-[var(--background-light)] text-[var(--primary-text)] text-sm font-medium leading-normal w-fit btn-reabastecer" data-id="${item.id_Producto}">
                        <span class="truncate">Reabastecer</span>
                    </button>
                </div>`;
        });

        // Alerta de Vencimiento
        alertas.proximosVencer.forEach(item => {
             listaAlertas.innerHTML += `
                <div class="flex items-start gap-4 rounded-xl bg-[var(--card-background)] p-4 shadow-[var(--shadow-subtle)] border-l-4 border-[var(--alert-warning)]">
                    <span class="material-symbols-outlined text-[var(--alert-warning)] text-2xl mt-0.5">notification_important</span>
                    <div class="flex flex-col flex-1">
                        <p class="text-[var(--primary-text)] text-base font-bold leading-tight">Próximo Vencimiento</p>
                        <p class="text-[var(--secondary-text)] text-sm font-normal leading-normal">"${item.Nombre}" vence el ${item.Vencimiento}.</p>
                    </div>
                    <button class="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-8 px-4 flex-row-reverse bg-[var(--background-light)] text-[var(--primary-text)] text-sm font-medium leading-normal w-fit btn-ver-detalles" data-id="${item.id_Producto}">
                        <span class="truncate">Ver Detalles</span>
                    </button>
                </div>`;
        });
        
        // Alerta de Stock Óptimo (Stock == Mínimo)
        alertas.stockOptimo.forEach(item => {
             listaAlertas.innerHTML += `
                <div class="flex items-start gap-4 rounded-xl bg-[var(--card-background)] p-4 shadow-[var(--shadow-subtle)] border-l-4 border-[var(--alert-info)]">
                    <span class="material-symbols-outlined text-[var(--alert-info)] text-2xl mt-0.5">info</span>
                    <div class="flex flex-col flex-1">
                        <p class="text-[var(--primary-text)] text-base font-bold leading-tight">Stock Óptimo Alcanzado</p>
                        <p class="text-[var(--secondary-text)] text-sm font-normal leading-normal">"${item.Nombre}" ha alcanzado su nivel de stock óptimo.</p>
                    </div>
                
                </div>`;
        });

        // Si no hay NINGUNA alerta, mostramos "Todo en Orden"
        if (listaAlertas.innerHTML === '') {
            listaAlertas.innerHTML = `
                <div class="flex items-start gap-4 rounded-xl bg-[var(--card-background)] p-4 shadow-[var(--shadow-subtle)] border-l-4 border-[var(--alert-info)]">
                    <span class="material-symbols-outlined text-[var(--alert-info)] text-2xl mt-0.5">info</span>
                    <div class="flex flex-col flex-1">
                        <p class="text-[var(--primary-text)] text-base font-bold leading-tight">Todo en Orden</p>
                        <p class="text-[var(--secondary-text)] text-sm font-normal leading-normal">No hay alertas críticas de stock o vencimiento.</p>
                    </div>
                </div>`;
        }
    }


    function renderTablaInventario(inventario) {
        tablaInventarioBody.innerHTML = '';
        if (inventario.length === 0) {
            tablaInventarioBody.innerHTML = '<tr><td colspan="6" class="h-[72px] ... text-center">No hay productos en el inventario.</td></tr>';
            return;
        }

        inventario.forEach(item => {
            let estadoHTML = '';
            if (item.Stock_Actual <= 0) {
                estadoHTML = `<div class="flex items-center gap-2"><span class="material-symbols-outlined text-[var(--alert-critical)] text-lg">error</span><span class="text-[var(--alert-critical)] font-medium">Agotado</span></div>`;
            } else if (item.Stock_Actual < item.Stock_Minimo) {
                 estadoHTML = `<div class="flex items-center gap-2"><span class="material-symbols-outlined text-[var(--alert-warning)] text-lg">warning</span><span class="text-[var(--alert-warning)] font-medium">Stock Bajo</span></div>`;
            } else if (item.Stock_Actual == item.Stock_Minimo) {
                estadoHTML = `<div class="flex items-center gap-2"><span class="material-symbols-outlined text-[var(--alert-info)] text-lg">info</span><span class="text-[var(--primary-text)] font-medium">Óptimo</span></div>`;
            } else {
                 estadoHTML = `<div class="flex items-center gap-2"><span class="material-symbols-outlined text-green-600 text-lg">check_circle</span><span class="text-[var(--primary-text)] font-medium">En Stock</span></div>`;
            }

            tablaInventarioBody.innerHTML += `
                <tr class="border-t border-t-[var(--border-color)]">
                    <td class="h-[72px] px-4 py-2 ...">${item.Nombre}</td>
                    <td class="h-[72px] px-4 py-2 ...">${item.Categoria}</td>
                    <td class="h-[72px] px-4 py-2 text-[var(--primary-text)] font-bold text-lg">${item.Stock_Actual}</td>
                    <td class="h-[72px] px-4 py-2 ...">${item.Stock_Minimo}</td>
                    <td class="h-[72px] px-4 py-2 ...">${estadoHTML}</td>
                    <td class="h-[72px] px-4 py-2 text-right">
                        <button class="material-symbols-outlined text-[var(--secondary-text)] hover:text-[var(--primary-text)] btn-ajustar" 
                                data-id="${item.id_Producto}" 
                                data-nombre="${item.Nombre}"
                                data-stock-actual="${item.Stock_Actual}">
                            more_vert
                        </button>
                    </td>
                </tr>
            `;
        });
    }

    
    tablaInventarioBody.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-ajustar')) {
            const id = e.target.dataset.id;
            const nombre = e.target.dataset.nombre;
            const stockActual = e.target.dataset.stockActual;
            
            iniciarAjuste(id, nombre, stockActual);
        }
    });

    //  Inicia el proceso de ajuste de inventario (sin cambios)
    async function iniciarAjuste(id, nombre, stockActual) {
        const nuevaCantidadStr = prompt(`Ajuste de inventario para: ${nombre}\nStock actual: ${stockActual}\n\nIngrese la NUEVA cantidad física total:`);
        
        if (nuevaCantidadStr === null) return; 
        
        const nuevaCantidad = parseInt(nuevaCantidadStr);
        if (isNaN(nuevaCantidad) || nuevaCantidad < 0) {
            alert('Cantidad no válida. Debe ingresar un número.');
            return;
        }

        const motivo = prompt('Motivo del ajuste (ej: "Conteo físico", "Pérdida", "Donación"):');
        if (!motivo) {
            alert('Debe ingresar un motivo para el ajuste.');
            return;
        }

        try {
            const respuesta = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accion: 'ajustar_inventario',
                    id_Producto: id,
                    nuevaCantidad: nuevaCantidad,
                    stockAntiguo: stockActual,
                    motivo: motivo
                })
            });
            
            const datos = await respuesta.json();
            if (datos.success) {
                alert('¡Inventario ajustado con éxito!');
                cargarDashboard(); 
            } else {
                throw new Error(datos.error);
            }
        } catch (error) {
            console.error('Error al ajustar inventario:', error);
            alert('Error al ajustar inventario: ' + error.message);
        }
    }
    

    listaAlertas.addEventListener('click', (e) => {
        if (e.target.closest('.btn-reabastecer')) {
            // alert('Redirigiendo a la pantalla de Compras...');
            window.location.href = '../Registro de compras/Compras_proveedores.html';
        }
        if (e.target.closest('.btn-ver-detalles')) {
            const id = e.target.closest('.btn-ver-detalles').dataset.id;
            // alert(`Redirigiendo a la pantalla de Productos...`);
            window.location.href = `../Gestión de Productos/Productos.html?editar_id=${id}`;
        }
        // if (e.target.closest('.btn-ver-registro')) {
        //     window.location.href = 'Historial_Ajustes.html';
        //     // alert('Redirigiendo a la pantalla de ');
        // }
    });


    // --- Carga Inicial ---
    cargarDashboard();
});