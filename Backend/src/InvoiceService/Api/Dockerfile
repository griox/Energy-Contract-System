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

# --- BƯỚC 1: COPY FILE CSPROJ (XÓA Backend/) ---

# Copy Shared.Logging
COPY ["Shared.Logging/Shared.Logging.csproj", "Shared.Logging/"]

# Copy InvoiceService Api
COPY ["src/InvoiceService/Api/Api.csproj", "src/InvoiceService/Api/"]

# Restore
RUN dotnet restore "src/InvoiceService/Api/Api.csproj"

# --- BƯỚC 2: COPY SOURCE CODE (XÓA Backend/) ---

# Copy code Shared.Logging
COPY ["Shared.Logging/", "Shared.Logging/"]

# Copy code InvoiceService
COPY ["src/InvoiceService/", "src/InvoiceService/"]

# --- BƯỚC 3: BUILD & PUBLISH ---
# Chuyển vào thư mục chứa file csproj
WORKDIR "/src/src/InvoiceService/Api"

RUN dotnet build "Api.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "Api.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

# 4. Final
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
# LƯU Ý: Đổi tên file DLL theo tên project của bạn.
# Nếu tên project là "InvoiceService.Api" thì để như dưới. Nếu chỉ là "Api" thì để "Api.dll"
ENTRYPOINT ["dotnet", "Api.dll"]