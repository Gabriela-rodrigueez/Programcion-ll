<?php
session_start();

header("Access-Control-Allow-Origin: *"); 
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");


require '../conexion.php'; 

//  Procesar la Petición POST 
$data = json_decode(file_get_contents("php://input"));

if (empty($data->username) || empty($data->password)) {
    http_response_code(400); 
    echo json_encode(["message" => "Faltan datos de acceso."]);
    exit();
}

$username = $data->username; 
$password = $data->password;

// Verificar Credenciales
try {
    // Usamos el campo Email para la autenticación
    $sql = "SELECT id_Usuario, Contrasena, Nombre, Apellido, Estado, id_Roles FROM Usuario WHERE Email = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$username]);
    $userRow = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($userRow) {
        // Usuario encontrado. Verificar la contraseña hasheada.
        if (password_verify($password, $userRow['Contrasena'])) {

            if ($userRow['Estado'] == 0) {
                http_response_code(401);
                echo json_encode(["message" => "❌ Su cuenta está inactiva. Contacte al administrador."]);
                exit();
            }

            // Inicio de sesion exitoso
            $_SESSION['id_usuario'] = $userRow['id_Usuario'];
            $_SESSION['nombre_usuario'] = $userRow['Nombre'] . " " . $userRow['Apellido'];
            $_SESSION['id_rol'] = $userRow['id_Roles'];
            $_SESSION['loggedin'] = true;

            http_response_code(200);
            echo json_encode([
                "message" => "Inicio de sesión exitoso.",
                "status" => "success",
                "userDisplayName" => $userRow['Nombre'] . " " . $userRow['Apellido']
            ]);

        } else {
            // Contraseña incorrecta
            http_response_code(401); // Unauthorized
            echo json_encode(["message" => "❌ Correo o contraseña incorrectos."]);
        }
    } else {
        // Usuario no encontrado
        http_response_code(401); // Unauthorized
        echo json_encode(["message" => "❌ Correo o contraseña incorrectos."]);
    }

} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error interno del servidor al buscar el usuario."]);
}
?>