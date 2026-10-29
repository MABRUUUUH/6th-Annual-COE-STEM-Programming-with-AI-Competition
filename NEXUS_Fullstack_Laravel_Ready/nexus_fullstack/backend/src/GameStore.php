<?php
declare(strict_types=1);

/** Durable, locked JSON game store. Both native PHP and Laravel use the same rules. */
final class GameStore {
    public function __construct(private string $directory) {
        if (!is_dir($directory) && !mkdir($directory, 0770, true) && !is_dir($directory)) throw new RuntimeException('Storage unavailable');
    }
    private function file(string $id): string {
        if (!preg_match('/^[a-f0-9]{32}$/D', $id)) throw new InvalidArgumentException('Invalid session ID');
        return $this->directory . '/' . $id . '.json';
    }
    public function create(): array {
        $id=bin2hex(random_bytes(16));
        $state=['id'=>$id,'teams'=>['A'=>'Comets','B'=>'Orbit'],'players'=>[['name'=>'Player 1','team'=>'A'],['name'=>'Player 2','team'=>'B']],'scores'=>['A'=>0,'B'=>0],'events'=>[],'round'=>1,'createdAt'=>gmdate('c'),'updatedAt'=>gmdate('c')];
        $f=fopen($this->file($id),'x'); if (!$f) throw new RuntimeException('Unable to create session');
        fwrite($f,json_encode($state,JSON_THROW_ON_ERROR));fclose($f);
        return $state;
    }
    public function get(string $id): array {return $this->transaction($id,static fn(array $s): array => [$s,false]);}
    public function mutate(string $id,string $action,array $input): array {
        return $this->transaction($id,function(array $s) use($action,$input):array {
            if ($action==='setup') {
                $teams=$input['teams']??null;$players=$input['players']??null;
                if (!is_array($teams)||!is_array($players)||count($players)<2||count($players)>6) throw new InvalidArgumentException('Enter 2–6 players');
                $clean=[];$names=[];
                foreach(['A','B'] as $t){$n=trim((string)($teams[$t]??''));if($n===''||mb_safe_len($n)>24)throw new InvalidArgumentException('Invalid team name');$clean[$t]=$n;}
                if(strcasecmp($clean['A'],$clean['B'])===0)throw new InvalidArgumentException('Team names must be unique');
                $counts=['A'=>0,'B'=>0];$roster=[];
                foreach($players as $p){$n=trim((string)($p['name']??''));$t=$p['team']??null;if($n===''||mb_safe_len($n)>24||!isset($counts[$t])||in_array(mb_strtolower_safe($n),$names,true))throw new InvalidArgumentException('Players need unique names and valid teams');$names[]=mb_strtolower_safe($n);$counts[$t]++;$roster[]=['name'=>$n,'team'=>$t];}
                if(!$counts['A']||!$counts['B'])throw new InvalidArgumentException('Both teams need players');
                if(count($s['events'])>0)throw new InvalidArgumentException('Reset scores before editing an active lineup');
                $s['teams']=$clean;$s['players']=$roster;
            } elseif($action==='event') {
                $s['events'][]=$this->event($s,$input);$s['scores']=['A'=>0,'B'=>0];foreach($s['events'] as $e)if($e['status']==='VERIFIED')$s['scores'][$e['team']]+=$e['points'];
            } elseif($action==='reset') {
                $s['scores']=['A'=>0,'B'=>0];$s['events']=[];$s['round']++;
            } else throw new InvalidArgumentException('Unknown action');
            $s['updatedAt']=gmdate('c');return [$s,true];
        });
    }
    private function event(array $s,array $d):array {
        $game=$d['game']??'';$team=$d['team']??'';$player=trim((string)($d['player']??''));$details=$d['details']??[];$description=(string)($d['description']??'');
        if(!in_array($game,['football','memory','engineers','rhythm','protocol'],true)||!in_array($team,['A','B'],true))throw new InvalidArgumentException('Invalid game or team');
        if(!is_array($details))throw new InvalidArgumentException('Invalid event details');
        if($player!=='Family team'&&!in_array(['name'=>$player,'team'=>$team],$s['players'],true))throw new InvalidArgumentException('Player does not belong to that team');
        if($player==='Family team'&&$game!=='protocol')throw new InvalidArgumentException('Select a valid player');
        $points=0;$status='VERIFIED';$source='Server-validated game action';
        if($game==='football'){
            $allowed=['Referee-confirmed goal'=>5,'Successful pass'=>1,'Individual mission completed'=>3,'Potential goal — requires review'=>0];
            if(!array_key_exists($description,$allowed))throw new InvalidArgumentException('Invalid football action');
            $points=$allowed[$description];if($description==='Potential goal — requires review'){$status='UNCERTAIN';$source='Manual review required';}else $source='User-confirmed referee decision';
        }elseif($game==='memory'){
            $answers=[0=>'Dallah coffee pot',1=>'Dhow boat',2=>'Date palm'];
            if(!preg_match('/^Heritage question ([1-3]): (correct|incorrect) answer$/',$description,$m))throw new InvalidArgumentException('Invalid memory question');
            $i=(int)$m[1]-1;
            foreach($s['events'] as $e)if($e['game']==='memory'&&($e['details']['questionIndex']??-1)===$i&&$e['team']===$team)throw new InvalidArgumentException('Question already scored for this team');
            $selected=(string)($details['selected']??$details['answer']??'');$points=$selected===$answers[$i]?10:0;
            $description='Heritage question '.($i+1).($points?': correct answer':': incorrect answer');$details=['questionIndex'=>$i,'selected'=>$selected];$source='Server-checked heritage answer';
        }elseif($game==='engineers'){
            $height=$details['heightCm']??null;$stable=$details['stable']??null;
            if(!is_numeric($height)||(float)$height<1||(float)$height>500||!is_bool($stable))throw new InvalidArgumentException('Height must be 1–500 cm and stability confirmed');
            $points=(int)round((float)$height)+($stable?10:0);$description='Tower measured '.(float)$height.' cm'.($stable?' and passed stability test':'; stability test failed');$source='Witness-confirmed measurement (not computer vision)';
        }elseif($game==='rhythm'){
            $intervals=$details['intervalsMs']??null;
            if(!is_array($intervals)||count($intervals)!==2||!is_numeric($intervals[0])||!is_numeric($intervals[1])||$intervals[0]<80||$intervals[1]<80||$intervals[0]>5000||$intervals[1]>5000)throw new InvalidArgumentException('Invalid tap intervals');
            $err=(abs((float)$intervals[0]-500)+abs((float)$intervals[1]-500))/2;$points=$err<80?10:($err<180?6:0);$description='Rhythm attempt: average interval error '.round($err).' ms';$details=['intervalsMs'=>array_values($intervals),'averageErrorMs'=>round($err)];$source='Submitted browser tap intervals';
        }else {
            $verified=[];foreach($s['events'] as $e){if($e['status']==='VERIFIED'&&$e['points']>0&&$e['game']!=='protocol')$verified[$e['game']]=true;if($e['game']==='protocol')throw new InvalidArgumentException('Final protocol already awarded');}
            if(count($verified)<2)throw new InvalidArgumentException('Complete two different trials first');
            $points=15;$description='Cooperative Final Protocol completed';$source='Server-verified trial prerequisites';$details=['prerequisiteTrials'=>array_keys($verified)];
        }
        return ['id'=>bin2hex(random_bytes(16)),'timestamp'=>gmdate('c'),'displayTime'=>gmdate('H:i:s').' UTC','game'=>$game,'description'=>$description,'points'=>$points,'team'=>$team,'player'=>$player,'source'=>$source,'confidence'=>$status==='VERIFIED'?1:0.35,'status'=>$status,'details'=>$details];
    }
    private function transaction(string $id,callable $callback):array{
        $path=$this->file($id);$f=@fopen($path,'c+');if(!$f)throw new RuntimeException('Session unavailable');
        try {if(!flock($f,LOCK_EX))throw new RuntimeException('Storage lock unavailable');$raw=stream_get_contents($f);if(!$raw)throw new InvalidArgumentException('Session not found');$s=json_decode($raw,true,512,JSON_THROW_ON_ERROR);[$state,$changed]=$callback($s);if($changed){rewind($f);ftruncate($f,0);fwrite($f,json_encode($state,JSON_THROW_ON_ERROR|JSON_UNESCAPED_UNICODE));fflush($f);}flock($f,LOCK_UN);return $state;}finally{fclose($f);}
    }
}
function mb_safe_len(string $s):int{return function_exists('mb_strlen')?mb_strlen($s):strlen($s);}
function mb_strtolower_safe(string $s):string{return function_exists('mb_strtolower')?mb_strtolower($s):strtolower($s);}
