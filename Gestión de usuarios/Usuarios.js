document.addEventListener('DOMContentLoaded', function() {

    const formAnadirUsuario = document.getElementById('form-anadir-usuario');
    const tablaBody = document.getElementById('tabla-usuarios-body');
    const selectRoles = document.getElementById('id_Roles'); 
    
    const formTitulo = document.getElementById('form-titulo');
    const formBotonSubmit = document.getElementById('form-boton-submit');
    const inputEditId = document.getElementById('edit-id');
    // Campos del formulario
    const inputNombre = document.getElementById('nombre');
    const inputApellido = document.getElementById('apellido');
    const inputEmail = document.getElementById('email');
    const inputContrasena = document.getElementById('contrasena');


    // Carga lo roles en el formulario 
    async function cargarRoles() {
        try {
            const response = await fetch('api_usuarios.php?accion=obtener_roles');
            if (!response.ok) throw new Error('No se pudieron cargar los roles.');
            const roles = await response.json();
            selectRoles.innerHTML = '<option value="" disabled selected>Seleccione un rol</option>';
            roles.forEach(rol => {
                const option = document.createElement('option');
                option.value = rol.id_Roles; 
                option.textContent = rol.Nombre_Rol; 
                selectRoles.appendChild(option);
            });
        } catch (error) {
            console.error('Error al cargar roles:', error);
            selectRoles.innerHTML = '<option value="" disabled>Error al cargar roles</option>';
        }
    }

    // Cargar y Mostrar los usuarios en la tabla
    async function cargarUsuarios() {
        try {
            const response = await fetch('api_usuarios.php?accion=obtener_usuarios');
            if (!response.ok) throw new Error('La respuesta de la red no fue correcta.');
            const usuarios = await response.json();
            tablaBody.innerHTML = ''; 
            if (usuarios.length === 0) {
                tablaBody.innerHTML = '<tr><td colspan="7" class="text-center p-4">No hay usuarios registrados.</td></tr>';
                return;
            }
            usuarios.forEach(usuario => {
                const tr = document.createElement('tr');
                tr.className = 'border-t border-t-[#dbe0e6]';
                const fecha = new Date(usuario.Fecha_Registro).toLocaleDateString('es-ES');
                const estadoTexto = usuario.Estado == 1 ? 'Activo' : 'Inactivo';
                const estadoClase = usuario.Estado == 1 ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800';

                tr.innerHTML = `
                    <td class="h-[72px] px-4 py-2">${usuario.Nombre}</td>
                    <td class="h-[72px] px-4 py-2">${usuario.Apellido}</td>
                    <td class="h-[72px] px-4 py-2">${usuario.Email}</td>
                    <td class="h-[72px] px-4 py-2">${usuario.Nombre_Rol}</td>
                    <td class="h-[72px] px-4 py-2">
                        <span class="px-2 py-1 rounded ${estadoClase}">${estadoTexto}</span>
                    </td>
                    <td class="h-[72px] px-4 py-2">${fecha}</td>
                    <td class="h-[72px] px-4 py-2 text-blue-600 font-bold">
                        <a href="#" class="cursor-pointer hover:underline btn-editar" data-id="${usuario.id_Usuario}">Editar</a> |
                        <a href="#" class="cursor-pointer hover:underline text-red-600 btn-eliminar" data-id="${usuario.id_Usuario}">Eliminar</a>
                    </td>
                `;
                tablaBody.appendChild(tr);
            });
        } catch (error) {
            console.error('Error al cargar usuarios:', error);
            tablaBody.innerHTML = `<tr><td colspan="7" class="text-center p-4 text-red-500">Error al cargar los datos.</td></tr>`;
        }
    }

    // para edicion
    async function iniciarEdicion(id) {
        try {
            //Pedir los datos del usuario a la API
            const response = await fetch(`api_usuarios.php?id=${id}`);
            if (!response.ok) throw new Error('No se pudieron obtener los datos del usuario.');
            const usuario = await response.json();

            // Rellenar el formulario con los datos
            inputNombre.value = usuario.Nombre;
            inputApellido.value = usuario.Apellido;
            inputEmail.value = usuario.Email;
            selectRoles.value = usuario.id_Roles;
            inputEditId.value = usuario.id_Usuario; // Guardamos el ID en el campo oculto
            inputContrasena.placeholder = "Dejar en blanco para no cambiar"; // Aviso
            
            // Cambiar el estado del formulario a "Modo Edición"
            formTitulo.textContent = 'Editar Usuario';
            formBotonSubmit.querySelector('span').textContent = 'Guardar Cambios';

            // Mover la vista al formulario
            window.scrollTo({ top: 0, behavior: 'smooth' });

        } catch (error) {
            console.error('Error al iniciar edición:', error);
            alert(`Error: ${error.message}`);
        }
    }

    // Resetear el formulario a modo añadirE
    function resetFormulario() {
        formAnadirUsuario.reset(); // Limpia todos los campos
        inputEditId.value = ''; // Limpia el ID oculto
        formTitulo.textContent = 'Añadir Nuevo Usuario';
        formBotonSubmit.querySelector('span').textContent = 'Añadir Usuario';
        inputContrasena.placeholder = "Ingrese contraseña";
    }

    //  Maneja los click de la tabla (Editar/Eliminar) 
    function manejarAccionesTabla(event) {
        event.preventDefault(); 
        const elemento = event.target; 

        // --- Lógica de Eliminar (no cambia) ---
        if (elemento.classList.contains('btn-eliminar')) {
            const id = elemento.dataset.id;
            if (confirm(`¿Estás seguro de que deseas eliminar al usuario con ID ${id}?`)) {
                eliminarUsuario(id);
            }
        }

        // 
        if (elemento.classList.contains('btn-editar')) {
            const id = elemento.dataset.id;
            iniciarEdicion(id); 
        }
    }

    //  Eliminar un usuario
    async function eliminarUsuario(id) {
        try {
            const response = await fetch(`api_usuarios.php?id=${id}`, {
                method: 'DELETE'
            });
            const resultado = await response.json();
            if (response.ok) {
                alert(resultado.mensaje);
                cargarUsuarios(); 
            } else {
                throw new Error(resultado.error || 'Ocurrió un error al eliminar');
            }
        } catch (error) {
            console.error('Error al eliminar usuario:', error);
            alert(`Error: ${error.message}`);
        }
    }

    // Añade o Edita 
    async function manejarEnvioFormulario(event) {
        event.preventDefault(); 

        const formData = new FormData(formAnadirUsuario);
        const datosUsuario = Object.fromEntries(formData.entries());
        const id = inputEditId.value; 

        let url = 'api_usuarios.php';
        let method = 'POST'; 

        // Si hay un ID, se Actualiza
        if (id) {
            url = `api_usuarios.php?id=${id}`;
            method = 'PUT'; // Usamos el método PUT
        }

        try {
            const response = await fetch(url, { 
                method: method, // POST o PUT
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datosUsuario) 
            });

            const resultado = await response.json();
            
            if (response.ok) {
                alert(resultado.mensaje);
                resetFormulario(); // Resetea el formulario a "Modo Añadir"
                cargarUsuarios(); // Recarga la tabla
            } else {
                throw new Error(resultado.error || 'Ocurrió un error.');
            }

        } catch (error) {
            console.error('Error al enviar formulario:', error);
            alert(`Error: ${error.message}`);
        }
    }

    // Inicialización de la página
    async function init() {
        await cargarRoles(); // Carga roles
        cargarUsuarios();    // Carga usuarios
    }

    // eventos
    formAnadirUsuario.addEventListener('submit', manejarEnvioFormulario); 
    tablaBody.addEventListener('click', manejarAccionesTabla); 
    
    init();

});