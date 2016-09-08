<?php 

$json = file_get_contents('php://input');
$fp = fopen('db/filmDB.json', 'w');
fwrite($fp, $json);
fclose($fp);

$dateStamp = ((int)(time() / 60/60))*60*60;

$fp = fopen("db/backup/filmDB-$dateStamp.json", 'w');
fwrite($fp, $json);
fclose($fp);