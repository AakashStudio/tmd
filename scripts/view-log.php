<?php
require "/var/www/html/vendor/autoload.php";
$app = require_once "/var/www/html/bootstrap/app.php";
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$uuid = $argv[1] ?? null;
if ($uuid) {
    $deployment = App\Models\ApplicationDeploymentQueue::where("deployment_uuid", $uuid)->first();
} else {
    $deployment = App\Models\ApplicationDeploymentQueue::orderBy("id", "desc")->first();
}

if ($deployment) {
    echo "=== DEPLOYMENT: " . $deployment->deployment_uuid . " | STATUS: " . $deployment->status . " ===\n";
    $raw = $deployment->logs ?? "[]";
    $entries = json_decode($raw, true);
    if (is_array($entries)) {
        foreach (array_slice($entries, -15) as $e) {
            echo "CMD: " . ($e['command'] ?? 'NONE') . "\n";
            echo "OUT: " . ($e['output'] ?? '') . "\n";
            echo "----------------------------------------\n";
        }
    }
}
