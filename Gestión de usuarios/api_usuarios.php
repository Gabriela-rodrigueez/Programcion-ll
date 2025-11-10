<?php
header('Content-Type: application/json');
require '../conexion.php'; 

$metodo = $_SERVER['REQUEST_METHOD'];
$accion = isset($_GET['accion']) ? $_GET['accion'] : '';
$id = isset($_GET['id']) ? (int)$_GET['id'] : 0; 
try {
    switch ($metodo) {
        
        case 'GET':
            if ($id > 0) {
                // Obtener un solo usuario por ID 
                $stmt = $pdo->prepare("SELECT id_Usuario, Nombre, Apellido, Email, id_Roles FROM Usuario WHERE id_Usuario = :id");
                $stmt->bindParam(':id', $id);
                $stmt->execute();
                $usuario = $stmt->fetch(PDO::FETCH_ASSOC);
                echo json_encode($usuario);

            } elseif ($accion == 'obtener_usuarios') {
                // Obtener los usuarios
                $stmt = $pdo->query("SELECT u.id_Usuario, u.Nombre, u.Apellido, u.Email, u.Estado, u.Fecha_Registro, r.Nombre_Rol 
                                     FROM Usuario u
                                     JOIN Roles r ON u.id_Roles = r.id_Roles ORDER BY u.id_Usuario DESC");
                $usuarios = $stmt->fetchAll(PDO::FETCH_ASSOC);
                echo json_encode($usuarios);

            } elseif ($accion == 'obtener_roles') {
                // Obtener ROLES
                $stmt = $pdo->query("SELECT id_Roles, Nombre_Rol FROM Roles WHERE Estado = 1");
                $roles = $stmt->fetchAll(PDO::FETCH_ASSOC);
                echo json_encode($roles);
            }
            break;

        case 'POST':
            $datos = json_decode(file_get_contents('php://input'), true);
            if (!isset($datos['Nombre']) || !isset($datos['Email']) || !isset($datos['Contrasena']) || !isset($datos['id_Roles'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Faltan datos obligatorios.']); exit;
            }
            $contrasena_hasheada = password_hash($datos['Contrasena'], PASSWORD_DEFAULT);
            $sql = "INSERT INTO Usuario (Nombre, Apellido, Email, Contrasena, id_Roles) 
                    VALUES (:nombre, :apellido, :email, :contrasena, :id_roles)";
            $stmt = $pdo->prepare($sql);
            $stmt->bindParam(':nombre', $datos['Nombre']);
            $stmt->bindParam(':apellido', $datos['Apellido']);
            $stmt->bindParam(':email', $datos['Email']);
            $stmt->bindParam(':contrasena', $contrasena_hasheada);
            $stmt->bindParam(':id_roles', $datos['id_Roles']);
            $stmt->execute();
            http_response_code(201);
            echo json_encode(['mensaje' => 'Usuario creado exitosamente']);
            break;

        // Atualizar (Editar)
        case 'PUT':
            $datos = json_decode(file_get_contents('php://input'), true);

            if ($id <= 0 || !isset($datos['Nombre']) || !isset($datos['Email']) || !isset($datos['id_Roles'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Faltan datos obligatorios o ID no válido.']);
                exit;
            }

            // Si la envían vacía, NO se actualiza.
            if (!empty($datos['Contrasena'])) {
                // Si hay contraseña nueva, hashearla y actualizarla
                $contrasena_hasheada = password_hash($datos['Contrasena'], PASSWORD_DEFAULT);
                $sql = "UPDATE Usuario SET Nombre = :nombre, Apellido = :apellido, Email = :email, id_Roles = :id_roles, Contrasena = :contrasena WHERE id_Usuario = :id";
                $stmt = $pdo->prepare($sql);
                $stmt->bindParam(':contrasena', $contrasena_hasheada);
            } else {
                // Si no hay contraseña nueva, no se incluye en la consulta
                $sql = "UPDATE Usuario SET Nombre = :nombre, Apellido = :apellido, Email = :email, id_Roles = :id_roles WHERE id_Usuario = :id";
                $stmt = $pdo->prepare($sql);
            }

            $stmt->bindParam(':nombre', $datos['Nombre']);
            $stmt->bindParam(':apellido', $datos['Apellido']);
            $stmt->bindParam(':email', $datos['Email']);
            $stmt->bindParam(':id_roles', $datos['id_Roles']);
            $stmt->bindParam(':id', $id);

            if ($stmt->execute()) {
                http_response_code(200);
                echo json_encode(['mensaje' => 'Usuario actualizado exitosamente']);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Error al actualizar el usuario.']);
            }
            break;

        case 'DELETE':
            if ($id <= 0) {
                http_response_code(400);
                echo json_encode(['error' => 'ID de usuario no válido.']); exit;
            }
            $sql = "DELETE FROM Usuario WHERE id_Usuario = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->bindParam(':id', $id);
            if ($stmt->execute()) {
                http_response_code(200);
                echo json_encode(['mensaje' => 'Usuario eliminado exitosamente']);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Error al eliminar el usuario.']);
            }
            break;

        default:
            http_response_code(405); 
            echo json_encode(['error' => 'Método no permitido']);
            break;
    }

} catch (PDOException $e) {
    http_response_code(500);
    if ($e->getCode() == 23000) {
         echo json_encode(['error' => 'El correo electrónico ya está registrado.']);
    } else {
         echo json_encode(['error' => 'Error en la base de datos: ' . $e->getMessage()]);
    }
}
?>