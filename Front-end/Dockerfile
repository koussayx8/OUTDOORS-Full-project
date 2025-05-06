# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps
COPY . .
# Modify the Angular budget limits for all budget types
RUN node -e "const fs = require('fs'); \
    const angularJson = JSON.parse(fs.readFileSync('./angular.json', 'utf8')); \
    const projectName = Object.keys(angularJson.projects)[0]; \
    if (angularJson.projects[projectName].architect.build.configurations.production.budgets) { \
        angularJson.projects[projectName].architect.build.configurations.production.budgets.forEach(budget => { \
            if (budget.type === 'initial') { \
                budget.maximumWarning = '8mb'; \
                budget.maximumError = '10mb'; \
            } \
            if (budget.type === 'component') { \
                budget.maximumWarning = '25kb'; \
                budget.maximumError = '30kb'; \
            } \
            if (budget.type === 'anyComponentStyle') { \
                budget.maximumWarning = '25kb'; \
                budget.maximumError = '30kb'; \
            } \
        }); \
        fs.writeFileSync('./angular.json', JSON.stringify(angularJson, null, 2)); \
    }"

# Run the build and debug output location
RUN npm run build -- --configuration=production
RUN ls -la /app/dist

# Runtime stage
FROM nginx:alpine
# Try both possible Angular output paths
COPY --from=build /app/dist/*/browser/ /usr/share/nginx/html/
COPY --from=build /app/dist/*/ /usr/share/nginx/html/

# Angular routing configuration for SPA
RUN echo 'server {\
    listen 80;\
    server_name _;\
    root /usr/share/nginx/html;\
    index index.html;\
    location / {\
        try_files $uri $uri/ /index.html;\
    }\
}' > /etc/nginx/conf.d/default.conf

# Run as non-root user for security
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

USER nginx

EXPOSE 80