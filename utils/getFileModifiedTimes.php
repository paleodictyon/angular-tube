<?php

error_reporting(E_ALL);
ini_set('display_errors', 1);


$i = 1;

$config = array(
  "screenshot_count"    => 5,
  "ss_percent"          => [
                              0 => .10,
                              1 => .25,
                              2 => .50,
                              3 => .75,
                              4 => .9
                            ],
  "screenshot_dir"      => "screenshots",
  'root'                => '/media/mephesto/Scarlett/', //Root location to scan
  'film_database_path'  => 'db/filmDB.json',
  'error_file_path'     => 'db/errorFiles.json',
  'report_every_n'      => 10, //echo output after every nth item.
  'fileExtensions'      => "3gp,amv,avi,f4v,flv,gifv,".
                           "m4p,m4v,mkv,mov,mp2,mp4,mpe,mpeg,mpg,mpv,".
                           "ogg,ogv,qt,vob,webm,wmv",
   'write_temp_every_n' => 200,
);

$exts = explode(",", $config['fileExtensions']);

function outputJson($array, $filename){
  $jsonString = json_encode($array);
  echo fancyOutput("Writing ".count($array)." items to json file: $filename");
  file_put_contents($filename, $jsonString);
  echo fancyOutput("Write to $filename complete!");
}

function loadJSON($file){
  ob_start();
  include($file);
  $string = ob_get_clean();
  return json_decode($string);
}

function fancyOutput($msg = ""){
  $string = "";

  for($i=0;$i<80;$i++){
    $string.="-";
  }
  return "\n$string\n| $msg\n$string";
}

// gather up the exisitng FilmDB.
$jsonRaw = loadJSON($config['film_database_path']);


if (is_array($jsonRaw)) {
  //iterate through filmDB
  foreach ($jsonRaw as $j){
    $JSON[$j->hash] = $j;
  }
}

echo fancyOutput("Loaded ".count($JSON)." existing films.");

// gather up the exisitng error list.
$jsonRaw = loadJSON($config['error_file_path']);

if (is_array($jsonRaw)) {
  //iterate through filmDB
  foreach ($jsonRaw as $j){
    $errorPaths[] = $j;
  }
}

echo fancyOutput("Loaded ".count($errorPaths)." known error films.");

//
// NOTE:  REQUIRES PHPFFMPEG WHICH I WAS INCLUDING WITH COMPOSER.
// https://github.com/PHP-FFMpeg/PHP-FFMpeg

require __DIR__ . '/vendor/autoload.php';

function dbug($string){
  //echo $string."\n";/*Comment out to disable*/
}

function createUniqueHash($filename, $filesize){
  return hash("sha256", trim($filename).trim($filesize)."weezer");
  //Why weezer?  Because Weezer is awesome.
}

//$paths = array($root);
foreach ($JSON as $hash => $j) {
  $JSON[$hash]->mtime = filemtime($j->path);
  echo "yep\n";
  $OUTPUT[] = $JSON[$hash];
}

outputJson($OUTPUT, $config['film_database_path']);

//outputJson($errorPaths, $config['error_file_path']);

dbug("</pre>");  

echo "\n";