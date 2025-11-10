document.addEventListener('DOMContentLoaded', () => {

    // --- Selectores del DOM (sin cambios) ---
    const formNuevoProveedor = document.getElementById('form-nuevo-proveedor');
    const tablaProveedoresBody = document.getElementById('tabla-proveedores-body');
    const tablaProductosBody = document.getElementById('tabla-productos-suministrados-body');
    const inputEditId = document.getElementById('id_Proveedor_edit');
    const formBotonSubmit = document.getElementById('form-proveedor-submit-btn');

    const API_URL = '../Gestión de Productos/api_productos.php';

    /**
     * Carga y muestra todos los proveedores en la tabla principal
     */
    async function cargarProveedores() {
        try {
            const respuesta = await fetch(`${API_URL}?accion=listar_proveedores`);
            const datos = await respuesta.json();

            tablaProveedoresBody.innerHTML = ''; 
            if (!datos.success || datos.data.length === 0) {
                 tablaProveedoresBody.innerHTML = '<tr><td colspan="4" class="h-[72px] px-4 py-2 text-center text-[#617589]">No hay proveedores registrados.</td></tr>';
                 return;
            }
            
            datos.data.forEach(proveedor => {
                tablaProveedoresBody.innerHTML += `
                    <tr class="border-t border-t-[#dbe0e6]">
                        <td class="h-[72px] px-4 py-2 w-[400px] text-[#111418]"><a href="#" class="font-medium text-blue-600 hover:underline btn-ver-productos" data-id="${proveedor.id_Proveedor}">${proveedor.Nombre}</a></td>
                        <td class="h-[72px] px-4 py-2 w-[400px] text-[#617589]">${proveedor.Direccion || ''}</td>
                        <td class="h-[72px] px-4 py-2 w-[400px] text-[#617589]">${proveedor.Contacto || ''}</td>
                        <td class="h-[72px] px-4 py-2 w-60 text-[#617589] text-sm font-bold"><a href="#" class="text-blue-600 hover:underline btn-editar" data-id="${proveedor.id_Proveedor}">Editar</a> | <a href="#" class="text-red-600 hover:underline btn-eliminar" data-id="${proveedor.id_Proveedor}">Eliminar</a></td>
                    </tr>
                `;
            });
        } catch (error) {
            console.error('Error de red al cargar proveedores:', error);
            tablaProveedoresBody.innerHTML = `<tr><td colspan="4" class="h-[72px] px-4 py-2 text-center text-red-500">Error al cargar datos.</td></tr>`;
        }
    }

    /**
     * Maneja el envío del formulario (Crear y Actualizar)
     */
    async function handleFormSubmit(e) {
        e.preventDefault(); 
        const formData = new FormData(formNuevoProveedor);
        const datosProveedor = Object.fromEntries(formData.entries());
        const id = inputEditId.value;
        
        // --- CORRECCIÓN CLAVE: Añadir la acción al cuerpo de datos ---
        datosProveedor.accion = id ? 'actualizar_proveedor' : 'agregar_proveedor';

        try {
            // La URL ya no necesita la acción
            const respuesta = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datosProveedor) // La acción va aquí dentro
            });

            const datos = await respuesta.json();

            if (datos.success) {
                alert(id ? 'Proveedor actualizado con éxito.' : 'Proveedor registrado con éxito.');
                resetForm();
                cargarProveedores(); 
            } else {
                alert('Error: ' + datos.error);
            }
        } catch (error) {
            console.error('Error de red:', error);
        }
    }

    function resetForm() {
        formNuevoProveedor.reset();
        inputEditId.value = '';
        formBotonSubmit.querySelector('span').textContent = 'Añadir Proveedor';
    }

    async function iniciarEdicion(id) {
        try {
            const respuesta = await fetch(`${API_URL}?accion=obtener_proveedor&id=${id}`);
            const datos = await respuesta.json();

            if (datos.success && datos.data) {
                const proveedor = datos.data;
                inputEditId.value = proveedor.id_Proveedor;
                formNuevoProveedor.querySelector('[name="Nombre"]').value = proveedor.Nombre;
                formNuevoProveedor.querySelector('[name="Contacto"]').value = proveedor.Contacto;
                formNuevoProveedor.querySelector('[name="Direccion"]').value = proveedor.Direccion;
                formBotonSubmit.querySelector('span').textContent = 'Actualizar Proveedor';
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                alert('Error al cargar datos del proveedor: ' + (datos.error || 'No encontrado'));
            }
        } catch (error) {
            console.error('Error de red:', error);
        }
    }

    async function eliminarProveedor(id) {
        if (!confirm('¿Estás seguro de que deseas eliminar este proveedor?')) return;

        try {
            const respuesta = await fetch(`${API_URL}?accion=eliminar_proveedor&id=${id}`, {
                method: 'DELETE' // DELETE sigue usando la URL, está bien así.
            });
            const datos = await respuesta.json();

            if (datos.success) {
                alert('Proveedor eliminado con éxito.');
                cargarProveedores();
                tablaProductosBody.innerHTML = '<tr><td colspan="3" class="h-[72px] px-4 py-2 text-[#617589]">Seleccione un proveedor para ver sus productos</td></tr>';
            } else {
                alert('Error al eliminar proveedor: ' + datos.error);
            }
        } catch (error) {
            console.error('Error de red:', error);
        }
    }
    
    async function cargarProductosSuministrados(id) {
        tablaProductosBody.innerHTML = '<tr><td colspan="3" class="h-[72px] px-4 py-2 text-center text-[#617589]">Cargando productos...</td></tr>';
        try {
            const respuesta = await fetch(`${API_URL}?accion=listar_productos_por_proveedor&id=${id}`);
            const datos = await respuesta.json();

            if (datos.success) {
                tablaProductosBody.innerHTML = '';
                if (datos.data.length === 0) {
                    tablaProductosBody.innerHTML = '<tr><td colspan="3" class="h-[72px] px-4 py-2 text-center text-[#617589]">Este proveedor no tiene productos registrados.</td></tr>';
                    return;
                }
                
                datos.data.forEach(producto => {
                    const estadoClase = producto.Estado == 1 ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800';
                    const estadoTexto = producto.Estado == 1 ? 'Activo' : 'Inactivo';

                    tablaProductosBody.innerHTML += `
                        <tr class="border-t border-t-[#dbe0e6]">
                            <td class="h-[72px] px-4 py-2 w-[400px] text-[#111418]">${producto.Nombre}</td>
                            <td class="h-[72px] px-4 py-2 w-[400px] text-[#617589]">${producto.Stock}</td>
                            <td class="h-[72px] px-4 py-2 w-60"><span class="px-2 py-1 rounded ${estadoClase}">${estadoTexto || 'N/A'}</span></td>
                        </tr>
                    `;
                });
            } else {
                console.error('Error al listar productos:', datos.error);
                tablaProductosBody.innerHTML = `<tr><td colspan="3" class="h-[72px] px-4 py-2 text-center text-red-500">Error al cargar productos.</td></tr>`;
            }
        } catch (error) {
            console.error('Error de red:', error);
        }
    }

    tablaProveedoresBody.addEventListener('click', (e) => {
        e.preventDefault(); 
        const id = e.target.dataset.id;
        if (!id) return; 

        if (e.target.classList.contains('btn-editar')) {
            iniciarEdicion(id);
        } else if (e.target.classList.contains('btn-eliminar')) {
            eliminarProveedor(id);
        } else if (e.target.classList.contains('btn-ver-productos')) {
            cargarProductosSuministrados(id);
        }
    });

    formNuevoProveedor.addEventListener('submit', handleFormSubmit);
    cargarProveedores();
});