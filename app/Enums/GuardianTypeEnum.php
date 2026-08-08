<?php

namespace App\Enums;

enum GuardianTypeEnum: string
{
    case Father = 'Father';
    case Mother = 'Mother';
    case Guardian = 'Guardian';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
