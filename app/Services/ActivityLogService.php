<?php

namespace App\Services;

use App\Models\ActivityLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class ActivityLogService
{
    public static function log(
        string $module,
        string $action,
        string $description,
        ?Model $subject = null,
        array $properties = [],
    ): ActivityLog {
        return ActivityLog::create([
            'user_id' => Auth::id(),
            'module' => $module,
            'action' => $action,
            'description' => $description,
            'subject_type' => $subject ? get_class($subject) : null,
            'subject_id' => $subject?->id,
            'properties' => !empty($properties) ? $properties : null,
            'ip_address' => Request::ip(),
            'user_agent' => Request::userAgent(),
        ]);
    }

    public static function created(string $module, Model $subject, string $description, array $properties = []): ActivityLog
    {
        return self::log($module, 'created', $description, $subject, $properties);
    }

    public static function updated(string $module, Model $subject, string $description, array $properties = []): ActivityLog
    {
        return self::log($module, 'updated', $description, $subject, $properties);
    }

    public static function deleted(string $module, Model $subject, string $description, array $properties = []): ActivityLog
    {
        return self::log($module, 'deleted', $description, $subject, $properties);
    }

    public static function custom(string $module, string $action, string $description, array $properties = []): ActivityLog
    {
        return self::log($module, $action, $description, null, $properties);
    }
}
