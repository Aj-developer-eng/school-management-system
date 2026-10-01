<?php

namespace App\Http\Controllers;

use App\Services\ActivityLogService;
use App\Services\DatabaseBackupService;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class BackupController extends Controller
{
    public function __construct(private readonly DatabaseBackupService $backups) {}

    /**
     * Download a full SQL dump of the database.
     */
    public function download(Request $request): StreamedResponse
    {
        abort_unless($request->user()->can('backups.download'), 403);

        ActivityLogService::custom('Backups', 'downloaded', 'Downloaded a database backup');

        return $this->backups->download();
    }
}
