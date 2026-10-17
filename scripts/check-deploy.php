<?php
require "/var/www/html/vendor/autoload.php";
$app = require_once "/var/www/html/bootstrap/app.php";
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$deployment = App\Models\ApplicationDeploymentQueue::latest()->first();
if ($deployment) {
    echo "Latest Deployment UUID: " . $deployment->deployment_uuid . "\n";
    echo "Status: " . $deployment->status . "\n";
    $logs = explode("\n", $deployment->logs ?? "");
    $lastLines = array_slice($logs, -15);
    echo "Logs snippet:\n" . implode("\n", $lastLines) . "\n";
} else {
    echo "No deployments found\n";
}
