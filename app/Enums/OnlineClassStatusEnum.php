<?php

namespace App\Enums;

enum OnlineClassStatusEnum: string
{
    case Active = 'active';
    case Disabled = 'disabled';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    public function label(): string
    {
        return match ($this) {
            self::Active => 'Active',
            self::Disabled => 'Disabled',
        };
    }
}
