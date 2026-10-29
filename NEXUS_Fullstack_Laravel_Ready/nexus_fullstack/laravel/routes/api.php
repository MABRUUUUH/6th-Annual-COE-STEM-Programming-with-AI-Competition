<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\GameController;
// Server owns scores, rejects duplicate finale and validates each action.
Route::post('/sessions',[GameController::class,'create']);
Route::get('/sessions/{id}',[GameController::class,'show']);
Route::post('/sessions/{id}/setup',[GameController::class,'setup']);
Route::post('/sessions/{id}/events',[GameController::class,'event']);
Route::post('/sessions/{id}/reset',[GameController::class,'reset']);
