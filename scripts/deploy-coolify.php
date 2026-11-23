<?php

use App\Models\Application;

$app = Application::find(5);
if (!$app) {
    echo "Application 5 not found\n";
    exit(1);
}

$uuid = new_public_id();
echo "Triggering deployment for {$app->name} with uuid: {$uuid}\n";

$result = queue_application_deployment(
    application: $app,
    deployment_uuid: $uuid,
    force_rebuild: true
);

echo "Queue result:\n";
print_r($result);
