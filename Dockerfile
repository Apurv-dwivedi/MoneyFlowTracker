# Java 21 wala Maven image build ke liye
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app
COPY . .
WORKDIR /app/Backend
RUN mvn clean package -DskipTests

# Java 21 wala image run karne ke liye
FROM eclipse-temurin:21-jdk-jammy
WORKDIR /app
COPY --from=build /app/Backend/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]