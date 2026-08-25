<?php

namespace App\Enums;

enum TestStatusEnum: string
{
    case Announced = 'announced';
    case Conducted = 'conducted';
    case ResultsPublished = 'results_published';

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
            self::Announced => 'Announced',
            self::Conducted => 'Conducted',
            self::ResultsPublished => 'Results Published',
        };
    }
}
