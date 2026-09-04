<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('usuarios', function (Blueprint $table) {
            // Código do líder (tabela users) que indicou este apoiador
            $table->char('lider_referral_code', 8)->nullable()->after('indicador_id');
            $table->index('lider_referral_code');
        });
    }

    public function down(): void
    {
        Schema::table('usuarios', function (Blueprint $table) {
            $table->dropIndex(['lider_referral_code']);
            $table->dropColumn('lider_referral_code');
        });
    }
};
