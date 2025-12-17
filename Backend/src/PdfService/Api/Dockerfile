# 1. Base Image (Runtime)
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
# Cài đặt các thư viện cần thiết cho xử lý Font/PDF (nếu cần)
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

# 👇 QUAN TRỌNG: Sửa đường dẫn COPY cho đúng cấu trúc thư mục
COPY ["Backend/src/PdfService/Api/Api.csproj", "Backend/src/PdfService/Api/"]



# Restore
RUN dotnet restore "Backend/src/PdfService/Api/Api.csproj"

# Copy toàn bộ code
COPY . .

# 👇 Chuyển Workdir vào đúng thư mục chứa code PdfService
WORKDIR "/src/Backend/src/PdfService/Api"

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