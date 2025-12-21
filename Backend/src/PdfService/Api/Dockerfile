# 1. Base Image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
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

# 2. Build Image
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /app 

# COPY file csproj (Dựa trên giả định Context là Root Repository)
COPY ["Shared.Logging/Shared.Logging.csproj", "Shared.Logging/"]
COPY ["src/PdfService/Api/Api.csproj", "src/PdfService/Api/"]

RUN dotnet restore "src/PdfService/Api/Api.csproj"

# COPY toàn bộ code
COPY ["Shared.Logging/", "Shared.Logging/"]
COPY ["src/PdfService/", "src/PdfService/"]

# Build
WORKDIR "/app/src/PdfService/Api"
RUN dotnet build "Api.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "Api.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

# 3. Final
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Api.dll"]