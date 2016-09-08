<?php 
error_reporting(E_ALL);
ini_set('display_errors', 1);
$i = 1;


$root = '/media/paleodictyon/Scarlett/';

function requireToVar($file){
    ob_start();
    require($file);
    return ob_get_clean();
}

$jsonRaw = requireToVar("filmDB.json");
//var_dump($JSON);
$jsonRaw = json_decode($jsonRaw);

foreach ($jsonRaw as $j){
  $JSON[$j->hash] = $j;
}


require __DIR__ . '/vendor/autoload.php';

function bug($string){
  //echo $string;/*Comment out to disable*/
}

function createUniqueHash($filename, $filesize){
  return hash("sha256", trim($filename).trim($filesize)."weezer");
}


$ffmpeg = FFMpeg\FFMpeg::create();
$ffprobe = FFMpeg\FFProbe::create();

bug("<pre>");
//phpinfo(); die();
$finfo = finfo_open(FILEINFO_MIME_TYPE);

$iter = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator($root, RecursiveDirectoryIterator::SKIP_DOTS),
    RecursiveIteratorIterator::SELF_FIRST,
    RecursiveIteratorIterator::CATCH_GET_CHILD // Ignore "Permission denied"
);

//$paths = array($root);
foreach ($iter as $path => $file) {
  try{
    $filename = $file->getFilename();
    $filesize = filesize($path);
    $hash = createUniqueHash($filename, $filesize);
    
    //var_dump( $filename);
    if ($file->isDir()) {
      //Ignore it, it's a directory
    } elseif (substr($path,-5) != ".part" && substr($path,-4) != ".az!" && !preg_match('/[^\x20-\x7f]/',$path)) {
      $mime = finfo_file($finfo,$path);
      if (substr($mime, 0,5) == "video"){
        if (isset($JSON[$hash])){
          bug("File found\n");
          $OUTPUT[] = $JSON[$hash];
        } else {
          bug("File not found");
        echo '[' . $i++ . '] ' . "$path\n";
        $duration = (int)$ffprobe
          ->streams($path) // extracts streams informations
          ->videos()                      // filters video streams
          ->first()                       // returns the first video stream
          ->get('duration');              // returns the duration property
        $video = $ffmpeg->open($path);
        $screenDir = substr($hash,0,1);

        if (!file_exists("screenshots/".$screenDir."/".$hash.'-1.jpg')) {
          $frame = $video->frame(FFMpeg\Coordinate\TimeCode::fromSeconds((int)($duration*.1)));
          $frame->save("screenshots/".$screenDir."/".$hash.'-1.jpg');
        }
        if (!file_exists("screenshots/".$screenDir."/".$hash.'-2.jpg')) {
          $frame = $video->frame(FFMpeg\Coordinate\TimeCode::fromSeconds((int)($duration*.25)));
          $frame->save("screenshots/".$screenDir."/".$hash.'-2.jpg');
        }
        if (!file_exists("screenshots/".$screenDir."/".$hash.'-3.jpg')) {
          $frame = $video->frame(FFMpeg\Coordinate\TimeCode::fromSeconds((int)($duration*.5)));
          $frame->save("screenshots/".$screenDir."/".$hash.'-3.jpg');
        }
        if (!file_exists("screenshots/".$screenDir."/".$hash.'-4.jpg')) {
          $frame = $video->frame(FFMpeg\Coordinate\TimeCode::fromSeconds((int)($duration*.75)));
          $frame->save("screenshots/".$screenDir."/".$hash.'-4.jpg');
        }
        if (!file_exists("screenshots/".$screenDir."/".$hash.'-5.jpg')) {
          $frame = $video->frame(FFMpeg\Coordinate\TimeCode::fromSeconds((int)($duration*.9)));
          $frame->save("screenshots/".$screenDir."/".$hash.'-5.jpg');/**/
        }
        $sshot = 
        array(
          "screenshots/".$screenDir."/".$hash.'-1.jpg',
          "screenshots/".$screenDir."/".$hash.'-2.jpg',
          "screenshots/".$screenDir."/".$hash.'-3.jpg',
          "screenshots/".$screenDir."/".$hash.'-4.jpg',
          "screenshots/".$screenDir."/".$hash.'-5.jpg'
        );
        $OUTPUT[] = ["sshot" => $sshot, "cast"=>array(), "tags"=>array(), "title"=>$filename,"filename"=>$filename, "duration"=>$duration, "filesize"=>$filesize,"path"=>$path,"mime"=>$mime, "hash"=>$hash];
        }
      }

    }
  } catch (Exception $e) {
        echo 'Caught exception: ',  $e->getMessage(), "\n";
  }
}

//var_dump($paths);
$json_string = json_encode($OUTPUT);
$jsonFile = "New-filmDB.json";
echo "\nWritting Json to $jsonFile\n";
file_put_contents($jsonFile, $json_string);
echo "\nDONE MOFO!\n";
bug("</pre>");  