# ============================================
# Stage 1: Build (Maven ile derleme)
# ============================================
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn package -DskipTests -B

# ============================================
# Stage 2: Run (Sadece JAR dosyasini calistir)
# ============================================
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
COPY uploads/ ./uploads/
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
