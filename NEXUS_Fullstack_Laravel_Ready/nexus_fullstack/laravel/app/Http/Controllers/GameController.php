<?php
namespace App\Http\Controllers;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use GameStore;
class GameController extends Controller {
 private function store():GameStore {return new GameStore(dirname(base_path()).'/backend/data');}
 public function create(){return response()->json(['ok'=>true,'data'=>$this->store()->create()]);}
 public function show(string $id){return response()->json(['ok'=>true,'data'=>$this->store()->get($id)]);}
 public function setup(Request $request,string $id){return $this->change($id,'setup',$request->all());}
 public function event(Request $request,string $id){return $this->change($id,'event',$request->all());}
 public function reset(string $id){return $this->change($id,'reset',[]);}
 private function change(string $id,string $action,array $data){try{return response()->json(['ok'=>true,'data'=>$this->store()->mutate($id,$action,$data)]);}catch(\InvalidArgumentException $e){return response()->json(['ok'=>false,'error'=>$e->getMessage()],422);}}
}
