# 1. Base Image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
USER $APP_UID
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

# 2. Build Image
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

# 👇 QUAN TRỌNG: Copy file csproj từ đường dẫn gốc
COPY ["Backend/src/EmailService/Api/Api.csproj", "Backend/src/EmailService/Api/"]

COPY ["Backend/Shared.Logging/", "Backend/Shared.Logging/"]

# Restore
RUN dotnet restore "Backend/src/EmailService/Api/Api.csproj"

# Copy toàn bộ code
COPY . .

# 👇 Chuyển Workdir vào đúng thư mục chứa code EmailService
WORKDIR "/src/Backend/src/EmailService/Api"

# Build
RUN dotnet build "Api.csproj" -c $BUILD_CONFIGURATION -o /app/build

# 3. Publish
FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "Api.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

# 4. Final
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Api.dll"]