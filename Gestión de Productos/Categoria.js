document.addEventListener('DOMContentLoaded', () => {

    const formCategoria = document.getElementById('form-categoria');
    const inputCategoria = document.getElementById('input-nueva-categoria');
    const inputCategoriaDesc = document.getElementById('input-nueva-categoria-desc');
    const listaCategoriasUI = document.getElementById('lista-categorias-existentes');
    
    const inputEditId = document.getElementById('edit-categoria-id');
    const formTitulo = document.getElementById('form-categoria-titulo');
    const formBoton = document.getElementById('form-categoria-btn');
    const cancelContainer = document.getElementById('cancel-edit-container');
    const btnCancel = document.getElementById('btn-cancelar-edicion');

    const API_URL = 'api_productos.php';

    async function cargarCategorias() {
        if (!listaCategoriasUI) return;

        try {
            const respuesta = await fetch(`${API_URL}?accion=listar_categorias`);
            const datos = await respuesta.json();

            if (datos.success) {
                listaCategoriasUI.innerHTML = ''; 
                if (datos.data.length === 0) {
                    listaCategoriasUI.innerHTML = '<p class="px-4 text-gray-500">No hay categorías registradas.</p>';
                } else {
                    datos.data.forEach(categoria => {
                        listaCategoriasUI.innerHTML += `
                            <div class="flex items-center gap-4 bg-white px-4 min-h-14 justify-between border-t border-t-[#dbe0e6]">
                                <p class="text-[#111418] text-base font-normal leading-normal flex-1 truncate">${categoria.Nombre}</p>
                                <div class="shrink-0">
                                    <div class="text-[#111418] flex size-7 items-center justify-center cursor-pointer btn-editar-categoria" data-id="${categoria.id_Categoria}">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256" style="pointer-events: none;">
                                            <path d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM92.69,208H48V163.31l88-88L180.69,120ZM192,108.68,147.31,64l24-24L216,84.68Z"></path>
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        `;
                    });
                }
            } else {
                console.error('Error al listar categorías:', datos.error);
            }
        } catch (error) {
            console.error('Error de red:', error);
        }
    }

    function resetForm() {
        formCategoria.reset();
        inputEditId.value = '';
        formTitulo.textContent = 'Gestionar Categorías';
        formBoton.querySelector('span').textContent = 'Añadir Categoría';
        cancelContainer.classList.add('hidden');
    }

    async function iniciarEdicion(id) {
        try {
            const respuesta = await fetch(`${API_URL}?accion=obtener_categoria&id=${id}`);
            const datos = await respuesta.json();

            if (datos.success && datos.data) {
                const cat = datos.data;
                inputCategoria.value = cat.Nombre;
                inputCategoriaDesc.value = cat.Descripcion;
                inputEditId.value = cat.id_Categoria;

                formTitulo.textContent = 'Editar Categoría';
                formBoton.querySelector('span').textContent = 'Guardar Cambios';
                cancelContainer.classList.remove('hidden');
                window.scrollTo({ top: 0, behavior: 'smooth' }); 
            } else {
                alert('Error al cargar la categoría: ' + datos.error);
            }
        } catch (error) {
            console.error('Error de red:', error);
        }
    }

    formCategoria.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        
        const id = inputEditId.value; 
        const nombre = inputCategoria.value.trim();
        const descripcion = inputCategoriaDesc.value.trim();
        
        let accion = id ? 'actualizar_categoria' : 'agregar_categoria';
        
        let datosEnviar = {
            accion: accion,             
            nombre: nombre,
            descripcion: descripcion,
            id_Categoria: id 
        };

        if (nombre === '') {
            alert('Por favor, ingrese un nombre para la categoría.');
            return;
        }

        try {
            const respuesta = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datosEnviar)
            });
            const datos = await respuesta.json();

            if (datos.success) {
                alert(id ? 'Categoría actualizada.' : 'Categoría agregada.');
                resetForm();
                cargarCategorias();
            } else {
                alert('Error: ' + datos.error);
            }
        } catch (error) {
            console.error('Error de red:', error);
        }
    });

    listaCategoriasUI.addEventListener('click', (e) => {
        const botonEditar = e.target.closest('.btn-editar-categoria');
        if (botonEditar) {
            const id = botonEditar.dataset.id;
            iniciarEdicion(id);
        }
    });

    
    btnCancel.addEventListener('click', () => {
        resetForm();
    });

    cargarCategorias();
});