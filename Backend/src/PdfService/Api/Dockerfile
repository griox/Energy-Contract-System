# 1. Base Image (Runtime)
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
# Cài đặt các thư viện cần thiết cho xử lý Font/PDF (Chromium)
USER root
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    fonts-dejavu \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_EXECUTABLE_PATH="/usr/bin/chromium"

# 2. Build Image (SDK)
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

# --- BƯỚC 1: COPY FILE CSPROJ (ĐÃ SỬA: XÓA Backend/) ---

# Copy Shared.Logging
COPY ["Shared.Logging/Shared.Logging.csproj", "Shared.Logging/"]

# Copy PdfService Api
COPY ["src/PdfService/Api/Api.csproj", "src/PdfService/Api/"]

# Restore
RUN dotnet restore "src/PdfService/Api/Api.csproj"

# --- BƯỚC 2: COPY SOURCE CODE (ĐÃ SỬA: XÓA Backend/) ---

# Copy code Shared.Logging
COPY ["Shared.Logging/", "Shared.Logging/"]

# Copy code PdfService
COPY ["src/PdfService/", "src/PdfService/"]

# --- BƯỚC 3: BUILD & PUBLISH ---
# Chuyển vào thư mục chứa file csproj
WORKDIR "/src/src/PdfService/Api"

RUN dotnet build "Api.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "Api.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

# 4. Final
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
# LƯU Ý: Kiểm tra tên file DLL. Nếu project tên là PdfService.Api thì giữ nguyên dòng dưới.
ENTRYPOINT ["dotnet", "Api.dll"]