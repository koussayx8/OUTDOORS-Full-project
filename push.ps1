# PowerShell script to push Docker images

$USERNAME = "koussayblh"  # Replace with your Docker Hub username
$APP_NAME = "outdoors-app"  # Replace with your application name

# Array of services to push
$SERVICES = @("user-service", "frontend", "eureka-server", "mysql", "forum-service", "camping-service", "event-service", "formation-service", "transport-service", "marketplace-service")

foreach ($service in $SERVICES) {
    Write-Host "Tagging and pushing $service..."
    $local_image = "deployment-$service"
    $remote_image = "$USERNAME/$APP_NAME-$service`:latest"
    
    docker tag $local_image $remote_image
    docker push $remote_image
}

Write-Host "All images pushed successfully to Docker Hub!"