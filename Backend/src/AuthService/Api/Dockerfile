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

# --- BƯỚC 1: COPY FILE CSPROJ (Xóa chữ Backend/ đi) ---

# Copy Shared.Logging (Nếu AuthService có dùng thư viện này)
COPY ["Shared.Logging/Shared.Logging.csproj", "Shared.Logging/"]

# Copy AuthService Api
COPY ["src/AuthService/Api/Api.csproj", "src/AuthService/Api/"]

# Restore
RUN dotnet restore "src/AuthService/Api/Api.csproj"

# --- BƯỚC 2: COPY SOURCE CODE (Xóa chữ Backend/ đi) ---

# Copy toàn bộ code Shared.Logging
COPY ["Shared.Logging/", "Shared.Logging/"]

# Copy toàn bộ code AuthService
COPY ["src/AuthService/", "src/AuthService/"]

# --- BƯỚC 3: BUILD & PUBLISH ---
# Chuyển vào đúng thư mục chứa file csproj để build
WORKDIR "/src/src/AuthService/Api"

RUN dotnet build "Api.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "Api.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

# 4. Final
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "AuthService.Api.dll"] 
# Lưu ý: Tên file DLL (AuthService.Api.dll) phải đúng với tên Project của bạn trong Visual Studio