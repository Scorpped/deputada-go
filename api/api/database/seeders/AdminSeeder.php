<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $email = 'admin@admin.com';

        User::firstOrCreate(
            ['email' => $email],
            [
                'name'     => 'Admin',
                'password' => Hash::make('password'),
                'role'     => 'admin',
                'active'   => true,
            ]
        );
    }
}
