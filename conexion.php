<?php

$servidor = "localhost"; 
$usuario = "root";
$password = "root";
$base_de_datos = "almacenjr_db";
$charset = "utf8"; 

try {
    $dsn = "mysql:host=$servidor;dbname=$base_de_datos;charset=$charset";


    $pdo = new PDO($dsn, $usuario, $password);

    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

} catch (PDOException $e) {
    die("Conexión fallida (PDO): " . $e->getMessage());
}

?>
