<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Usuario extends Model
{
    protected $table = 'usuarios';

    protected $fillable = [
        'nome',
        'whatsapp',
        'data_nascimento',
        'endereco',
        'cidade',
        'email',
        'referral_code',
        'indicador_id',
        'lider_referral_code',
        'lgpd_aceito_em',
    ];

    protected $hidden = [
        'indicador_id',
        'updated_at',
    ];

    protected $appends = [
        'referral_link',
    ];

    protected $casts = [
        'lgpd_aceito_em' => 'datetime',
    ];

    /**
     * Quem me indicou (meu indicador).
     */
    public function indicador(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'indicador_id');
    }

    /**
     * Quem eu indiquei (meus indicados).
     */
    public function indicados(): HasMany
    {
        return $this->hasMany(Usuario::class, 'indicador_id');
    }

    /**
     * Accessor: retorna o link de indicação completo.
     */
    public function getReferralLinkAttribute(): string
    {
        return config('app.url') . '/cadastro?ref=' . $this->referral_code;
    }
}
