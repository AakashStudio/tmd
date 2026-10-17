<?php
require "/var/www/html/vendor/autoload.php";
$app = require_once "/var/www/html/bootstrap/app.php";
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$application = App\Models\Application::where("uuid", "qokiq84lofoguihaq5x93xbv")->first();
if ($application) {
    echo "App found: " . $application->name . "\n";
    $d_uuid = (string) Illuminate\Support\Str::uuid();
    queue_application_deployment(
        application: $application,
        deployment_uuid: $d_uuid,
        force_rebuild: true
    );
    echo "Deployment queued with UUID: " . $d_uuid . "\n";
} else {
    echo "App not found\n";
}
