document.addEventListener('DOMContentLoaded', () => {
    // --- Selectores del DOM ---
    const formNuevoProducto = document.getElementById('form-nuevo-producto');
    const selectCategoria = document.getElementById('select-categoria');
    const selectProveedor = document.getElementById('select-proveedor');
    const tablaProductosBody = document.getElementById('tabla-productos-body');
    const formTitulo = document.getElementById('form-titulo');
    const formBotonSubmit = document.getElementById('form-boton-submit');
    const inputEditId = document.getElementById('edit-producto-id');

    const API_URL = 'api_productos.php';

    // --- Carga de datos en Selects ---
    async function cargarSelects() {
        try {
            // Cargar Categorías
            const resCategorias = await fetch(`${API_URL}?accion=listar_categorias`);
            const datosCategorias = await resCategorias.json();
            if (datosCategorias.success) {
                selectCategoria.innerHTML = '<option value="" disabled selected>Seleccione categoría</option>'; 
                datosCategorias.data.forEach(cat => {
                    selectCategoria.innerHTML += `<option value="${cat.id_Categoria}">${cat.Nombre}</option>`;
                });
            }
            
            // Cargar Proveedores
            const resProveedores = await fetch(`${API_URL}?accion=listar_proveedores`);
            const datosProveedores = await resProveedores.json();
            if (datosProveedores.success) {
                selectProveedor.innerHTML = '<option value="" disabled selected>Seleccione proveedor</option>'; 
                datosProveedores.data.forEach(prov => {
                    selectProveedor.innerHTML += `<option value="${prov.id_Proveedor}">${prov.Nombre}</option>`;
                });
            }
        } catch (error) {
            console.error('Error cargando selects:', error);
        }
    }

    async function cargarProductos() {
        try {
            const respuesta = await fetch(`${API_URL}?accion=listar_productos`);
            const datos = await respuesta.json();

            tablaProductosBody.innerHTML = '';
            if (datos.success && datos.data.length > 0) {
                datos.data.forEach(p => {
                    tablaProductosBody.innerHTML += `
                        <tr class="border-t border-t-[#dbe0e6]">
                            <td class="h-[72px] px-4 py-2 text-[#111418]">${p.Nombre}</td>
                            <td class="h-[72px] px-4 py-2 text-[#617589]">${p.Descripcion || ''}</td>
                            <td class="h-[72px] px-4 py-2 text-[#617589]">${p.CategoriaNombre || 'N/A'}</td>
                            <td class="h-[72px] px-4 py-2 text-[#617589]">$ ${parseFloat(p.Precio_Venta).toFixed(3)}</td>
                            <td class="h-[72px] px-4 py-2 text-[#111418] font-medium">${p.Stock_Actual}</td>
                            <td class="h-[72px] px-4 py-2 text-sm font-bold">
                                <a href="#" class="text-blue-600 hover:underline btn-editar" data-id="${p.id_Producto}">Editar</a> | 
                                <a href="#" class="text-red-600 hover:underline btn-eliminar" data-id="${p.id_Producto}">Eliminar</a>
                            </td>
                        </tr>
                    `;
                });
            } else {
                tablaProductosBody.innerHTML = '<tr><td colspan="6" class="h-[72px] px-4 py-2 text-center text-gray-500">No hay productos registrados.</td></tr>';
            }
        } catch (error) {
            console.error('Error de red:', error);
        }
    }

    // --- Manejo del formulario (Añadir y Editar) ---
    formNuevoProducto.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(formNuevoProducto);
        const datosProducto = Object.fromEntries(formData.entries());
        const id = inputEditId.value;
        const accion = id ? 'actualizar_producto' : 'agregar_producto';
        
        // CORRECCIÓN: Mandamos la acción en el cuerpo de la petición
        datosProducto.accion = accion;

        try {
            const respuesta = await fetch(API_URL, { // La URL ya no necesita la acción
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datosProducto)
            });
            const datos = await respuesta.json();

            if (datos.success) {
                alert(`Producto ${id ? 'actualizado' : 'registrado'} con éxito.`);
                resetForm();
                cargarProductos();
            } else {
                alert('Error: ' + datos.error);
            }
        } catch (error) {
            console.error('Error de red:', error);
        }
    });

    tablaProductosBody.addEventListener('click', async (e) => {
        e.preventDefault();
        const id = e.target.dataset.id;
        if (!id) return;

        if (e.target.classList.contains('btn-editar')) {
            try {
                const res = await fetch(`${API_URL}?accion=obtener_producto&id=${id}`);
                const datos = await res.json();
                if (datos.success && datos.data) {
                    const p = datos.data;
                    // Llenar formulario
                    inputEditId.value = p.id_Producto;
                    formNuevoProducto.querySelector('[name="Nombre"]').value = p.Nombre;
                    formNuevoProducto.querySelector('[name="Descripcion"]').value = p.Descripcion;
                    formNuevoProducto.querySelector('[name="id_Categoria"]').value = p.id_Categoria;
                    formNuevoProducto.querySelector('[name="id_Proveedor"]').value = p.id_Proveedor;
                    formNuevoProducto.querySelector('[name="Tipo_Venta"]').value = p.Tipo_Venta;
                    formNuevoProducto.querySelector('[name="Precio_Compra"]').value = p.Precio_Compra;
                    formNuevoProducto.querySelector('[name="Precio_Venta"]').value = p.Precio_Venta;
                    formNuevoProducto.querySelector('[name="Stock_Actual"]').value = p.Stock_Actual;
                    formNuevoProducto.querySelector('[name="Stock_Minimo"]').value = p.Stock_Minimo;
                    formNuevoProducto.querySelector('[name="Vencimiento"]').value = p.Vencimiento;
                    
                    formTitulo.textContent = 'Editar Producto';
                    formBotonSubmit.querySelector('span').textContent = 'Actualizar';
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            } catch (error) { console.error('Error al obtener producto:', error); }
        } else if (e.target.classList.contains('btn-eliminar')) {
            // Eliminar Producto
            if (confirm('¿Estás seguro de que deseas eliminar este producto?')) {
                try {
                    const res = await fetch(`${API_URL}?accion=eliminar_producto&id=${id}`, {
                        method: 'DELETE'
                    });
                    const datos = await res.json();
                    if(datos.success) {
                        alert('Producto eliminado.');
                        cargarProductos();
                    } else {
                        alert('Error: ' + datos.error);
                    }
                } catch (error) { console.error('Error al eliminar producto:', error); }
            }
        }
    });
    
    function resetForm() {
        formNuevoProducto.reset();
        inputEditId.value = '';
        formTitulo.textContent = 'Registrar Nuevo Producto';
        formBotonSubmit.querySelector('span').textContent = 'Registrar Producto';
    }

    cargarSelects();
    cargarProductos();
});