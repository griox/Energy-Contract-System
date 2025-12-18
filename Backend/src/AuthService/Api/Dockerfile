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

# 👇 SỬA Ở ĐÂY: Thêm '/Api/' vào đường dẫn
COPY ["Backend/src/AuthService/Api/Api.csproj", "Backend/src/AuthService/Api/"]

COPY ["Backend/Shared.Logging/", "Backend/Shared.Logging/"]

# 👇 SỬA Ở ĐÂY: Restore đúng đường dẫn file
RUN dotnet restore "Backend/src/AuthService/Api/Api.csproj"

# Copy toàn bộ code
COPY . .

# 👇 SỬA Ở ĐÂY: Chuyển Workdir vào sâu bên trong thư mục Api
WORKDIR "/src/Backend/src/AuthService/Api"

# Build (Lúc này đang đứng cạnh file Api.csproj nên lệnh này đúng)
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