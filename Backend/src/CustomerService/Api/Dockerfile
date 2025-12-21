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

# --- BƯỚC 1: COPY FILE CSPROJ ---
# Lưu ý: Đã xóa "Backend/" ở đầu đường dẫn source và destination

# Copy file csproj của Shared.Logging
COPY ["Shared.Logging/Shared.Logging.csproj", "Shared.Logging/"]

# Copy các file csproj của CustomerService
COPY ["src/CustomerService/Api/Api.csproj", "src/CustomerService/Api/"]
COPY ["src/CustomerService/Application/Application.csproj", "src/CustomerService/Application/"]
COPY ["src/CustomerService/Domain/Domain.csproj", "src/CustomerService/Domain/"]
COPY ["src/CustomerService/Infrastructure/Infrastructure.csproj", "src/CustomerService/Infrastructure/"]

# Restore
RUN dotnet restore "src/CustomerService/Api/Api.csproj"

# --- BƯỚC 2: COPY SOURCE CODE ---

# Copy toàn bộ code của thư viện Shared
COPY ["Shared.Logging/", "Shared.Logging/"]

# Copy toàn bộ code của CustomerService
COPY ["src/CustomerService/", "src/CustomerService/"]

# --- BƯỚC 3: BUILD & PUBLISH ---
# Lưu ý quan trọng: Vì ta copy vào folder "src" bên trong WORKDIR /src 
# nên đường dẫn thực tế bây giờ là /src/src/...
WORKDIR "/src/src/CustomerService/Api"

RUN dotnet build "Api.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "Api.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

# 4. Final
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "CustomerService.Api.dll"]