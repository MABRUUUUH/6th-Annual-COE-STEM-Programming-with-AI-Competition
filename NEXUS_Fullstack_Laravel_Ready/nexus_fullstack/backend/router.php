<?php
declare(strict_types=1);
/* Zero-dependency development server. Laravel deployment uses the same GameStore. */
$uri=parse_url($_SERVER['REQUEST_URI'],PHP_URL_PATH);
if(str_starts_with($uri,'/api/')){
 header('Content-Type: application/json; charset=utf-8');header('Cache-Control: no-store');header('X-Content-Type-Options: nosniff');
 require_once __DIR__.'/src/GameStore.php';
 try{
  $store=new GameStore(__DIR__.'/data');$method=$_SERVER['REQUEST_METHOD'];
  $body=($method==='POST')?json_decode(file_get_contents('php://input'),true,32,JSON_THROW_ON_ERROR):[];
  if(!is_array($body))throw new InvalidArgumentException('JSON object expected');
  if($uri==='/api/sessions'&&$method==='POST')$data=$store->create();
  elseif(preg_match('#^/api/sessions/([a-f0-9]{32})(?:/(setup|events|reset))?$#',$uri,$m)){
    $id=$m[1];$action=$m[2]??null;
    if($method==='GET'&&$action===null)$data=$store->get($id);
    elseif($method==='POST'&&$action!==null)$data=$store->mutate($id,['events'=>'event','setup'=>'setup','reset'=>'reset'][$action],$body);
    else{http_response_code(405);throw new InvalidArgumentException('Unsupported method');}
  }else{http_response_code(404);throw new InvalidArgumentException('Unknown endpoint');}
  echo json_encode(['ok'=>true,'data'=>$data],JSON_THROW_ON_ERROR);
 }catch(Throwable $e){if(http_response_code()===200)http_response_code($e instanceof InvalidArgumentException?422:500);echo json_encode(['ok'=>false,'error'=>$e->getMessage()]);}
 exit;
}
$public=realpath(__DIR__.'/../ADU Hackathon');$path=realpath($public.($uri==='/'?'/index.html':$uri));
if($path&&str_starts_with($path,$public.DIRECTORY_SEPARATOR)&&is_file($path))return false;
http_response_code(404);echo 'Not found';
