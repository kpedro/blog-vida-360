<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Coleta os dados do formulário
    $nome = htmlspecialchars($_POST['name']);
    $email = htmlspecialchars($_POST['email']);
    $telefone = htmlspecialchars($_POST['phone']);
    $mensagem = htmlspecialchars($_POST['message']);

    // Configurações do e-mail
    $para = "kadson.pedro@gmail.com"; // Substitua pelo seu e-mail
    $assunto = "Mensagem de Contato - Vida 360º";
    $corpo = "Nome: $nome\n";
    $corpo .= "E-mail: $email\n";
    $corpo .= "Telefone: $telefone\n";
    $corpo .= "Mensagem:\n$mensagem\n";

    $headers = "De: $email";

    // Envia o e-mail
    if (mail($para, $assunto, $corpo, $headers)) {
        echo "<h1>Mensagem enviada com sucesso!</h1>";
    } else {
        echo "<h1>Erro ao enviar mensagem. Tente novamente mais tarde.</h1>";
    }
} else {
    header("Location: contato.html");
    exit();
}
?>
