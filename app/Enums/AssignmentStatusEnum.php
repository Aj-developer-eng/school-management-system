<?php

namespace App\Enums;

enum AssignmentStatusEnum: string
{
    case Pending = 'pending';
    case Started = 'started';
    case Completed = 'completed';

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
            self::Pending => 'Pending',
            self::Started => 'Started',
            self::Completed => 'Completed',
        };
    }
}
