FROM maven:3.8.5-openjdk-17 AS build
WORKDIR /app
COPY . .
# Docker ko Backend folder ke andar bheja
WORKDIR /app/Backend
RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jdk-jammy
WORKDIR /app
# Target folder bhi ab Backend ke andar hai, wahan se jar copy kiya
COPY --from=build /app/Backend/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]