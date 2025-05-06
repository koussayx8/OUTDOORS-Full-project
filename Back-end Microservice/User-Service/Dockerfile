FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /workspace/app

# Copy maven files first for better layer caching
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .
COPY src src

RUN chmod +x mvnw
ENV MAVEN_OPTS="-Dfile.encoding=UTF-8"
ENV JAVA_TOOL_OPTIONS="-Dfile.encoding=UTF-8"

# Build the application
RUN ./mvnw install -DskipTests
RUN mkdir -p target/dependency && (cd target/dependency; jar -xf ../*.jar)

# Runtime stage
FROM eclipse-temurin:17-jre-alpine
VOLUME /tmp
ARG DEPENDENCY=/workspace/app/target/dependency

# Copy over the layers from the build stage
COPY --from=build ${DEPENDENCY}/BOOT-INF/lib /app/lib
COPY --from=build ${DEPENDENCY}/META-INF /app/META-INF
COPY --from=build ${DEPENDENCY}/BOOT-INF/classes /app

# Set startup command
ENTRYPOINT ["java","-cp","app:app/lib/*","tn.esprit.spring.userservice.UserServiceApplication"]

# Run as non-root user for security
RUN addgroup -S spring && adduser -S spring -G spring
USER spring