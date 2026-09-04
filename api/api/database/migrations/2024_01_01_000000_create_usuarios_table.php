<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('usuarios', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('nome', 191);
            $table->string('whatsapp', 11)->unique();
            $table->date('data_nascimento');
            $table->string('endereco', 500);
            $table->string('cidade', 191);
            $table->string('email', 191)->unique();
            $table->char('referral_code', 8)->unique();
            $table->unsignedBigInteger('indicador_id')->nullable();
            $table->timestamp('lgpd_aceito_em');
            $table->timestamps();

            $table->foreign('indicador_id')
                  ->references('id')
                  ->on('usuarios')
                  ->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('usuarios');
    }
};
