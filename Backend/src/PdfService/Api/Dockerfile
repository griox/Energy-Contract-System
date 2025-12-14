FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
# Switch to root to install dependencies
USER root
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

# Install dependencies for PuppeteerSharp (Chrome/Chromium)
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    fonts-dejavu \
    && rm -rf /var/lib/apt/lists/*

# Set environment variable for PuppeteerSharp to locate Chromium
ENV PUPPETEER_EXECUTABLE_PATH="/usr/bin/chromium"

# Switch back to non-root user if desired, but Puppeteer often needs specific flags or root
# For simplicity in this setup, we keep running as root or ensure sandbox is disabled in code
# USER $APP_UID 

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

COPY ["Api.csproj", "./"]
RUN dotnet restore "./Api.csproj"

COPY . .
WORKDIR "/src"
RUN dotnet build "./Api.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./Api.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Api.dll"]