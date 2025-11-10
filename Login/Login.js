document.addEventListener('DOMContentLoaded', () => {

    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('usernameInput');
    const passwordInput = document.getElementById('passwordInput');
    const loginButton = document.getElementById('loginButton');
    const messageDisplay = document.getElementById('messageDisplay');

    
    const LOGIN_API_URL = 'Login.php'; 

    function displayMessage(message, type) {
        messageDisplay.textContent = message;
        messageDisplay.className = type;
    }

    async function handleLogin(event) {
        event.preventDefault();

        loginButton.disabled = true;
        loginButton.querySelector('span').textContent = 'Verificando...';

        const username = usernameInput.value.trim();
        const password = passwordInput.value;

        displayMessage('', ''); 

        if (username === '' || password === '') {
            displayMessage('Por favor, ingrese el nombre de usuario y la contraseña.', 'error');
            loginButton.disabled = false;
            loginButton.querySelector('span').textContent = 'Iniciar Sesión';
            return;
        }

        try {
            const response = await fetch(LOGIN_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    username: username, 
                    password: password 
                })
            });

            const data = await response.json();

            if (response.ok) { 
                displayMessage(`✅ ¡Acceso Autorizado! Hola, ${data.userDisplayName}. Redirigiendo...`, 'success');

                setTimeout(() => { 
                    window.location.href = '../Gestión de usuarios/Usuarios.html'; 
                }, 1000);

            } else { // Códigos de error (400, 401, 500)
                displayMessage(data.message || '❌ Error desconocido de autenticación.', 'error');
                passwordInput.value = '';
                passwordInput.focus();
            }

        } catch (error) {
            displayMessage('⛔ Error de red. No se pudo conectar con el servidor.', 'error');
            console.error('Error en la llamada a la API:', error);
        } finally {
            // Restablecer el botón
            loginButton.disabled = false;
            loginButton.querySelector('span').textContent = 'Iniciar Sesión';
        }
    }

    // Asignar el evento 'click' y 'Enter'
    loginForm.addEventListener('submit', handleLogin);
});