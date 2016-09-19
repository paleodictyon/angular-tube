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
  'film_database_path'  => 'filmDB.json',
  'report_every_n'      => 10, //echo output after every nth item.
  'fileExtensions'      => "3gp,amv,avi,f4v,flv,gifv,".
                           "m4p,m4v,mkv,mov,mp2,mp4,mpe,mpeg,mpg,mpv,".
                           "ogg,ogv,qt,vob,webm,wmv",
   'write_temp_every_n' => 200,
);

$exts = explode(",", $config['fileExtensions']);
//require (include) specified file, but store it in a variable.
function requireToVar($file){
  ob_start();
  require($file);
  return ob_get_clean();
}

// include specified file, but store it in a variable.
function includeToVar($file){
  ob_start();
  include($file);
  return ob_get_clean();
}

//PHP Require, but store in $jsonRaw instead of dumping.
//Basically gather up the exisitng FilmDB.
$jsonRaw = includeToVar($config['film_database_path']);
$jsonRaw = json_decode($jsonRaw);

if (is_array($jsonRaw)) {
  //iterate through filmDB
  foreach ($jsonRaw as $j){
    $JSON[$j->hash] = $j;
  }
}

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


$ffmpeg = FFMpeg\FFMpeg::create();
$ffprobe = FFMpeg\FFProbe::create();

dbug("<pre>");
//phpinfo(); die();
$finfo = finfo_open(FILEINFO_MIME_TYPE);

$iter = new RecursiveIteratorIterator(
          new RecursiveDirectoryIterator($config['root'], RecursiveDirectoryIterator::SKIP_DOTS),
            RecursiveIteratorIterator::SELF_FIRST,
            RecursiveIteratorIterator::CATCH_GET_CHILD // Ignore "Permission denied"
        );

//$paths = array($root);
foreach ($iter as $path => $file) {
  try {
    $filename = $file->getFilename();
    $filesize = filesize($path);
    $hash = createUniqueHash($filename, $filesize);
    
    //var_dump( $filename);
    if ($file->isDir()) {
      //Ignore it, it's a directory
    } 
      elseif ( 
        //Prevent half-baked torrent downloads.
        substr($path,-5) != ".part" 
        && substr($path,-4) != ".az!" 
        && !preg_match('/[^\x20-\x7f]/',$path)
      ) 
    {
      $pathExplosion = explode(".", $path);
      $ext = end($pathExplosion);
      if(array_search($ext, $exts)){
        $sshot = null;
        $mime = finfo_file($finfo,$path);
        if (substr($mime, 0,5) == "video")
        {
          if (isset($JSON[$hash]))
          {
            dbug("File found");
            if (isset($JSON[$hash]['sshots'])) {
              $JSON[$hash]['sshot_count'] = count($JSON[$hash]['sshots']);
              $JSON[$hash]['sshots'] = NULL;
            }
            $OUTPUT[] = $JSON[$hash];
          } 
          else 
          {
            dbug("File not found");

            $i++;

            if( $i % $config['report_every_n'] == 0)
              echo "[$i] $path\n";

            if($i % $config['write_temp_every_n'] == 0){
              $json_string = json_encode($OUTPUT);
              $jsonFile = "filmDB.json.temp";
              echo "\nWritting Json to $jsonFile\n";
              file_put_contents($jsonFile, $json_string);
              echo "\nDone Writing Temp!\n";
              dbug("</pre>");  
            }

            $duration = (int)$ffprobe
              ->streams($path)                // extracts streams informations
              ->videos()                      // filters video streams
              ->first()                       // returns the first video stream
              ->get('duration');              // returns the duration property
            $video = $ffmpeg->open($path);

            $screenDir = $config['screenshot_dir']. "/". substr($hash,0,1) . "/";


            for( $j = 0; $j < $config['screenshot_count']; $j++ ){

              $screenshot_filename = $screenDir . $hash . '-' . ($j + 1) .'.jpg';
              //$screenshot_filename = "poop.jpg";
              $screenshot_time     = (int)( $duration * $config['ss_percent'][$j] );
              dbug("Checking for a screenshot $screenshot_filename");

              if (!file_exists( $screenshot_filename )) {

                $frame = $video->frame( FFMpeg\Coordinate\TimeCode::fromSeconds($screenshot_time ) );
                $frame->save( $screenshot_filename );
                dbug("Grabbed screenshot $screenshot_filename");
              } else {
                dbug("FOUND screenshot already exists: $screenshot_filename");
              }

              $sshot[] = $screenshot_filename;

            }

            
            $OUTPUT[] = 
            [
              "sshot_count"   =>  count($sshot), 
              "cast"    =>  array(), 
              "tags"    =>  array(), 
              "title"   =>  $filename,
              "filename"=>  $filename, 
              "duration"=>  $duration, 
              "filesize"=>  $filesize,
              "path"    =>  $path,
              "mime"    =>  $mime, 
              "hash"    =>  $hash
            ];
          }
        }
      }
    }
  } catch (Exception $e) { echo 'Caught exception: ',  $e->getMessage(), "\n"; }
}

//var_dump($paths);
$json_string = json_encode($OUTPUT);
$jsonFile = "filmDB.json";
echo "\nWritting Json to $jsonFile\n";
file_put_contents($jsonFile, $json_string);
echo "\nDone Yaboiii!\n";
dbug("</pre>");  