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

# 👇 QUAN TRỌNG: Copy file csproj từ đường dẫn gốc (Backend/src/...)
# Giả định thư mục là InvoiceService, nếu tên khác hãy sửa lại nhé
COPY ["Backend/src/InvoiceService/Api/Api.csproj", "Backend/src/InvoiceService/Api/"]

COPY ["Backend/Shared.Logging/", "Backend/Shared.Logging/"]

# Restore
RUN dotnet restore "Backend/src/InvoiceService/Api/Api.csproj"

# Copy toàn bộ code từ Root vào Image
COPY . .

# 👇 Chuyển Workdir vào đúng thư mục chứa code InvoiceService
WORKDIR "/src/Backend/src/InvoiceService/Api"

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