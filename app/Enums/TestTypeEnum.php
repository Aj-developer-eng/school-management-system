<?php

namespace App\Enums;

enum TestTypeEnum: string
{
    case Quiz = 'quiz';
    case ClassTest = 'class_test';
    case MidTerm = 'mid_term';
    case FinalTerm = 'final_term';
    case Assignment = 'assignment';
    case Oral = 'oral';
    case Practical = 'practical';

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
            self::Quiz => 'Quiz',
            self::ClassTest => 'Class Test',
            self::MidTerm => 'Mid Term',
            self::FinalTerm => 'Final Term',
            self::Assignment => 'Assignment',
            self::Oral => 'Oral',
            self::Practical => 'Practical',
        };
    }
}
